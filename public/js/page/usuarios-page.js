// js/usuarios-page.js
import {
  auth,
  db,
  signOut,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from '../core/firebase.js';
import { requireAuth } from '../core/auth-common.js';
import { qs, toast } from '../core/ui.js';
import { totalItems } from '../views/checklist.js';
import { renderUsersList } from '../views/users.js';

let currentUser = null;
let userDoc = null;

function bindEvents() {
  const logoutBtn = qs('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await signOut(auth);
      } catch (e) {
        console.error('[usuarios] logout error', e);
      }
      window.location.href = './index.html';
    });
  }
}

async function loadCurriculum() {
  try {
    const ref = doc(db, 'curriculum', 'main');
    const snap = await getDoc(ref);
    if (!snap.exists()) return 0;
    const data = snap.data();
    const curriculum = data.sections || [];
    return totalItems(curriculum);
  } catch (e) {
    console.error('[usuarios] carregar currículo', e);
    return 0;
  }
}

async function loadUsersView() {
  const cont = qs('users-list');
  if (!cont) return;

  cont.innerHTML = '<p class="muted-msg">Carregando…</p>';

  try {
    const [snap, total] = await Promise.all([
      getDocs(collection(db, 'users')),
      loadCurriculum()
    ]);

    const users = [];
    snap.forEach(d => users.push({ uid: d.id, ...d.data() }));

    renderUsersList(users, total, {
      onEditUser,
      onRemoveUser
    });
  } catch (e) {
    console.error('[usuarios] erro ao carregar usuários', e);
    cont.innerHTML = '<p class="muted-msg">Erro ao carregar usuários.</p>';
  }
}

async function onEditUser(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      toast('Usuário não encontrado.', false);
      return;
    }
    const data = snap.data();

    const newName = prompt('Nome:', data.name || '');
    if (newName === null) return;

    const newCourse = prompt('Curso:', data.course || '');
    if (newCourse === null) return;

    const newIsAdmin = confirm('É administrador? OK = Sim, Cancelar = Não');
    const newDisabled = confirm('Desativar usuário? OK = Sim, Cancelar = Não');

    await updateDoc(userRef, {
      name: newName.trim() || data.name,
      course: newCourse.trim(),
      isAdmin: newIsAdmin,
      disabled: newDisabled
    });

    toast('Usuário atualizado com sucesso.', true);
    await loadUsersView();
  } catch (e) {
    console.error('[usuarios] erro ao editar usuário', e);
    toast('Erro ao editar usuário.', false);
  }
}

async function onRemoveUser(uid) {
  if (!confirm('Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.')) {
    return;
  }
  try {
    await deleteDoc(doc(db, 'users', uid));
    toast('Usuário removido com sucesso.', true);
    await loadUsersView();
  } catch (e) {
    console.error('[usuarios] erro ao remover usuário', e);
    toast('Erro ao remover usuário.', false);
  }
}

// Init
async function init() {
  bindEvents();

  // requireAuth already handles loader internally
  const ctx = await requireAuth({ requireAdmin: true });
  currentUser = ctx.user;
  userDoc = ctx.userDoc;

  if (qs('nav-user-email')) {
    qs('nav-user-email').textContent = userDoc.name || currentUser.email;
  }

  await loadUsersView();
}

init();