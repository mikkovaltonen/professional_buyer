import 'dotenv/config';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import fs from "fs";

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

async function importSalesData() {
  try {
    // Sign in with your test user
    await signInWithEmailAndPassword(auth, "forecasting@kemppi.com", "laatua");

    // Read and parse the JSON file
    const raw = fs.readFileSync("public/demo_data/sales_data_with_forecasts.json", "utf8");
    const salesData = JSON.parse(raw);

    // Import each entry as a document
    for (const entry of salesData) {
      // Add null value for new_forecast_manually_adjusted field
      const entryWithNullField = {
        ...entry,
        new_forecast_manually_adjusted: null
      };
      
      await addDoc(collection(db, "sales_data_with_forecasts"), entryWithNullField);
      console.log("Imported:", entryWithNullField);
    }

    console.log("All sales data imported!");
    process.exit(0);
  } catch (err) {
    console.error("Error importing sales data:", err);
    process.exit(1);
  }
}

importSalesData(); 