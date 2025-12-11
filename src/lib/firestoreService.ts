import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { PurchaseRequisition, PurchaseRequisitionStatus } from '@/types/purchaseRequisition';

export interface SystemPromptVersion {
  id?: string;
  version: number;
  systemPrompt: string;
  evaluation: string;
  savedDate: Date;
  aiModel: string;
  temperature: number;
}

// Collection name for prompts
const PROMPTS_COLLECTION = 'professional_buyer_prompts';

export interface ContinuousImprovementSession {
  id?: string;
  promptKey: string; // References SystemPromptVersion.technicalKey
  chatSessionKey: string; // Unique identifier for this chat session
  userId: string;
  userEmail?: string; // User's email address
  userName?: string; // User's display name
  userFeedback?: 'thumbs_up' | 'thumbs_down' | null;
  userComment?: string; // Optional comment from user
  issueStatus?: 'fixed' | 'not_fixed'; // Status for negative feedback issues
  technicalLogs: TechnicalLog[];
  createdDate: Date;
  lastUpdated: Date;
}

export interface TechnicalLog {
  timestamp: Date;
  event: 'function_call_triggered' | 'function_call_success' | 'function_call_error' | 'ai_response' | 'user_message';
  userMessage?: string;
  functionName?: string;
  functionInputs?: Record<string, unknown>;
  functionOutputs?: Record<string, unknown>;
  aiResponse?: string;
  errorMessage?: string;
  aiRequestId?: string;
}

// LocalStorage fallback functions
const LOCAL_STORAGE_KEY = 'professional_buyer_prompts';

const saveToLocalStorage = (promptVersion: SystemPromptVersion): void => {
  const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  existing.push({
    ...promptVersion,
    id: `local_${Date.now()}`,
    savedDate: new Date().toISOString()
  });
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
};

const getFromLocalStorage = (): SystemPromptVersion[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return [];

  return JSON.parse(data).map((item: SystemPromptVersion) => ({
    ...item,
    savedDate: new Date(item.savedDate)
  }));
};

const getNextLocalVersion = (): number => {
  const existing = getFromLocalStorage();
  if (existing.length === 0) return 1;
  return Math.max(...existing.map(v => v.version)) + 1;
};

// Save a new version of system prompt (global, not user-specific)
export const savePromptVersion = async (
  promptText: string,
  aiModel: string = 'google/gemini-2.5-flash',
  temperature: number = 0.05,
  evaluation: string = ''
): Promise<number> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      const nextVersion = getNextLocalVersion();
      const promptVersion: SystemPromptVersion = {
        version: nextVersion,
        systemPrompt: promptText,
        evaluation: evaluation,
        savedDate: new Date(),
        aiModel: aiModel,
        temperature: temperature
      };
      saveToLocalStorage(promptVersion);
      console.log(`[LocalStorage] Saved prompt version ${nextVersion}`);
      return nextVersion;
    }

    // Try Firebase first
    const nextVersion = await getNextVersionNumber();

    const promptVersion: Omit<SystemPromptVersion, 'id'> = {
      version: nextVersion,
      systemPrompt: promptText,
      evaluation: evaluation,
      savedDate: new Date(),
      aiModel: aiModel,
      temperature: temperature
    };

    const docRef = await addDoc(collection(db, PROMPTS_COLLECTION), {
      ...promptVersion,
      savedDate: serverTimestamp()
    });

    console.log(`[FirestoreService] Saved prompt version ${nextVersion} with ID: ${docRef.id}`);
    return nextVersion;
  } catch (error) {
    console.warn('Firebase save failed, falling back to localStorage:', error);
    const nextVersion = getNextLocalVersion();
    const promptVersion: SystemPromptVersion = {
      version: nextVersion,
      systemPrompt: promptText,
      evaluation: evaluation,
      savedDate: new Date(),
      aiModel: aiModel,
      temperature: temperature
    };
    saveToLocalStorage(promptVersion);
    console.log(`[LocalStorage] Saved prompt version ${nextVersion} (fallback)`);
    return nextVersion;
  }
};

