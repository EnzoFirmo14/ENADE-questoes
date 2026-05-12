// js/config-page.js
import {
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  deleteDoc
} from './firebase.js';
import { requireAuth } from './auth-common.js';
import { qs, toast } from './ui.js';
import {
  renderAdmin,
  renderAdminItems,
  toggleAdminSec,
  nextCategoryColor
} from './views/admin.js';
import { renderFlashcardsView } from './views/flashcards.js';

let userCtx            = null;
let adminSections      = [];
let flashcards         = [];
let draggedSectionIndex = null;

// Estado atual da view de flashcards (para re-render após CRUD)
let fcSectionIndex = 0;
let fcCardIndex    = 0;

// Preserva estado aberto entre re-renders
let openSectionBodies = new Set();
let openCourseBoxes   = new Set();

// ============================================
// PRESERVAÇÃO DE ESTADO
// ============================================

function saveState() {
  openSectionBodies.clear();
  document.querySelectorAll('.admin-sec-body.open').forEach(el => {
    const si = el.id.replace('admin-body-', '');
    openSectionBodies.add(Number(si));
  });

  openCourseBoxes.clear();
  document.querySelectorAll('.admin-courses-row.open').forEach(el => {
    const si = el.id.replace('admin-courses-', '');
    openCourseBoxes.add(Number(si));
  });
}

function restoreState() {
  openSectionBodies.forEach(si => {
    const body = qs(`admin-body-${si}`);
    if (body) body.className = 'admin-sec-body open';
  });

  openCourseBoxes.forEach(si => {
    const row = qs(`admin-courses-${si}`);
    if (row) row.classList.add('open');
    const arrow = document.querySelector(
      `[data-courses-toggle="${si}"] .arrow-icon`
    );
    if (arrow) arrow.textContent = '▴';
  });
}

// ============================================
// CURRÍCULO (CATEGORIAS / ITENS)
// ============================================

async function loadCurriculum() {
  const ref  = doc(db, 'curriculum', 'main');
  const snap = await getDoc(ref);

  if (snap.exists()) {
    adminSections = snap.data().sections || [];
  } else {
    adminSections = [];
    await setDoc(ref, { sections: [] });
  }

  adminSections.forEach(sec => {
    if (!Array.isArray(sec.courses)) sec.courses = [];
  });
}

async function saveCurriculum() {
  const btn = qs('save-btn');
  if (!btn) return;

  btn.disabled = true;
  await setDoc(doc(db, 'curriculum', 'main'), { sections: adminSections });

  btn.classList.add('saved');
  btn.textContent = '✓ Salvo!';
  setTimeout(() => {
    btn.classList.remove('saved');
    btn.textContent = 'Salvar alterações';
    btn.disabled = false;
  }, 2000);

  toast('Currículo atualizado!', true);
}

// ============================================
// RENDER ADMIN
// ============================================

function renderAdminView() {
  saveState();

  renderAdmin(adminSections, {
    toggleAdminSec,
    updatePrio: (si, val) => {
      adminSections[si].prio = val;
    },
    removeSection,
    addItem,
    editItem,
    removeItem,
    toggleSectionCourse,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd
  });

  restoreState();
}

// ============================================
// CATEGORIAS / ITENS
// ============================================

function addCategory() {
  const name = qs('new-cat-input')?.value.trim() || '';
  const prio = qs('new-cat-prio')?.value || 'obrigatório';

  if (!name) {
    toast('Digite o nome da matéria.');
    return;
  }

  adminSections.push({
    cat:   name,
    color: nextCategoryColor(adminSections.length),
    prio,
    items: [],
    courses: []
  });

  if (qs('new-cat-input')) qs('new-cat-input').value = '';

  renderAdminView();

  const newIndex = adminSections.length - 1;
  setTimeout(() => {
    toggleAdminSec(newIndex);
    qs(`new-item-${newIndex}`)?.focus();
  }, 50);

  toast('Categoria criada. Agora adicione os assuntos.');
}

function removeSection(e, si) {
  e.stopPropagation();
  if (!confirm(`Remover categoria "${adminSections[si].cat}"?`)) return;
  adminSections.splice(si, 1);
  renderAdminView();
}

