// js/account-menu.js
import {
  auth,
  db,
  signOut,
  doc,
  getDoc,
  updateDoc,
  updateProfile,
  updatePassword
} from './core/firebase.js';
import { requireAuth } from './core/auth-common.js';
import { qs, toast, loader } from './core/ui.js';

let currentUser = null;
let userDoc = null;

function bindAccountMenuEvents() {
  const trigger = qs('account-trigger');
  const dropdown = qs('account-dropdown');
  const saveBtn = qs('save-account-btn');

  if (!trigger || !dropdown || !saveBtn) return;

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = dropdown.classList.toggle('open');
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

    const err = qs('account-err');
    if (err) {
      err.style.display = 'none';
      err.textContent = '';
    }
  });

  dropdown.addEventListener('click', e => {
    e.stopPropagation();
  });

  document.addEventListener('click', e => {
    if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
      dropdown.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  saveBtn.addEventListener('click', saveAccountData);

  const logoutBtn = qs('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      window.location.href = './index.html';
    });
  }
}

async function saveAccountData() {
  const errBox = qs('account-err');
  const newName = qs('account-name-input')?.value.trim() || '';
  const newPass = qs('account-pass-input')?.value || '';
  const confirmPass = qs('account-pass-confirm-input')?.value || '';
  const newCourse = qs('account-course')?.value || '';

  if (errBox) {
    errBox.style.display = 'none';
    errBox.textContent = '';
  }

  if (!currentUser || !userDoc) {
    toast('Usuário não autenticado.', false);
    return;
  }

  if (!newName) {
    if (errBox) {
      errBox.textContent = 'Informe seu nome.';
      errBox.style.display = 'block';
    }
    return;
  }

  if (newPass || confirmPass) {
    if (newPass.length < 6) {
      if (errBox) {
        errBox.textContent = 'A nova senha deve ter pelo menos 6 caracteres.';
        errBox.style.display = 'block';
      }
      return;
    }

    if (newPass !== confirmPass) {
      if (errBox) {
        errBox.textContent = 'As senhas não coincidem.';
        errBox.style.display = 'block';
      }
      return;
    }
  }

  loader(true);

  try {
    await updateProfile(currentUser, { displayName: newName });
    await updateDoc(doc(db, 'users', currentUser.uid), {
      name: newName,
      course: newCourse
    });

    if (newPass) {
      await updatePassword(currentUser, newPass);
    }

    userDoc.name = newName;
    userDoc.course = newCourse;

    if (qs('nav-user-email')) qs('nav-user-email').textContent = newName;
    if (qs('account-name-input')) qs('account-name-input').value = newName;
    if (qs('account-course')) qs('account-course').value = newCourse;
    if (qs('account-pass-input')) qs('account-pass-input').value = '';
    if (qs('account-pass-confirm-input')) qs('account-pass-confirm-input').value = '';

    toast('Dados atualizados com sucesso!', true);
  } catch (e) {
    const msg =
      e.code === 'auth/requires-recent-login'
        ? 'Para alterar a senha, faça login novamente e tente de novo.'
        : (e.message || 'Erro ao atualizar seus dados.');

    if (errBox) {
      errBox.textContent = msg;
      errBox.style.display = 'block';
    }
  } finally {
    loader(false);
  }
}

async function initAccountMenu() {
  // garante que só entra aqui se estiver autenticado
  const { user } = await requireAuth();
  currentUser = user;

  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    toast('Usuário não encontrado no banco de dados.', false);
    return;
  }

  userDoc = snap.data();

  // preenche os campos da conta
  if (qs('nav-user-email')) qs('nav-user-email').textContent = userDoc.name || user.email;
  if (qs('account-email')) qs('account-email').value = userDoc.email || user.email;
  if (qs('account-name-input')) qs('account-name-input').value = userDoc.name || '';
  if (qs('account-course')) qs('account-course').value = userDoc.course || '';

  bindAccountMenuEvents();
}

export { initAccountMenu };