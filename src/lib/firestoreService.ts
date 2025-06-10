import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

export interface SystemPromptVersion {
  id?: string;
  version: number;
  systemPrompt: string;
  evaluation: string;
  savedDate: Date;
  aiModel: string;
  userId: string;
  technicalKey?: string; // New: username + version number
}

export interface ContinuousImprovementSession {
  id?: string;
  promptKey: string; // References SystemPromptVersion.technicalKey
  chatSessionKey: string; // Unique identifier for this chat session
  userId: string;
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
const getLocalStorageKey = (userId: string) => `promptVersions_${userId}`;

const saveToLocalStorage = (userId: string, promptVersion: SystemPromptVersion): void => {
  const key = getLocalStorageKey(userId);
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push({
    ...promptVersion,
    id: `local_${Date.now()}`,
    savedDate: new Date().toISOString()
  });
  localStorage.setItem(key, JSON.stringify(existing));
};

const getFromLocalStorage = (userId: string): SystemPromptVersion[] => {
  const key = getLocalStorageKey(userId);
  const data = localStorage.getItem(key);
  if (!data) return [];
  
  return JSON.parse(data).map((item: SystemPromptVersion) => ({
    ...item,
    savedDate: new Date(item.savedDate)
  }));
};

const getNextLocalVersion = (userId: string): number => {
  const existing = getFromLocalStorage(userId);
  if (existing.length === 0) return 1;
  return Math.max(...existing.map(v => v.version)) + 1;
};

// Generate technical key from user email and version
const generateTechnicalKey = (userEmail: string, version: number): string => {
  const username = userEmail.split('@')[0]; // Extract username part from email
  return `${username}_v${version}`;
};

// Save a new version of system prompt
export const savePromptVersion = async (
  userId: string, 
  promptText: string, 
  evaluation: string = '',
  aiModel: string = 'gemini-2.5-flash-preview-04-17',
  userEmail?: string
): Promise<number> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      const nextVersion = getNextLocalVersion(userId);
      const technicalKey = userEmail ? generateTechnicalKey(userEmail, nextVersion) : `user_${userId.substring(0, 8)}_v${nextVersion}`;
      const promptVersion: SystemPromptVersion = {
        version: nextVersion,
        systemPrompt: promptText,
        evaluation: evaluation,
        savedDate: new Date(),
        aiModel: aiModel,
        userId: userId,
        technicalKey: technicalKey
      };
      saveToLocalStorage(userId, promptVersion);
      console.log(`[LocalStorage] Saved prompt version ${nextVersion} with key ${technicalKey}`);
      return nextVersion;
    }

    // Try Firebase first
    const nextVersion = await getNextVersionNumber(userId);
    const technicalKey = userEmail ? generateTechnicalKey(userEmail, nextVersion) : `user_${userId.substring(0, 8)}_v${nextVersion}`;
    
    const promptVersion: Omit<SystemPromptVersion, 'id'> = {
      version: nextVersion,
      systemPrompt: promptText,
      evaluation: evaluation,
      savedDate: new Date(),
      aiModel: aiModel,
      userId: userId,
      technicalKey: technicalKey
    };

    const docRef = await addDoc(collection(db, 'systemPromptVersions'), {
      ...promptVersion,
      savedDate: serverTimestamp()
    });
    
    console.log(`[FirestoreService] Saved prompt version ${nextVersion} with ID: ${docRef.id} and key: ${technicalKey}`);
    return nextVersion;
  } catch (error) {
    console.warn('Firebase save failed, falling back to localStorage:', error);
    const nextVersion = getNextLocalVersion(userId);
    const technicalKey = userEmail ? generateTechnicalKey(userEmail, nextVersion) : `user_${userId.substring(0, 8)}_v${nextVersion}`;
    const promptVersion: SystemPromptVersion = {
      version: nextVersion,
      systemPrompt: promptText,
      evaluation: evaluation,
      savedDate: new Date(),
      aiModel: aiModel,
      userId: userId,
      technicalKey: technicalKey
    };
    saveToLocalStorage(userId, promptVersion);
    console.log(`[LocalStorage] Saved prompt version ${nextVersion} with key ${technicalKey} (fallback)`);
    return nextVersion;
  }
};

// Get the next version number for a user
const getNextVersionNumber = async (userId: string): Promise<number> => {
  if (!db) {
    return 1;
  }

  const q = query(
    collection(db, 'systemPromptVersions'),
    where('userId', '==', userId)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return 1;
  }
  
  // Find highest version on client side
  const docs = querySnapshot.docs.map(doc => doc.data().version || 0);
  const latestVersion = Math.max(...docs);
  return latestVersion + 1;
};

