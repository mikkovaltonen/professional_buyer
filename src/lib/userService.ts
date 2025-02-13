import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

interface UserPreferences {
  language: string;
  riskProfile?: {
    financialAnswers: Record<number, string>;
    accidentAnswers: Record<number, string>;
    financialScore: number;
    accidentScore: number;
    overallScore: number;
    lastUpdated: string;
  };
}

export const initializeUserData = async (userId: string, email: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const preferencesRef = doc(db, 'users', userId, 'preferences', 'default');

    // Create user document
    await setDoc(userRef, {
      email,
      createdAt: new Date().toISOString()
    });

    // Initialize preferences
    await setDoc(preferencesRef, {
      language: 'en'
    });
  } catch (error) {
    console.error('Error initializing user data:', error);
    throw error;
  }
};

export const updateUserPreferences = async (userId: string, data: Partial<UserPreferences>) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, data, { merge: true });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }
};

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserPreferences;
    }
    return null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    throw error;
  }
}; 