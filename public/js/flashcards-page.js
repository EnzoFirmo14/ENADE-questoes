// js/flashcards-page.js
import {
  auth,
  db,
  signOut,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from './firebase.js';
import { requireAuth } from './auth-common.js';
import { qs, toast, loader } from './ui.js';

let currentUser = null;
let isAdmin = false;
let flashcards = [];

function bindEvents() {
  qs('logout-btn')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = './index.html';
  });

  const addBtn = qs('flashcard-add-btn');
  if (addBtn) {
    addBtn.addEventListener('click', createFlashcardFromForm);
  }
}

async function loadFlashcards() {
  const snap = await getDocs(collection(db, 'flashcards'));
  flashcards = [];
  snap.forEach(d => flashcards.push({ id: d.id, ...d.data() }));
}

function renderFlashcards() {
  const list = qs('flashcards-list');
  if (!list) return;

  if (!flashcards.length) {
    list.innerHTML = '<p class="muted-msg">Nenhum flashcard cadastrado ainda.</p>';
    return;
  }

  list.innerHTML = '';

  flashcards.forEach(card => {
    const item = document.createElement('div');
    item.className = 'flashcard-item';

    const q = document.createElement('div');
    q.className = 'flashcard-q';
    q.textContent = card.question;

    const a = document.createElement('div');
    a.className = 'flashcard-a';
    a.textContent = card.answer;

    item.appendChild(q);
    item.appendChild(a);

    if (isAdmin) {
      const actions = document.createElement('div');
      actions.className = 'flashcard-actions';

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Editar';
      editBtn.className = 'btn-secondary btn-sm';
      editBtn.addEventListener('click', () => editFlashcard(card));

      const delBtn = document.createElement('button');
      delBtn.textContent = 'Excluir';
      delBtn.className = 'btn-danger btn-sm';
      delBtn.addEventListener('click', () => deleteFlashcard(card.id));

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
      item.appendChild(actions);
    }

    list.appendChild(item);
  });
}

async function createFlashcardFromForm() {
  if (!isAdmin) {
    toast('Apenas administradores podem criar flashcards.', false);
    return;
  }

  const question = qs('flashcard-question')?.value.trim() || '';
  const answer = qs('flashcard-answer')?.value.trim() || '';
  const sectionIndex = qs('flashcard-section')?.value || 0;

  if (!question || !answer) {
    toast('Preencha pergunta e resposta.', false);
    return;
  }

  loader(true);

  try {
    const ref = collection(db, 'flashcards');
    await addDoc(ref, {
      sectionIndex,
      question,
      answer,
      createdBy: currentUser.uid,
      createdAt: Date.now()
    });

    if (qs('flashcard-question')) qs('flashcard-question').value = '';
    if (qs('flashcard-answer')) qs('flashcard-answer').value = '';

    toast('Flashcard criado com sucesso!', true);
    await loadFlashcards();
    renderFlashcards();
  } catch (e) {
    console.error('[flashcards] erro ao criar', e);
    toast('Erro ao criar flashcard.', false);
  } finally {
    loader(false);
  }
}

async function editFlashcard(card) {
  const newQuestion = prompt('Editar pergunta:', card.question);
  if (newQuestion === null) return;

  const trimmedQ = newQuestion.trim();
  if (!trimmedQ) {
    toast('Pergunta não pode ficar vazia.', false);
    return;
  }

  const newAnswer = prompt('Editar resposta:', card.answer);
  if (newAnswer === null) return;

  const trimmedA = newAnswer.trim();
  if (!trimmedA) {
    toast('Resposta não pode ficar vazia.', false);
    return;
  }

  loader(true);

  try {
    await updateDoc(doc(db, 'flashcards', card.id), {
      question: trimmedQ,
      answer: trimmedA
    });

    toast('Flashcard atualizado.', true);
    await loadFlashcards();
    renderFlashcards();
  } catch (e) {
    console.error('[flashcards] erro ao editar', e);
    toast('Erro ao atualizar flashcard.', false);
  } finally {
    loader(false);
  }
}

async function deleteFlashcard(id) {
  if (!confirm('Excluir este flashcard?')) return;

  loader(true);

  try {
    await deleteDoc(doc(db, 'flashcards', id));
    toast('Flashcard excluído.', true);
    await loadFlashcards();
    renderFlashcards();
  } catch (e) {
    console.error('[flashcards] erro ao excluir', e);
    toast('Erro ao excluir flashcard.', false);
  } finally {
    loader(false);
  }
}

async function init() {
  bindEvents();

  const ctx = await requireAuth();
  currentUser = ctx.user;
  isAdmin = ctx.isAdmin;

  if (qs('nav-user-email')) {
    qs('nav-user-email').textContent = currentUser.email;
  }

  // se não for admin, esconde form de criação
  const form = qs('flashcard-form');
  if (form && !isAdmin) {
    form.style.display = 'none';
  }

  await loadFlashcards();
  renderFlashcards();
}

loader(true);
init().finally(() => loader(false));