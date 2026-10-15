import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'test-monitor-46836.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'test-monitor-46836',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'test-monitor-46836.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '364576718331',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:364576718331:web:77f16ae5634c7c6fd99f5e',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-YJ7FVMSH36'
};

export const isFirebaseConfigured = () => {
  return (
    !!firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'your_api_key_here' &&
    !!firebaseConfig.projectId
  );
};

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
} else {
  console.warn(
    'Firebase is not fully configured yet. Set VITE_FIREBASE_API_KEY and other credentials in .env.local to enable real-time Firebase sync.'
  );
}

export { app, auth, db, firebaseConfig };