// Get the next version number (global)
const getNextVersionNumber = async (): Promise<number> => {
  if (!db) {
    return 1;
  }

  const q = query(collection(db, PROMPTS_COLLECTION));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return 1;
  }

  // Find highest version on client side
  const docs = querySnapshot.docs.map(doc => doc.data().version || 0);
  const latestVersion = Math.max(...docs);
  return latestVersion + 1;
};

// Load the latest prompt version (global)
export const loadLatestPrompt = async (): Promise<{ prompt: string; model: string; temperature: number } | null> => {
  try {
    console.log('🔍 Loading latest prompt from professional_buyer_prompts...');

    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      const versions = getFromLocalStorage();
      if (versions.length === 0) return null;
      const latest = versions.sort((a, b) => b.version - a.version)[0];
      return {
        prompt: latest.systemPrompt || '',
        model: latest.aiModel || 'google/gemini-2.5-flash',
        temperature: latest.temperature ?? 0.05
      };
    }

    const q = query(collection(db, PROMPTS_COLLECTION));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('📝 No prompts found in professional_buyer_prompts');
      return null;
    }

    // Sort by version on client side to find latest
    const docs = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      version: doc.data().version || 0
    }));

    const latestDoc = docs.reduce((latest, current) =>
      current.version > latest.version ? current : latest
    );

    console.log('✅ Latest prompt loaded:', {
      version: latestDoc.version,
      model: latestDoc.aiModel || 'google/gemini-2.5-flash'
    });

    return {
      prompt: latestDoc.systemPrompt || '',
      model: latestDoc.aiModel || 'google/gemini-2.5-flash',
      temperature: latestDoc.temperature ?? 0.05
    };
  } catch (error) {
    console.warn('Firebase load failed, falling back to localStorage:', error);
    const versions = getFromLocalStorage();
    if (versions.length === 0) return null;
    const latest = versions.sort((a, b) => b.version - a.version)[0];
    return {
      prompt: latest.systemPrompt || '',
      model: latest.aiModel || 'google/gemini-2.5-flash',
      temperature: latest.temperature ?? 0.05
    };
  }
};

// Alias for backward compatibility - delegates to loadLatestPrompt
export const loadUserPrompt = async (_userId?: string): Promise<{ prompt: string; model: string; temperature: number } | null> => {
  return await loadLatestPrompt();
};

// Get all prompt versions (for history browsing)
export const getPromptHistory = async (): Promise<SystemPromptVersion[]> => {
  try {
    console.log('📚 Loading prompt history from professional_buyer_prompts...');

    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      return getFromLocalStorage().sort((a, b) => b.version - a.version);
    }

    const q = query(collection(db, PROMPTS_COLLECTION));
    const querySnapshot = await getDocs(q);

    const history = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      savedDate: doc.data().savedDate?.toDate() || new Date()
    })) as SystemPromptVersion[];

    // Sort by version on client side
    const sortedHistory = history.sort((a, b) => b.version - a.version);

    console.log('✅ Prompt history loaded:', {
      versionCount: sortedHistory.length,
      latestVersion: sortedHistory[0]?.version || 'none'
    });

    return sortedHistory;
  } catch (error) {
    console.warn('Firebase history load failed, falling back to localStorage:', error);
    return getFromLocalStorage().sort((a, b) => b.version - a.version);
  }
};

// Get specific version by ID
export const getPromptVersion = async (versionId: string): Promise<SystemPromptVersion | null> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      const allVersions = getFromLocalStorage();
      return allVersions.find(v => v.id === versionId) || null;
    }

    const docRef = doc(db, PROMPTS_COLLECTION, versionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        savedDate: docSnap.data().savedDate?.toDate() || new Date()
      } as SystemPromptVersion;
    }

    return null;
  } catch (error) {
    console.warn('Firebase version load failed, falling back to localStorage:', error);
    const allVersions = getFromLocalStorage();
    return allVersions.find(v => v.id === versionId) || null;
  }
};

