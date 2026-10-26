import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, off, get, set } from "firebase/database";

// Configurable Firebase credentials via Vite environment variables
// with secure fallbacks for project continuity.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAir8JrtaBBlTKK5ptoCBCPiXxvdKxvi7A",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "coldchain-integrity-nonitor.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://coldchain-integrity-nonitor-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "coldchain-integrity-nonitor",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "coldchain-integrity-nonitor.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1062474522148",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1062474522148:web:525555c1a76ff8a5fb82b1"
};

// Configurable Firebase Realtime Database path (default: 'coldchain/latest')
export const FIREBASE_DB_PATH = import.meta.env.VITE_FIREBASE_DB_PATH || "coldchain/latest";

// Expected sensor field mappings (configurable for future ESP32 firmware integration)
export const SENSOR_FIELDS = {
  temperature: import.meta.env.VITE_FIELD_TEMP || "temperature",
  humidity: import.meta.env.VITE_FIELD_HUMIDITY || "humidity",
  distance: import.meta.env.VITE_FIELD_DISTANCE || "distance",
  lid: import.meta.env.VITE_FIELD_LID || "lid",
  lidOpen: import.meta.env.VITE_FIELD_LID_OPEN || "lidOpen",
  timestamp: import.meta.env.VITE_FIELD_TIMESTAMP || "timestamp"
};

// Initialize Firebase app singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Export Realtime Database instance
export const db = getDatabase(app);

// Export Realtime Database SDK helpers
export { ref, onValue, off, get, set };
