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
import {
  renderChecklist,
  filterSectionsByCourse, // re-exportada de checklist.js
  syncChecklistItem
} from '../views/checklist.js';
 
let currentUser      = null;
let userDoc          = null;
let curriculum       = [];
let progress         = {};
let filteredSections = []; // cache da última listagem filtrada
 
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
 
  // Garante que toda seção tenha o array de cursos
  curriculum.forEach(sec => {
    if (!Array.isArray(sec.courses)) sec.courses = [];
  });
}
 
// ============================================
// PROGRESSO
// ============================================
 
async function saveProgress() {
  if (!currentUser) return;
  await updateDoc(doc(db, 'users', currentUser.uid), { progress });
}
 
// ============================================
// RENDERIZAÇÃO
// ============================================
 
/**
 * Calcula as seções visíveis para o curso do usuário e renderiza.
 * A filtragem é feita UMA única vez aqui, usando filterSectionsByCourse
 * de checklist.js (com normalização de curso consistente).
 */
function renderChecklistView() {
  // userDoc.course pode ser "ADS", "SI" ou "EC"
  // filterSectionsByCourse lida com a normalização internamente
  filteredSections = filterSectionsByCourse(
    curriculum,
    userDoc?.course || ''
  );
 
  // Passa as seções já filtradas; renderChecklist NÃO filtra novamente
  renderChecklist(filteredSections, progress, onToggleItem);
}
 
/**
 * Callback chamado pelo renderChecklist quando o usuário clica num item.
 *
 * IMPORTANTE: não re-renderiza o checklist inteiro — o renderChecklist já
 * aplicou a atualização otimista no DOM. Aqui só persistimos no Firestore.
 *
 * @param {string} id  Chave do item no objeto progress (ex: "0-3")
 * @param {number} si  Índice da seção dentro de filteredSections
 */
async function onToggleItem(id, si) {
  // progress[id] já foi atualizado otimistamente pelo renderChecklist
  await saveProgress();
}
 
async function resetProgress() {
  if (!confirm('Reiniciar todo o progresso?')) return;
  progress = {};
  await saveProgress();
  renderChecklistView();
  toast('Progresso reiniciado', true);
}
 
// ============================================
// EVENTOS
// ============================================
 
function bindEvents() {
  qs('reset-progress-btn')?.addEventListener('click', resetProgress);
 
  qs('logout-btn')?.addEventListener('click', async () => {
    try { await signOut(auth); } catch (_) { /* silencioso */ }
    window.location.href = './index.html';
  });
}
 
// ============================================
// INIT
// ============================================
 
async function init() {
  bindEvents();
 
  const { user } = await requireAuth();
  currentUser = user;
 
  const ref  = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  let data;
 
  if (!snap.exists()) {
    data = {
      email:    user.email,
      name:     user.displayName || user.email.split('@')[0],
      isAdmin:  ADMIN_EMAILS.includes(user.email),
      course:   '',
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
// EXPORT
// ============================================
 
export async function initChecklistPage() {
  loader(true);
  try {
    await init();
  } catch (err) {
    console.error('[checklist-page] erro na inicialização', err);
    toast('Erro ao carregar o checklist. Tente recarregar a página.', false);
  } finally {
    loader(false);
  }
}