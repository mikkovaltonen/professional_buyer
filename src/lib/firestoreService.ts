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
  
  return JSON.parse(data).map((item: any) => ({
    ...item,
    savedDate: new Date(item.savedDate)
  }));
};

const getNextLocalVersion = (userId: string): number => {
  const existing = getFromLocalStorage(userId);
  if (existing.length === 0) return 1;
  return Math.max(...existing.map(v => v.version)) + 1;
};

// Save a new version of system prompt
export const savePromptVersion = async (
  userId: string, 
  promptText: string, 
  evaluation: string = '',
  aiModel: string = 'gemini-2.5-flash-preview-04-17'
): Promise<number> => {
  try {
    if (!db) {
      console.warn('Firebase not initialized, using localStorage fallback');
      const nextVersion = getNextLocalVersion(userId);
      const promptVersion: SystemPromptVersion = {
        version: nextVersion,
        systemPrompt: promptText,
        evaluation: evaluation,
        savedDate: new Date(),
        aiModel: aiModel,
        userId: userId
      };
      saveToLocalStorage(userId, promptVersion);
      console.log(`[LocalStorage] Saved prompt version ${nextVersion}`);
      return nextVersion;
    }

    // Try Firebase first
    const nextVersion = await getNextVersionNumber(userId);
    
    const promptVersion: Omit<SystemPromptVersion, 'id'> = {
      version: nextVersion,
      systemPrompt: promptText,
      evaluation: evaluation,
      savedDate: new Date(),
      aiModel: aiModel,
      userId: userId
    };

    const docRef = await addDoc(collection(db, 'systemPromptVersions'), {
      ...promptVersion,
      savedDate: serverTimestamp()
    });
    
    console.log(`[FirestoreService] Saved prompt version ${nextVersion} with ID: ${docRef.id}`);
    return nextVersion;
  } catch (error) {
    console.warn('Firebase save failed, falling back to localStorage:', error);
    const nextVersion = getNextLocalVersion(userId);
    const promptVersion: SystemPromptVersion = {
      version: nextVersion,
      systemPrompt: promptText,
      evaluation: evaluation,
      savedDate: new Date(),
      aiModel: aiModel,
      userId: userId
    };
    saveToLocalStorage(userId, promptVersion);
    console.log(`[LocalStorage] Saved prompt version ${nextVersion} (fallback)`);
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
      const updated = versions.map((v: any) => 
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
    const updated = versions.map((v: any) => 
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
