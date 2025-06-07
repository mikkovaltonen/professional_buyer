// Test script to read existing agent_instructions collection
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyB_kPjjBfqtcnj38p_okBygFYNV2cr4m-4',
  authDomain: 'airbnb-assistant-app.firebaseapp.com',
  projectId: 'airbnb-assistant-app',
  storageBucket: 'airbnb-assistant-app.firebasestorage.app',
  messagingSenderId: '929654225196',
  appId: '1:929654225196:web:e173d2c32421298ee99489',
  measurementId: 'G-4WWWC5G727',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testFirestore() {
  try {
    console.log('Initializing Firebase...');
    
    // Sign in anonymously
    console.log('Signing in anonymously...');
    const userCredential = await signInAnonymously(auth);
    console.log('Signed in as:', userCredential.user.uid);
    
    // Test reading agent_instructions collection
    console.log('Reading agent_instructions collection...');
    const agentInstructionsRef = collection(db, 'agent_instructions');
    const agentQuery = query(agentInstructionsRef, limit(5));
    const agentSnapshot = await getDocs(agentQuery);
    
    if (agentSnapshot.empty) {
      console.log('❌ agent_instructions collection is empty or does not exist');
    } else {
      console.log('✅ Found', agentSnapshot.size, 'documents in agent_instructions');
      agentSnapshot.forEach((doc) => {
        console.log('Document ID:', doc.id);
        console.log('Data:', doc.data());
        console.log('---');
      });
    }
    
    // Test reading systemPromptVersions collection
    console.log('Reading systemPromptVersions collection...');
    const promptsRef = collection(db, 'systemPromptVersions');
    const promptQuery = query(promptsRef, limit(5));
    const promptSnapshot = await getDocs(promptQuery);
    
    if (promptSnapshot.empty) {
      console.log('❌ systemPromptVersions collection is empty or does not exist');
    } else {
      console.log('✅ Found', promptSnapshot.size, 'documents in systemPromptVersions');
      promptSnapshot.forEach((doc) => {
        console.log('Document ID:', doc.id);
        console.log('Data:', doc.data());
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.message) {
      console.error('Error message:', error.message);
    }
  }
}

testFirestore();