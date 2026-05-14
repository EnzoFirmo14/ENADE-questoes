// js/page/usuarios-page.js
import {
  auth,
  db,
  signOut,
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  sendPasswordResetEmail
} from '../core/firebase.js';
import { requireAuth } from '../core/auth-common.js';
import { qs, toast, customConfirm, customPrompt, openModal, closeModal } from '../core/ui.js';
import { enhanceNativeSelect } from '../components/customSelect.js';
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

    // Preencher campos do modal
    const nameInput = qs('edit-user-name');
    const courseSelect = qs('edit-user-course');
    const isAdminCheck = qs('edit-user-is-admin');
    
    if (nameInput) nameInput.value = data.name || '';
    if (courseSelect) {
      courseSelect.value = data.course || '';
      // Aplicar estilo customizado se ainda não tiver
      enhanceNativeSelect(courseSelect);
    }
    if (isAdminCheck) isAdminCheck.checked = !!data.isAdmin;

    openModal('modal-edit-user');

    // Botão Reset Senha
    const resetBtn = qs('btn-reset-pass');
    resetBtn.onclick = async () => {
      if (await customConfirm('Resetar Senha', `Deseja enviar um e-mail de redefinição para ${data.email}?`)) {
        try {
          await sendPasswordResetEmail(auth, data.email);
          toast('E-mail de redefinição enviado!', true);
        } catch (err) {
          console.error('[usuarios] reset error', err);
          toast('Erro ao enviar e-mail de redefinição.', false);
        }
      }
    };

    // Botões rodapé
    qs('edit-user-cancel').onclick = () => closeModal('modal-edit-user');
    
    qs('edit-user-save').onclick = async () => {
      const newName = nameInput.value.trim();
      const newCourse = courseSelect.value;
      const newIsAdmin = isAdminCheck.checked;

      if (!newName) {
        toast('O nome não pode estar vazio.', false);
        return;
      }

      await updateDoc(userRef, {
        name: newName,
        course: newCourse,
        isAdmin: newIsAdmin
      });

      closeModal('modal-edit-user');
      toast('Usuário atualizado com sucesso.', true);
      await loadUsersView();
    };

  } catch (e) {
    console.error('[usuarios] erro ao abrir edição', e);
    toast('Erro ao carregar dados do usuário.', false);
  }
}

async function onRemoveUser(uid) {
  if (!(await customConfirm('Remover Usuário', 'Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.'))) {
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

  // Recarregar lista de usuários quando dados da conta forem atualizados
  document.addEventListener('account-data-saved', () => {
    loadUsersView();
  });
}

init();