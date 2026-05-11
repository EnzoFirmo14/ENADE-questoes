// js/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-auth.js";
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
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-firestore.js";

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

let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
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