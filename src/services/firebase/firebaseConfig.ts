import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';

export interface FirebaseConfigOptions {
  apiKey: string;
  authDomain: string;
  databaseURL?: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY = 'signovanta_firebase_config';

export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigOptions = {
  apiKey: "AIzaSyAHkx9qYgGtFBcBrDEkwDCdzFuFwmXScz0",
  authDomain: "signovanta.firebaseapp.com",
  projectId: "signovanta",
  storageBucket: "signovanta.firebasestorage.app",
  messagingSenderId: "574750972542",
  appId: "1:574750972542:web:794ff8f3ea75d89a4b962f",
  databaseURL: "https://signovanta-default-rtdb.asia-southeast1.firebasedatabase.app",
};

export function getSavedFirebaseConfig(): FirebaseConfigOptions | null {
  try {
    // 1. Check Vite Environment Variables
    const envConfig: FirebaseConfigOptions = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };

    if (envConfig.apiKey && envConfig.projectId) {
      return envConfig;
    }

    // 2. Check Browser LocalStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[SIGNOVANTA] Error reading Firebase configuration:', err);
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveFirebaseConfig(config: FirebaseConfigOptions): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearSavedFirebaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let rtdb: Database | null = null;

export function initializeFirebase() {
  const config = getSavedFirebaseConfig();
  if (config && config.apiKey && config.projectId) {
    try {
      if (!getApps().length) {
        app = initializeApp(config);
      } else {
        app = getApp();
      }
      auth = getAuth(app);
      db = getFirestore(app);
      try {
        rtdb = config.databaseURL ? getDatabase(app, config.databaseURL) : getDatabase(app);
      } catch (rtdbErr) {
        console.warn('[SIGNOVANTA] RTDB initialization warning:', rtdbErr);
      }
      return { app, auth, db, rtdb, isConfigured: true };
    } catch (err) {
      console.error('[SIGNOVANTA] Firebase initialization failed:', err);
    }
  }
  return { app: null, auth: null, db: null, rtdb: null, isConfigured: false };
}

// Auto-initialize on import
const initResult = initializeFirebase();
app = initResult.app;
auth = initResult.auth;
db = initResult.db;
rtdb = initResult.rtdb;

export { app, auth, db, rtdb };

export function isFirebaseConfigured(): boolean {
  return !!(auth && db);
}