// Load the latest version of system prompt for a user
export const loadLatestPrompt = async (userId: string): Promise<string | null> => {
  try {
    console.log('🔍 Loading latest prompt for user:', userId.substring(0, 8) + '...');
    
    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      const versions = getFromLocalStorage(userId);
      if (versions.length === 0) return null;
      const latest = versions.sort((a, b) => b.version - a.version)[0];
      return latest.systemPrompt || null;
    }

    const q = query(
      collection(db, 'systemPromptVersions'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('📝 No user-specific prompts found for user:', userId.substring(0, 8) + '...');
      return null;
    }
    
    // Sort by version on client side to avoid index requirement
    const docs = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      version: doc.data().version || 0
    }));
    
    const latestDoc = docs.reduce((latest, current) => 
      current.version > latest.version ? current : latest
    );
    
    const latestPrompt = latestDoc.systemPrompt || null;
    
    console.log('✅ Latest prompt loaded for user:', {
      userId: userId.substring(0, 8) + '...',
      version: latestDoc.version,
      promptLength: latestPrompt?.length || 0
    });
    
    return latestPrompt;
  } catch (error) {
    console.warn('Firebase load failed, falling back to localStorage:', error);
    const versions = getFromLocalStorage(userId);
    if (versions.length === 0) return null;
    const latest = versions.sort((a, b) => b.version - a.version)[0];
    return latest.systemPrompt || null;
  }
};

// Get all versions for a user (for history browsing)
export const getPromptHistory = async (userId: string): Promise<SystemPromptVersion[]> => {
  try {
    console.log('📚 Loading prompt history for user:', userId.substring(0, 8) + '...');
    
    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      return getFromLocalStorage(userId).sort((a, b) => b.version - a.version);
    }

    const q = query(
      collection(db, 'systemPromptVersions'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    const history = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      savedDate: doc.data().savedDate?.toDate() || new Date()
    })) as SystemPromptVersion[];
    
    // Sort by version on client side to avoid index requirement
    const sortedHistory = history.sort((a, b) => b.version - a.version);
    
    console.log('✅ Prompt history loaded for user:', {
      userId: userId.substring(0, 8) + '...',
      versionCount: sortedHistory.length,
      latestVersion: sortedHistory[0]?.version || 'none'
    });
    
    return sortedHistory;
  } catch (error) {
    console.warn('Firebase history load failed, falling back to localStorage:', error);
    return getFromLocalStorage(userId).sort((a, b) => b.version - a.version);
  }
};

// Get specific version
export const getPromptVersion = async (versionId: string): Promise<SystemPromptVersion | null> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      const allVersions = getFromLocalStorage('evaluator'); // Using default user for localStorage
      return allVersions.find(v => v.id === versionId) || null;
    }

    const docRef = doc(db, 'systemPromptVersions', versionId);
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
    const allVersions = getFromLocalStorage('evaluator');
    return allVersions.find(v => v.id === versionId) || null;
  }
};

// Update evaluation for a specific version
export const updatePromptEvaluation = async (versionId: string, evaluation: string): Promise<void> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, updating localStorage fallback');
      const key = getLocalStorageKey('evaluator');
      const versions = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = versions.map((v: SystemPromptVersion) => 
        v.id === versionId ? { ...v, evaluation } : v
      );
      localStorage.setItem(key, JSON.stringify(updated));
      return;
    }

    const docRef = doc(db, 'systemPromptVersions', versionId);
    await setDoc(docRef, { evaluation }, { merge: true });
  } catch (error) {
    console.warn('Firebase evaluation update failed, falling back to localStorage:', error);
    const key = getLocalStorageKey('evaluator');
    const versions = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = versions.map((v: SystemPromptVersion) => 
      v.id === versionId ? { ...v, evaluation } : v
    );
    localStorage.setItem(key, JSON.stringify(updated));
  }
};

// Legacy functions for backward compatibility
export const savePrompt = async (userId: string, promptText: string): Promise<void> => {
  await savePromptVersion(userId, promptText);
};

export const loadPrompt = async (userId: string): Promise<string | null> => {
  return await loadLatestPrompt(userId);
};

// Continuous Improvement Functions
export const createContinuousImprovementSession = async (
  promptKey: string,
  chatSessionKey: string,
  userId: string
): Promise<string> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, cannot create continuous improvement session');
      return 'local_session_' + Date.now();
    }

    const session: Omit<ContinuousImprovementSession, 'id'> = {
      promptKey,
      chatSessionKey,
      userId,
      userFeedback: null,
      technicalLogs: [],
      createdDate: new Date(),
      lastUpdated: new Date()
    };

    const docRef = await addDoc(collection(db, 'continuous_improvement'), {
      ...session,
      createdDate: serverTimestamp(),
      lastUpdated: serverTimestamp()
    });

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
      const sessionData = sessionDoc.data() as ContinuousImprovementSession;
      const updatedLogs = [
        ...sessionData.technicalLogs,
        {
          ...logEntry,
          timestamp: new Date()
        }
      ];

      await setDoc(sessionRef, {
        technicalLogs: updatedLogs,
        lastUpdated: serverTimestamp()
      }, { merge: true });

      console.log(`[ContinuousImprovement] Added log to session ${sessionId}: ${logEntry.event}`);
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
