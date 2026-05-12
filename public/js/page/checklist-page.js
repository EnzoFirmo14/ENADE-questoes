// js/page/checklist-page.js
import {
  auth,
  db,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from '../core/firebase.js';
import { ADMIN_EMAILS } from '../core/constants.js';
import { requireAuth } from '../core/auth-common.js';
import { toast, loader, qs } from '../core/ui.js';
import { renderChecklist, syncChecklistItem } from '../views/checklist.js';

let currentUser = null;
let userDoc     = null;
let curriculum  = [];
let progress    = {};

// Cache da última lista filtrada, para manter índice sincrônico
let filteredSections = [];

// ============================================
// CURRÍCULO
// ============================================

async function loadCurriculum() {
  const ref  = doc(db, 'curriculum', 'main');
  const snap = await getDoc(ref);

  if (snap.exists()) {
    curriculum = snap.data().sections || [];
  } else {
    curriculum = [];
    await setDoc(ref, { sections: [] });
  }

  curriculum.forEach(sec => {
    if (!Array.isArray(sec.courses)) {
      sec.courses = [];
    }
  });
}

// ============================================
// PROGRESSO
// ============================================

async function saveProgress() {
  if (!currentUser) return;
  await updateDoc(doc(db, 'users', currentUser.uid), { progress });
}

// Calcula quais seções o usuário deve ver
function getFilteredSections() {
  if (!userDoc || !userDoc.course) {
    // enquanto não tiver curso, mostra tudo (se quiser esconder, retorne [])
    return curriculum;
  }

  // normaliza o identificador de curso
  // se o userDoc.course for "ADS" e a seção tiver
  // "ADS (Análise e Desenvolvimento de Sistemas)",
  // ambos viram "ADS"
  const courseId = String(userDoc.course).split(' ')[0]; // ex: 'ADS', 'SI', 'EC'

  return curriculum.filter(sec => {
    const listRaw = Array.isArray(sec.courses) ? sec.courses : [];

    // normaliza cada item de courses da seção
    const list = listRaw.map(v => String(v).split(' ')[0]); // ['ADS', '__ALL__', ...]

    if (list.includes('__ALL__')) return true;
    if (list.length === 0)        return false;

    return list.includes(courseId);
  });
}

function renderChecklistView() {
  filteredSections = getFilteredSections();
  renderChecklist(filteredSections, progress, toggleItem);
}

async function toggleItem(id, si) {
  // si agora é índice dentro de filteredSections
  progress[id] = !progress[id];

  // garante que filteredSections esteja em sincronia
  if (!filteredSections.length) {
    filteredSections = getFilteredSections();
  }

  syncChecklistItem(filteredSections, progress, id, si);
  await saveProgress();
  renderChecklistView();
}

async function resetProgress() {
  if (!confirm('Reiniciar todo o progresso?')) return;
  progress = {};
  await saveProgress();
  renderChecklistView();
  toast('Progresso reiniciado', true);
}

// ============================================
// BIND E INIT INTERNO
// ============================================

function bindEvents() {
  qs('reset-progress-btn')?.addEventListener('click', resetProgress);

  qs('logout-btn')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = './index.html';
  });
}

async function init() {
  bindEvents();

  const { user } = await requireAuth();
  currentUser = user;

  const ref  = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  let data;

  if (!snap.exists()) {
    data = {
      email:  user.email,
      name:   user.displayName || user.email.split('@')[0],
      isAdmin: ADMIN_EMAILS.includes(user.email),
      course: '',
      progress: {}
    };
    await setDoc(ref, data);
  } else {
    data = snap.data();
  }

  userDoc  = data;
  progress = data.progress || {};

  if (qs('nav-user-email')) {
    qs('nav-user-email').textContent = data.name || user.email;
  }

  await loadCurriculum();
  renderChecklistView();
}

// ============================================
// INIT EXPORTADO PARA O HTML
// ============================================

export async function initChecklistPage() {
  loader(true);
  try {
    await init();
  } finally {
    loader(false);
  }
}