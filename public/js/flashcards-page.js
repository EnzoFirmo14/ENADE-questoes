// js/flashcards-page.js
import {
  auth,
  db,
  signOut,
  collection,
  getDocs
} from './firebase.js';
import { requireAuth } from './auth-common.js';
import { qs, toast, loader } from './ui.js';
import { renderFlashcardsView } from './views/flashcards.js';
 
let userCtx    = null;
let curriculum = [];
let flashcards = [];
 
// ===================== AUTH / MENU ======================
 
function bindCommonEvents() {
  qs('logout-btn')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = './index.html';
  });
}
 
async function initAccount() {
  userCtx = await requireAuth();
  if (qs('nav-user-email')) {
    qs('nav-user-email').textContent =
      userCtx.user.displayName || userCtx.user.email;
  }
}
 
// ===================== CURRÍCULO =========================
 
async function loadCurriculum() {
  const snap = await getDocs(collection(db, 'curriculum'));
  curriculum = [];
  snap.forEach(d => {
    if (d.id === 'main') {
      curriculum = d.data().sections || [];
    }
  });
  curriculum.forEach(sec => {
    if (!Array.isArray(sec.courses)) sec.courses = [];
  });
}
 
// ===================== FLASHCARDS (leitura) ==============
 
async function loadFlashcards() {
  const snap = await getDocs(collection(db, 'flashcards'));
  flashcards = [];
  snap.forEach(d => flashcards.push({ id: d.id, ...d.data() }));
}
 
// ===================== VIEW ==============================
 
function mountFlashcardsView(sectionIndex = 0, cardIndex = 0) {
  renderFlashcardsView(curriculum, flashcards, {
    currentSectionId: sectionIndex,
    currentCardIndex: cardIndex,
    isAdmin: false,           // sem botões de CRUD — edição fica em Configurações
    onChangeSection: (idx) => mountFlashcardsView(idx, 0),
    onChangeCard:    (idx) => mountFlashcardsView(sectionIndex, idx),
    onCreateCard:  null,
    onEditCard:    null,
    onDeleteCard:  null
  });
}
 
// ===================== INIT ==============================
 
async function init() {
  try {
    loader(true);
    bindCommonEvents();
    await initAccount();
    await loadCurriculum();
    await loadFlashcards();
    mountFlashcardsView(0, 0);
  } catch (err) {
    console.error('[flashcards-page] erro na inicialização', err);
    toast('Erro ao carregar flashcards.', false);
  } finally {
    loader(false);
  }
}
 
init();