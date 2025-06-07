// Test script assuming open Firebase rules for testing
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit, addDoc } from 'firebase/firestore';

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

async function testFirestore() {
  try {
    console.log('=== Testing Firestore Collections ===');
    
    // Test reading agent_instructions collection
    console.log('1. Reading agent_instructions collection...');
    try {
      const agentInstructionsRef = collection(db, 'agent_instructions');
      const agentQuery = query(agentInstructionsRef, limit(10));
      const agentSnapshot = await getDocs(agentQuery);
      
      if (agentSnapshot.empty) {
        console.log('❌ agent_instructions collection is empty or does not exist');
      } else {
        console.log('✅ Found', agentSnapshot.size, 'documents in agent_instructions:');
        agentSnapshot.forEach((doc, index) => {
          console.log(`  Document ${index + 1} ID: ${doc.id}`);
          const data = doc.data();
          console.log(`  Fields: ${Object.keys(data).join(', ')}`);
          if (data.title) console.log(`  Title: ${data.title}`);
          if (data.prompt) console.log(`  Prompt: ${data.prompt.substring(0, 100)}...`);
          console.log('  ---');
        });
      }
    } catch (error) {
      console.log('❌ Error reading agent_instructions:', error.code, error.message);
    }
    
    // Test reading systemPromptVersions collection
    console.log('2. Reading systemPromptVersions collection...');
    try {
      const promptsRef = collection(db, 'systemPromptVersions');
      const promptQuery = query(promptsRef, limit(5));
      const promptSnapshot = await getDocs(promptQuery);
      
      if (promptSnapshot.empty) {
        console.log('❌ systemPromptVersions collection is empty or does not exist');
      } else {
        console.log('✅ Found', promptSnapshot.size, 'documents in systemPromptVersions:');
        promptSnapshot.forEach((doc, index) => {
          console.log(`  Document ${index + 1} ID: ${doc.id}`);
          const data = doc.data();
          console.log(`  Fields: ${Object.keys(data).join(', ')}`);
          if (data.version) console.log(`  Version: ${data.version}`);
          if (data.systemPrompt) console.log(`  Prompt: ${data.systemPrompt.substring(0, 100)}...`);
          console.log('  ---');
        });
      }
    } catch (error) {
      console.log('❌ Error reading systemPromptVersions:', error.code, error.message);
    }
    
    // Test writing to systemPromptVersions collection
    console.log('3. Testing write to systemPromptVersions...');
    try {
      const testDoc = {
        version: 999,
        systemPrompt: 'Test prompt from script',
        evaluation: 'Test evaluation',
        savedDate: new Date(),
        aiModel: 'test-model',
        userId: 'test-user'
      };
      
      const docRef = await addDoc(collection(db, 'systemPromptVersions'), testDoc);
      console.log('✅ Successfully wrote test document with ID:', docRef.id);
    } catch (error) {
      console.log('❌ Error writing to systemPromptVersions:', error.code, error.message);
    }
    
  } catch (error) {
    console.error('❌ General Error:', error);
  }
}

console.log('Firebase Rules should be set to:');
console.log('rules_version = "2";');
console.log('service cloud.firestore {');
console.log('  match /databases/{database}/documents {');
console.log('    match /{document=**} {');
console.log('      allow read, write: if true;');
console.log('    }');
console.log('  }');
console.log('}');
console.log('');

testFirestore();