// Update evaluation for a specific version
export const updatePromptEvaluation = async (versionId: string, evaluation: string): Promise<void> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, updating localStorage fallback');
      const versions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const updated = versions.map((v: SystemPromptVersion) =>
        v.id === versionId ? { ...v, evaluation } : v
      );
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      return;
    }

    const docRef = doc(db, PROMPTS_COLLECTION, versionId);
    await setDoc(docRef, { evaluation }, { merge: true });
  } catch (error) {
    console.warn('Firebase evaluation update failed, falling back to localStorage:', error);
    const versions = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    const updated = versions.map((v: SystemPromptVersion) =>
      v.id === versionId ? { ...v, evaluation } : v
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }
};

// Continuous Improvement Functions
export const createContinuousImprovementSession = async (
  promptKey: string,
  chatSessionKey: string,
  userId: string,
  userEmail?: string,
  userName?: string
): Promise<string> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, cannot create continuous improvement session');
      return 'local_session_' + Date.now();
    }

    // Build session object with only defined values
    const sessionData: any = {
      promptKey,
      chatSessionKey,
      userId,
      userFeedback: null,
      technicalLogs: [],
      createdDate: serverTimestamp(),
      lastUpdated: serverTimestamp()
    };
    
    // Add optional fields only if they are defined
    if (userEmail) {
      sessionData.userEmail = userEmail;
    }
    if (userName) {
      sessionData.userName = userName;
    }

    const docRef = await addDoc(collection(db, 'continuous_improvement'), sessionData);

    console.log(`[ContinuousImprovement] Created session with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating continuous improvement session:', error);
    return 'error_session_' + Date.now();
  }
};

export const addTechnicalLog = async (
  sessionId: string,
  logEntry: Omit<TechnicalLog, 'timestamp'>
): Promise<void> => {
  try {
    if (!db || sessionId.startsWith('local_') || sessionId.startsWith('error_')) {
      console.warn('Firebase not initialized or invalid session, skipping log');
      return;
    }

    const sessionRef = doc(db, 'continuous_improvement', sessionId);
    const sessionDoc = await getDoc(sessionRef);

    if (sessionDoc.exists()) {
      const sessionData = sessionDoc.data();
      const existingLogs = sessionData.technicalLogs || [];
      
      // Clean the log entry - remove undefined values
      const cleanLogEntry: any = {
        event: logEntry.event,
        timestamp: new Date()
      };
      
      // Add only defined fields
      if (logEntry.userMessage !== undefined) {
        cleanLogEntry.userMessage = logEntry.userMessage;
      }
      if (logEntry.aiResponse !== undefined) {
        cleanLogEntry.aiResponse = logEntry.aiResponse;
      }
      if (logEntry.functionName !== undefined) {
        cleanLogEntry.functionName = logEntry.functionName;
      }
      if (logEntry.functionInputs !== undefined) {
        cleanLogEntry.functionInputs = logEntry.functionInputs;
      }
      if (logEntry.functionOutputs !== undefined) {
        cleanLogEntry.functionOutputs = logEntry.functionOutputs;
      }
      if (logEntry.errorMessage !== undefined) {
        cleanLogEntry.errorMessage = logEntry.errorMessage;
      }
      if (logEntry.aiRequestId !== undefined) {
        cleanLogEntry.aiRequestId = logEntry.aiRequestId;
      }
      
      const updatedLogs = [...existingLogs, cleanLogEntry];

      await updateDoc(sessionRef, {
        technicalLogs: updatedLogs,
        lastUpdated: serverTimestamp()
      });

      console.log(`[ContinuousImprovement] Added log to session ${sessionId}: ${logEntry.event}`);
    } else {
      console.error(`Session ${sessionId} not found`);
    }
  } catch (error) {
    console.error('Error adding technical log:', error);
  }
};

export const setUserFeedback = async (
  sessionId: string,
  feedback: 'thumbs_up' | 'thumbs_down',
  comment?: string
): Promise<void> => {
  try {
    if (!db || sessionId.startsWith('local_') || sessionId.startsWith('error_')) {
      console.warn('Firebase not initialized or invalid session, skipping feedback');
      return;
    }

    const sessionRef = doc(db, 'continuous_improvement', sessionId);
    const updateData: any = {
      userFeedback: feedback,
      lastUpdated: serverTimestamp()
    };

    if (comment !== undefined) {
      updateData.userComment = comment;
    }

    await setDoc(sessionRef, updateData, { merge: true });

    console.log(`[ContinuousImprovement] Set feedback for session ${sessionId}: ${feedback}${comment ? ' with comment' : ''}`);
  } catch (error) {
    console.error('Error setting user feedback:', error);
  }
};

export const getContinuousImprovementSessions = async (
  userId: string,
  promptKey?: string
): Promise<ContinuousImprovementSession[]> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, cannot get sessions');
      return [];
    }

    let q = query(
      collection(db, 'continuous_improvement'),
      where('userId', '==', userId)
    );

    if (promptKey) {
      q = query(q, where('promptKey', '==', promptKey));
    }

    const querySnapshot = await getDocs(q);
    
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdDate: doc.data().createdDate?.toDate() || new Date(),
      lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
    })) as ContinuousImprovementSession[];

    return sessions.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
  } catch (error) {
    console.error('Error getting continuous improvement sessions:', error);
    return [];
  }
};

// Get negative feedback sessions (for issue reporting)
export const getNegativeFeedbackSessions = async (
  userId?: string // If not provided, get all users' feedback
): Promise<ContinuousImprovementSession[]> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, cannot get negative feedback');
      return [];
    }

    let q = query(
      collection(db, 'continuous_improvement'),
      where('userFeedback', '==', 'thumbs_down')
    );

    if (userId) {
      q = query(q, where('userId', '==', userId));
    }

    const querySnapshot = await getDocs(q);
    
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdDate: doc.data().createdDate?.toDate() || new Date(),
      lastUpdated: doc.data().lastUpdated?.toDate() || new Date()
    })) as ContinuousImprovementSession[];

    return sessions.sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime());
  } catch (error) {
    console.error('Error getting negative feedback sessions:', error);
    return [];
  }
};

// Update issue status for negative feedback
export const updateIssueStatus = async (
  sessionId: string,
  status: 'fixed' | 'not_fixed'
): Promise<void> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, cannot update issue status');
      return;
    }

    const sessionRef = doc(db, 'continuous_improvement', sessionId);
    await setDoc(sessionRef, {
      issueStatus: status,
      lastUpdated: serverTimestamp()
    }, { merge: true });

    console.log(`[ContinuousImprovement] Updated issue status for session ${sessionId}: ${status}`);
  } catch (error) {
    console.error('Error updating issue status:', error);
  }
};

// =============================
// Purchase Requisition Firestore
// =============================

const PR_COLLECTION = 'purchase_requisitions';

export const createPurchaseRequisition = async (
  userId: string,
  requisition: Omit<PurchaseRequisition, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  if (!db) throw new Error('Firebase not initialized');
  const payload = {
    ...requisition,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, PR_COLLECTION), payload);
  return docRef.id;
};

export const listPurchaseRequisitions = async (userId: string): Promise<PurchaseRequisition[]> => {
  if (!db) return [];
  const q = query(collection(db, PR_COLLECTION), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() || new Date(), updatedAt: d.data().updatedAt?.toDate?.() || new Date() })) as PurchaseRequisition[];
};

export const getPurchaseRequisition = async (id: string): Promise<PurchaseRequisition | null> => {
  if (!db) return null;
  const ref = doc(db, PR_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  return { id: snap.id, ...data, createdAt: data.createdAt?.toDate?.() || new Date(), updatedAt: data.updatedAt?.toDate?.() || new Date() } as PurchaseRequisition;
};

export const updatePurchaseRequisition = async (id: string, update: Partial<PurchaseRequisition>): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  const ref = doc(db, PR_COLLECTION, id);
  const payload = { ...update, updatedAt: serverTimestamp() } as Record<string, unknown>;
  await setDoc(ref, payload, { merge: true });
};

export const setPurchaseRequisitionStatus = async (id: string, status: PurchaseRequisitionStatus): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  const ref = doc(db, PR_COLLECTION, id);
  await updateDoc(ref, { status, updatedAt: serverTimestamp() });
};

export const deletePurchaseRequisition = async (id: string): Promise<void> => {
  if (!db) throw new Error('Firebase not initialized');
  const ref = doc(db, PR_COLLECTION, id);
  await deleteDoc(ref);
};

