// js/usuarios-page.js
import {
  auth,
  db,
  signOut,
  collection,
  getDocs,
  doc,
  getDoc
} from './core/firebase.js';
import { requireAuth } from './core/auth-common.js';
import { qs, toast, loader } from './core/ui.js';
import { totalItems } from './views/checklist.js';
import { renderUsersList } from './views/users.js';  // IMPORTANTE

let currentUser = null;
let userDoc = null;

function bindEvents() {
  const logoutBtn = qs('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      window.location.href = './index.html';
    });
  }
}

// mesma forma que o app antigo faz
async function loadCurriculum() {
  const ref = doc(db, 'curriculum', 'main');
  const snap = await getDoc(ref);
  if (!snap.exists()) return 0;
  const data = snap.data();
  const curriculum = data.sections || [];
  return totalItems(curriculum);
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

// essas duas funções já existem no app original; copie-as de lá se ainda não estiverem
async function onEditUser(uid) {
  // aqui você pode reusar exatamente o openEditUserModal / fluxo antigo
  // ou simplificar com prompt como fizemos antes
}

async function onRemoveUser(uid) {
  // reusa a lógica antiga de marcar disabled: true
}

async function init() {
  bindEvents();

  const ctx = await requireAuth({ requireAdmin: true });
  currentUser = ctx.user;
  userDoc = ctx.userDoc;

  if (qs('nav-user-email')) {
    qs('nav-user-email').textContent = userDoc.name || currentUser.email;
  }

  await loadUsersView();
}

loader(true);
init().finally(() => loader(false));