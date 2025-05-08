import 'dotenv/config';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, updateDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function addProdClass() {
  try {
    // Sign in with your test user
    console.log('🔑 Authenticating...');
    await signInWithEmailAndPassword(auth, "forecasting@kemppi.com", "laatua");
    console.log('✅ Authentication successful');

    // Get all documents from the collection
    console.log('📥 Fetching documents...');
    const salesCollection = collection(db, 'sales_data_with_forecasts');
    const querySnapshot = await getDocs(salesCollection);
    
    if (querySnapshot.empty) {
      console.log('❌ No documents found in the collection');
      return;
    }

    console.log(`📊 Found ${querySnapshot.size} documents to update`);

    // Update each document
    let successCount = 0;
    let errorCount = 0;

    for (const docSnapshot of querySnapshot.docs) {
      try {
        const docRef = doc(db, 'sales_data_with_forecasts', docSnapshot.id);
        await updateDoc(docRef, {
          prod_class: "Virtalähteet",
          forecast_corrector: null,
          last_manual_correction_date: null
        });
        successCount++;
        
        // Log progress every 100 documents
        if (successCount % 100 === 0) {
          console.log(`✅ Updated ${successCount} documents so far...`);
        }
      } catch (error) {
        console.error(`❌ Error updating document ${docSnapshot.id}:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Update Summary:');
    console.log(`✅ Successfully updated: ${successCount} documents`);
    console.log(`❌ Failed to update: ${errorCount} documents`);
    console.log(`📝 Total documents processed: ${querySnapshot.size}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
console.log('🚀 Starting script to add prod_class field...');
addProdClass(); 