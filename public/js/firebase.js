// ============================================
// FIREBASE - CONFIGURAÇÃO E INICIALIZAÇÃO
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
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
import { ENV, hasEnv } from './env.js';

if (!hasEnv()) {
  console.warn(
    '⚠️ Variáveis de ambiente do Firebase não detectadas.\n' +
    'Execute: npm run inject-env\n' +
    'Ou configure seu .env: cp .env.example .env'
  );
}

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY || 'CONFIGURAR',
  authDomain: ENV.FIREBASE_AUTH_DOMAIN || 'CONFIGURAR',
  projectId: ENV.FIREBASE_PROJECT_ID || 'CONFIGURAR',
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET || 'CONFIGURAR',
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID || 'CONFIGURAR',
  appId: ENV.FIREBASE_APP_ID || 'CONFIGURAR'
};

let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Erro ao inicializar Firebase:', error);
  console.error('Configure suas variáveis de ambiente corretamente.');
  throw error;
}

export { auth, db };

export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
};

export {
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