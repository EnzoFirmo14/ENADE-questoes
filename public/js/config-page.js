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
import { qs, toast, loader } from './ui.js';
import {
  renderAdmin,
  renderAdminItems,
  toggleAdminSec,
  nextCategoryColor
} from './views/admin.js';

let userCtx = null;
let adminSections = [];
let flashcards = [];
let draggedSectionIndex = null;

// ============================================
// CURRÍCULO (CATEGORIAS / ITENS)
// ============================================

async function loadCurriculum() {
  const ref = doc(db, 'curriculum', 'main');
  const snap = await getDoc(ref);
  if (snap.exists()) {
    adminSections = snap.data().sections || [];
  } else {
    adminSections = [];
    await setDoc(ref, { sections: [] });
  }

  // garante sempre um array de courses
  adminSections.forEach(sec => {
    if (!Array.isArray(sec.courses)) {
      sec.courses = [];
    }
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

function renderAdminView() {
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
}

// === Funções de categorias/itens (mesmas do app.js original) ===

function addCategory() {
  const name = qs('new-cat-input')?.value.trim() || '';
  const prio = qs('new-cat-prio')?.value || 'obrigatório';

  if (!name) {
    toast('Digite o nome da matéria.');
    return;
  }

  adminSections.push({
    cat: name,
    color: nextCategoryColor(adminSections.length),
    prio,
    items: [],
    courses: []
  });

  if (qs('new-cat-input')) {
    qs('new-cat-input').value = '';
  }

  renderAdminView();

  const newIndex = adminSections.length - 1;
  setTimeout(() => {
    toggleAdminSec(newIndex);
    const firstInput = qs(`new-item-${newIndex}`);
    if (firstInput) firstInput.focus();
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

  setTimeout(() => {
    const inputAgain = qs(`new-item-${si}`);
    if (inputAgain) inputAgain.focus();
  }, 0);
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

// cursos associados à seção (se você estiver usando filtros por curso)
function toggleSectionCourse(si, courseId, checked) {
  const sec = adminSections[si];
  if (!Array.isArray(sec.courses)) {
    sec.courses = [];
  }

  if (courseId === '__ALL__') {
    if (checked) {
      sec.courses = ['__ALL__'];
    } else {
      sec.courses = [];
    }
  } else {
    sec.courses = sec.courses.filter(c => c !== '__ALL__');

    if (checked) {
      if (!sec.courses.includes(courseId)) {
        sec.courses.push(courseId);
      }
    } else {
      sec.courses = sec.courses.filter(c => c !== courseId);
    }
  }

  renderAdminView();
}

// drag and drop de categorias
function onDragStart(e) {
  const sec = e.currentTarget;
  draggedSectionIndex = Number(sec.dataset.index);
  sec.classList.add('dragging');
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
  ) {
    return;
  }

  const draggedItem = adminSections[draggedSectionIndex];
  adminSections.splice(draggedSectionIndex, 1);
  adminSections.splice(targetIndex, 0, draggedItem);

  draggedSectionIndex = null;
  renderAdminView();
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  draggedSectionIndex = null;
}

// ============================================
// FLASHCARDS ADMIN
// ============================================

async function loadFlashcards() {
  const snap = await getDocs(collection(db, 'flashcards'));
  flashcards = [];
  snap.forEach(d => flashcards.push({ id: d.id, ...d.data() }));
}

function fillFlashcardSectionSelect() {
  const sel = qs('flash-admin-section');
  if (!sel) return;
  sel.innerHTML = '';
  adminSections.forEach((sec, index) => {
    const opt = document.createElement('option');
    opt.value = String(index);
    opt.textContent = sec.cat || `Seção ${index + 1}`;
    sel.appendChild(opt);
  });
}

async function addFlashcardFromAdmin() {
  const sel = qs('flash-admin-section');
  const qInp = qs('flash-admin-question');
  const aInp = qs('flash-admin-answer');

  const sectionIndex = sel?.value || '0';
  const question = qInp?.value.trim() || '';
  const answer = aInp?.value.trim() || '';

  if (!question || !answer) {
    toast('Preencha pergunta e resposta.', false);
    return;
  }

  await addDoc(collection(db, 'flashcards'), {
    sectionIndex,
    question,
    answer,
    createdAt: Date.now(),
    createdBy: userCtx.user.uid
  });

  if (qInp) qInp.value = '';
  if (aInp) aInp.value = '';

  toast('Flashcard criado.', true);
  await loadFlashcards();
  renderFlashcardsAdminList();
}

function renderFlashcardsAdminList() {
  const cont = qs('flash-admin-list');
  if (!cont) return;

  if (!flashcards.length) {
    cont.innerHTML = '<p class="muted-msg">Nenhum flashcard cadastrado ainda.</p>';
    return;
  }

  cont.innerHTML = '';
  flashcards.forEach(card => {
    const row = document.createElement('div');
    row.className = 'flash-admin-row';

    row.innerHTML = `
      <div class="flash-admin-qa">
        <strong>${card.question}</strong>
        <span class="text-small text-muted">${card.answer}</span>
      </div>
      <button class="btn-secondary btn-sm" data-id="${card.id}" data-act="edit">Editar</button>
      <button class="btn-danger btn-sm" data-id="${card.id}" data-act="del">Remover</button>
    `;

    cont.appendChild(row);
  });

  cont.querySelectorAll('button[data-act="del"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      await deleteDoc(doc(db, 'flashcards', id));
      toast('Flashcard removido.', true);
      await loadFlashcards();
      renderFlashcardsAdminList();
    });
  });

  cont.querySelectorAll('button[data-act="edit"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const card = flashcards.find(f => f.id === id);
      if (!card) return;

      const nq = prompt('Editar pergunta:', card.question);
      if (nq === null) return;
      const na = prompt('Editar resposta:', card.answer);
      if (na === null) return;

      await updateDoc(doc(db, 'flashcards', id), {
        question: nq.trim(),
        answer: na.trim()
      });

      toast('Flashcard atualizado.', true);
      await loadFlashcards();
      renderFlashcardsAdminList();
    });
  });
}

// ============================================
// BIND E INICIALIZAÇÃO
// ============================================

function bindEvents() {
  qs('save-btn')?.addEventListener('click', saveCurriculum);
  qs('add-cat-btn')?.addEventListener('click', addCategory);
  qs('flash-admin-add-btn')?.addEventListener('click', addFlashcardFromAdmin);
}

async function init() {
  // garante que é admin
  userCtx = await requireAuth({ requireAdmin: true });

  await loadCurriculum();
  renderAdminView();
  await loadFlashcards();
  fillFlashcardSectionSelect();
  renderFlashcardsAdminList();
  bindEvents();
}

loader(true);
init().finally(() => loader(false));