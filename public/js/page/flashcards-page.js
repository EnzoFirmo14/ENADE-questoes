// js/page/flashcards-page.js
import {
  auth,
  db,
  signOut,
  collection,
  getDocs
} from '../core/firebase.js';
import { requireAuth } from '../core/auth-common.js';
import { qs, toast } from '../core/ui.js';
import { renderFlashcardsView } from '../views/flashcards.js';

let userCtx = null;
let curriculum = [];
let flashcards = [];
let currentSectionIndex = 0;
let currentCardIndex = 0;

// ===================== AUTH / MENU ======================

function bindCommonEvents() {
  const logoutBtn = qs('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.error('[flashcards] logout error', e);
      }
      window.location.href = './index.html';
    });
  }
}

// ===================== CURRÍCULO =========================

async function loadCurriculum() {
  try {
    const snap = await getDocs(collection(db, 'curriculum'));
    curriculum = [];

    snap.forEach(d => {
      if (d.id === 'main') {
        curriculum = d.data().sections || [];
      }
    });

    curriculum.forEach(sec => {
      if (!Array.isArray(sec.courses)) {
        sec.courses = [];
      }
    });
  } catch (e) {
    console.error('[flashcards] carregar currículo', e);
    toast('Erro ao carregar matérias.', false);
  }
}

// ===================== FLASHCARDS (leitura) ==============

async function loadFlashcards() {
  try {
    const snap = await getDocs(collection(db, 'flashcards'));
    flashcards = [];
    snap.forEach(d => {
      flashcards.push({ id: d.id, ...d.data() });
    });
  } catch (e) {
    console.error('[flashcards] carregar flashcards', e);
    toast('Erro ao carregar flashcards.', false);
  }
}

// ===================== VIEW (modo leitura) =================

function mountFlashcardsView(sectionIndex = 0, cardIndex = 0) {
  currentSectionIndex = sectionIndex;
  currentCardIndex = cardIndex;

  renderFlashcardsView(curriculum, flashcards, {
    currentSectionId: sectionIndex,
    currentCardIndex: cardIndex,
    isAdmin: false,
    onChangeSection: idx => mountFlashcardsView(idx, 0),
    onChangeCard: idx => mountFlashcardsView(sectionIndex, idx),
    onCreateCard: null,
    onEditCard: null,
    onDeleteCard: null
  });
}

// ===================== INIT ==============================

async function init() {
  bindCommonEvents();

  try {
    // requireAuth já chama loader(true) internamente
    userCtx = await requireAuth();

    const navUserEmail = qs('nav-user-email');
    if (navUserEmail) {
      navUserEmail.textContent =
        userCtx.user.displayName || userCtx.user.email;
    }

    await loadCurriculum();
    await loadFlashcards();
    mountFlashcardsView(0, 0);
  } catch (err) {
    console.error('[flashcards-page] erro na inicialização', err);
    toast('Erro ao carregar flashcards.', false);
  }
}

init();