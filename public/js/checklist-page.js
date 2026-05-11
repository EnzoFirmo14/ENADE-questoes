// js/checklist-page.js
import {
  auth,
  db,
  signOut,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from './firebase.js';
import { ADMIN_EMAILS } from './constants.js';
import { requireAuth } from './auth-common.js';
import { toast, loader, qs } from './ui.js';
import { renderChecklist, syncChecklistItem } from './views/checklist.js';

let currentUser = null;
let userDoc = null;
let curriculum = [];
let progress = {};

async function loadCurriculum() {
  const ref = doc(db, 'curriculum', 'main');
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

async function saveProgress() {
  if (!currentUser) return;
  await updateDoc(doc(db, 'users', currentUser.uid), { progress });
}

function renderChecklistView() {
  renderChecklist(curriculum, progress, toggleItem);
}

async function toggleItem(id, si) {
  progress[id] = !progress[id];
  syncChecklistItem(curriculum, progress, id, si);
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

  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  let data;

  if (!snap.exists()) {
    data = {
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      isAdmin: ADMIN_EMAILS.includes(user.email),
      course: '',
      progress: {}
    };
    await setDoc(ref, data);
  } else {
    data = snap.data();
  }

  userDoc = data;
  progress = data.progress || {};

  if (qs('nav-user-email')) {
    qs('nav-user-email').textContent = data.name || user.email;
  }

  await loadCurriculum();
  renderChecklistView();
}

loader(true);
init().finally(() => loader(false));