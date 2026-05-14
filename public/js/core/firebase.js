// js/core/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// lê env.js
const __ENV = (typeof window !== 'undefined' && window.__ENV__) ? window.__ENV__ : {};

const firebaseConfig = {
  apiKey: __ENV.VITE_FIREBASE_API_KEY,
  authDomain: __ENV.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: __ENV.VITE_FIREBASE_PROJECT_ID,
  storageBucket: __ENV.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: __ENV.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: __ENV.VITE_FIREBASE_APP_ID
};

// Validate config before initializing
const missingKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => !v || v === '' || v === 'undefined')
  .map(([k]) => k);

if (missingKeys.length > 0) {
  console.error('[Firebase] Missing config keys:', missingKeys.join(', '));
  console.error('[Firebase] Ensure .env file exists and npm run build was executed.');
}

let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Set persistence explicitly
  setPersistence(auth, browserLocalPersistence).catch(err => {
    console.warn('[Firebase] Persistence setup failed:', err.message);
  });
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
  throw error;
}

export {
  app,
  auth,
  db,
  // auth
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  // firestore
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove
};