function addItem(si) {
  const inp = qs(`new-item-${si}`);
  if (!inp) return;

  const txt = inp.value.trim();
  if (!txt) {
    toast('Digite o assunto antes de adicionar.');
    return;
  }

  adminSections[si].items.push(txt);
  inp.value = '';
  renderAdminItems(adminSections, si, { editItem, removeItem });

  setTimeout(() => qs(`new-item-${si}`)?.focus(), 0);
}

function editItem(si, ii) {
  const txt = prompt('Editar:', adminSections[si].items[ii]);
  if (txt === null || !txt.trim()) return;
  adminSections[si].items[ii] = txt.trim();
  renderAdminItems(adminSections, si, { editItem, removeItem });
}

function removeItem(si, ii) {
  adminSections[si].items.splice(ii, 1);
  renderAdminItems(adminSections, si, { editItem, removeItem });
}

function toggleSectionCourse(si, courseId, checked) {
  const sec = adminSections[si];
  if (!Array.isArray(sec.courses)) sec.courses = [];

  if (courseId === '__ALL__') {
    sec.courses = checked ? ['__ALL__'] : [];
  } else {
    sec.courses = sec.courses.filter(c => c !== '__ALL__');
    if (checked) {
      if (!sec.courses.includes(courseId)) sec.courses.push(courseId);
    } else {
      sec.courses = sec.courses.filter(c => c !== courseId);
    }
  }

  renderAdminView();
}

// ============================================
// DRAG AND DROP
// ============================================

function onDragStart(e) {
  draggedSectionIndex = Number(e.currentTarget.dataset.index);
  e.currentTarget.classList.add('dragging');
}

function onDragOver(e) {
  e.preventDefault();
}

function onDrop(e) {
  e.preventDefault();
  const targetIndex = Number(e.currentTarget.dataset.index);
  if (
    draggedSectionIndex === null ||
    Number.isNaN(targetIndex) ||
    draggedSectionIndex === targetIndex
  ) return;

  const [item] = adminSections.splice(draggedSectionIndex, 1);
  adminSections.splice(targetIndex, 0, item);
  draggedSectionIndex = null;
  renderAdminView();
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  draggedSectionIndex = null;
}

// ============================================
// FLASHCARDS ADMIN — renderFlashcardsView
// ============================================

async function loadFlashcards() {
  const snap = await getDocs(collection(db, 'flashcards'));
  flashcards = [];
  snap.forEach(d => flashcards.push({ id: d.id, ...d.data() }));
}

/**
 * Monta (ou re-monta) o painel de flashcards dentro de #flashcards-container.
 */
function mountFlashcardsAdmin(sectionIndex = fcSectionIndex, cardIndex = fcCardIndex) {
  fcSectionIndex = sectionIndex;
  fcCardIndex    = cardIndex;

  renderFlashcardsView(adminSections, flashcards, {
    currentSectionId:  sectionIndex,
    currentCardIndex:  cardIndex,
    isAdmin: true,

    onChangeSection: (idx) => mountFlashcardsAdmin(idx, 0),
    onChangeCard:    (idx) => mountFlashcardsAdmin(sectionIndex, idx),

    onCreateCard: async (idx, question, answer) => {
      await addDoc(collection(db, 'flashcards'), {
        sectionIndex: idx,
        question,
        answer,
        createdAt: Date.now(),
        createdBy: userCtx.user.uid
      });
      toast('Flashcard criado.', true);
      await loadFlashcards();
      mountFlashcardsAdmin(idx, 0);
    },

    onEditCard: async (id, question, answer) => {
      await updateDoc(doc(db, 'flashcards', id), { question, answer });
      toast('Flashcard atualizado.', true);
      await loadFlashcards();
      mountFlashcardsAdmin(sectionIndex, cardIndex);
    },

    onDeleteCard: async (id) => {
      await deleteDoc(doc(db, 'flashcards', id));
      toast('Flashcard removido.', true);
      await loadFlashcards();
      mountFlashcardsAdmin(sectionIndex, 0);
    }
  });
}

// ============================================
// BIND E INICIALIZAÇÃO
// ============================================

function bindEvents() {
  qs('save-btn')?.addEventListener('click', saveCurriculum);
  qs('add-cat-btn')?.addEventListener('click', addCategory);
}

export async function initConfigPage() {
  userCtx = await requireAuth({ requireAdmin: true });

  await loadCurriculum();
  renderAdminView();
  await loadFlashcards();

  // Monta o painel de flashcards com CRUD completo
  mountFlashcardsAdmin(0, 0);

  bindEvents();
}