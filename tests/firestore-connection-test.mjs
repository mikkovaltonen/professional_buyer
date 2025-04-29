import 'dotenv/config';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

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

async function testFirestore() {
  try {
    // Sign in with email and password
    await signInWithEmailAndPassword(auth, "forecasting@kemppi.com", "laatua");

    const testDoc = {
      message: 'Hello from client SDK!',
      timestamp: new Date().toISOString(),
    };
    // Write test document
    const docRef = await addDoc(collection(db, 'test_collection'), testDoc);
    console.log('Test document added with ID:', docRef.id);
    // Read test documents
    const querySnapshot = await getDocs(collection(db, 'test_collection'));
    querySnapshot.forEach((doc) => {
      console.log(doc.id, '=>', doc.data());
    });
    console.log('Firestore client SDK connection test complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error with Firestore client SDK connection:', err);
    process.exit(1);
  }
}

testFirestore(); 