// ============================================
// IMPORTAÇÕES
// ============================================
import { ADMIN_EMAILS } from './constants.js';
import {
  auth, db, doc, getDoc, setDoc, updateDoc, collection, getDocs,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, updateProfile, updatePassword
} from './firebase.js';
import { qs, showErr, clearErr, toast, loader, showScreen, switchTab, showView } from './ui.js';
import { renderChecklist, syncChecklistItem, totalItems } from './views/checklist.js';
import { renderAdmin, renderAdminItems, toggleAdminSec, nextCategoryColor } from './views/admin.js';
import { renderUsersList } from './views/users.js';

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentUser = null;
let userDoc = null;
let curriculum = [];
let progress = {};
let adminSections = [];
let draggedSectionIndex = null;

// ============================================
// AUTENTICAÇÃO
// ============================================

function bindStaticEvents() {
  qs('tab-login')?.addEventListener('click', () => {
    switchTab('login');
    updateAuthModeUI();
  });

  qs('tab-reg')?.addEventListener('click', () => {
    switchTab('register');
    updateAuthModeUI();
  });

  qs('auth-btn')?.addEventListener('click', doAuth);
  qs('logout-btn')?.addEventListener('click', doLogout);
  qs('nav-admin-btn')?.addEventListener('click', () => openView('admin'));
  qs('nav-users-btn')?.addEventListener('click', () => openView('users'));
  qs('nav-checklist-btn')?.addEventListener('click', () => openView('checklist'));
  qs('reset-progress-btn')?.addEventListener('click', resetProgress);
  qs('save-btn')?.addEventListener('click', saveCurriculum);
  qs('add-cat-btn')?.addEventListener('click', addCategory);

  document.querySelectorAll('[data-toggle-pass]').forEach(btn => {
    btn.addEventListener('click', () => togglePassword(btn));
  });
}

async function doAuth() {
  const email = qs('inp-email')?.value.trim() || '';
  const pass = qs('inp-pass')?.value || '';
  const passConfirm = qs('inp-pass-confirm')?.value || '';
  const name = qs('inp-name')?.value.trim() || '';
  const isReg = qs('tab-reg')?.classList.contains('on');
  const btn = qs('auth-btn');

  if (!email || !pass) {
    return showErr('Preencha email e senha.');
  }

  if (isReg) {
    if (!name) {
      return showErr('Preencha seu nome.');
    }

    if (pass.length < 6) {
      return showErr('A senha deve ter pelo menos 6 caracteres.');
    }

    if (pass !== passConfirm) {
      return showErr('As senhas não coincidem. Por favor, digite novamente.');
    }
  }

  btn.disabled = true;
  btn.textContent = '...';

  try {
    if (isReg) {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }

      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        name: name || email.split('@')[0],
        isAdmin: false,
        progress: {}
      });
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
    }
  } catch (e) {
    const msgs = {
      'auth/email-already-in-use': 'Email já cadastrado.',
      'auth/wrong-password': 'Senha incorreta.',
      'auth/user-not-found': 'Usuário não encontrado.',
      'auth/invalid-email': 'Email inválido.',
      'auth/weak-password': 'Senha muito fraca.',
      'auth/invalid-credential': 'Email ou senha incorretos.'
    };

    showErr(msgs[e.code] || e.message);
    btn.disabled = false;
    btn.textContent = isReg ? 'Criar conta' : 'Entrar';
  }
}

function updateAuthModeUI() {
  const isReg = qs('tab-reg')?.classList.contains('on');

  if (qs('name-field')) {
    qs('name-field').style.display = isReg ? 'block' : 'none';
  }

  if (qs('confirm-pass-field')) {
    qs('confirm-pass-field').style.display = isReg ? 'block' : 'none';
  }

  if (qs('auth-btn')) {
    qs('auth-btn').textContent = isReg ? 'Criar conta' : 'Entrar';
  }

  if (!isReg && qs('inp-pass-confirm')) {
    qs('inp-pass-confirm').value = '';
  }
}

function togglePassword(btn) {
  const inputId = btn.dataset.togglePass;
  const input = qs(inputId);
  if (!input) return;

  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.textContent = isHidden ? 'Ocultar' : 'Mostrar';
  btn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
}

async function doLogout() {
  await signOut(auth);
}

// ============================================
// MENU DE CONTA
// ============================================

function bindAccountMenuEvents() {
  const trigger = qs('account-trigger');
  const dropdown = qs('account-dropdown');
  const saveBtn = qs('save-account-btn');

  if (!trigger || !dropdown || !saveBtn) return;

  trigger.addEventListener('click', e => {
    e.stopPropagation();
    dropdown.classList.toggle('open');

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
    const clickedInsideMenu = dropdown.contains(e.target);
    const clickedTrigger = trigger.contains(e.target);

    if (!clickedInsideMenu && !clickedTrigger) {
      dropdown.classList.remove('open');
    }
  });

  saveBtn.addEventListener('click', saveAccountData);
}

async function saveAccountData() {
  const errBox = qs('account-err');
  const newName = qs('account-name-input')?.value.trim() || '';
  const newPass = qs('account-pass-input')?.value || '';
  const confirmPass = qs('account-pass-confirm-input')?.value || '';

  if (errBox) {
    errBox.style.display = 'none';
    errBox.textContent = '';
  }

  try {
    if (!currentUser) return;

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

    await updateProfile(currentUser, { displayName: newName });
    await updateDoc(doc(db, 'users', currentUser.uid), { name: newName });

    if (newPass) {
      await updatePassword(currentUser, newPass);
    }

    if (userDoc) {
      userDoc.name = newName;
    }

    if (qs('nav-user-email')) {
      qs('nav-user-email').textContent = newName;
    }

    if (qs('account-name-input')) {
      qs('account-name-input').value = newName;
    }

    if (qs('account-pass-input')) {
      qs('account-pass-input').value = '';
    }

    if (qs('account-pass-confirm-input')) {
      qs('account-pass-confirm-input').value = '';
    }

    if (qs('account-dropdown')) {
      qs('account-dropdown').classList.remove('open');
    }

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
  }
}

// ============================================
// CURRÍCULO E PROGRESSO
// ============================================

async function loadCurriculum() {
  const ref = doc(db, 'curriculum', 'main');
  const snap = await getDoc(ref);

  if (snap.exists()) {
    curriculum = snap.data().sections || [];
  } else {
    curriculum = [];
    await setDoc(ref, { sections: [] });
  }
}

async function saveProgress() {
  await updateDoc(doc(db, 'users', currentUser.uid), { progress });
}

async function saveCurriculum() {
  const btn = qs('save-btn');
  if (!btn) return;

  btn.disabled = true;

  await setDoc(doc(db, 'curriculum', 'main'), { sections: adminSections });
  curriculum = JSON.parse(JSON.stringify(adminSections));
  progress = {};
  await saveProgress();
  renderChecklistView();

  btn.className = 'save-btn saved';
  btn.textContent = '✓ Salvo!';

  setTimeout(() => {
    btn.className = 'save-btn';
    btn.textContent = 'Salvar alterações';
    btn.disabled = false;
  }, 2500);

  toast('Currículo atualizado!', true);
}

async function resetProgress() {
  if (!confirm('Reiniciar todo o progresso?')) return;
  progress = {};
  await saveProgress();
  renderChecklistView();
  toast('Progresso reiniciado');
}

// ============================================
// NAVEGAÇÃO E VISUALIZAÇÃO
// ============================================

function renderChecklistView() {
  renderChecklist(curriculum, progress, toggleItem);

  if (!curriculum.length && qs('sections-container')) {
    qs('sections-container').innerHTML = `
      <div class="section">
        <div class="sec-head">
          <span class="sec-title">Nenhuma categoria cadastrada</span>
        </div>
        <div class="items">
          <div class="item">
            <span class="item-text">
              Use o painel Admin para adicionar a primeira matéria e seus assuntos.
            </span>
          </div>
        </div>
      </div>
    `;
  }
}

async function toggleItem(id, si) {
  progress[id] = !progress[id];
  syncChecklistItem(curriculum, progress, id, si);
  await saveProgress();
}

// ============================================
// ADMINISTRAÇÃO
// ============================================

function openView(view) {
  showView(view);

  if (view === 'admin') {
    adminSections = JSON.parse(JSON.stringify(curriculum));
    renderAdminView();
  }

  if (view === 'users') {
    loadUsersView();
  }
}

function renderAdminView() {
  renderAdmin(adminSections, {
    toggleAdminSec,
    updatePrio: (si, val) => { adminSections[si].prio = val; },
    removeSection,
    addItem,
    editItem,
    removeItem,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd
  });
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
    items: []
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

// ============================================
// VISUALIZAÇÃO DE USUÁRIOS
// ============================================

async function loadUsersView() {
  const cont = qs('users-list');
  if (!cont) return;

  cont.innerHTML = '<p class="muted-msg">Carregando…</p>';

  try {
    const snap = await getDocs(collection(db, 'users'));
    const users = [];
    snap.forEach(d => users.push(d.data()));
    renderUsersList(users, totalItems(curriculum));
  } catch {
    cont.innerHTML = '<p class="muted-msg">Erro ao carregar usuários.</p>';
  }
}

// ============================================
// AUTENTICAÇÃO - MONITORAMENTO DE ESTADO
// ============================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null;
    userDoc = null;
    progress = {};
    curriculum = [];
    adminSections = [];

    showScreen('auth-screen');
    loader(false);

    if (qs('auth-btn')) {
      qs('auth-btn').disabled = false;
      qs('auth-btn').textContent = qs('tab-reg')?.classList.contains('on')
        ? 'Criar conta'
        : 'Entrar';
    }

    if (qs('account-dropdown')) {
      qs('account-dropdown').classList.remove('open');
    }

    return;
  }

  currentUser = user;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      name: user.displayName || user.email.split('@')[0],
      isAdmin: ADMIN_EMAILS.includes(user.email),
      progress: {}
    });
  }

  let data = (await getDoc(ref)).data();
  userDoc = data;
  progress = data.progress || {};

  if (ADMIN_EMAILS.includes(user.email) && !data.isAdmin) {
    await updateDoc(ref, { isAdmin: true });
    data.isAdmin = true;
  }

  await loadCurriculum();

  if (qs('nav-user-email')) {
    qs('nav-user-email').textContent = data.name;
  }

  if (qs('account-name-input')) {
    qs('account-name-input').value = data.name;
  }

  if (qs('account-pass-input')) {
    qs('account-pass-input').value = '';
  }

  if (qs('account-pass-confirm-input')) {
    qs('account-pass-confirm-input').value = '';
  }

  if (qs('nav-admin-btn')) {
    qs('nav-admin-btn').style.display = data.isAdmin ? 'inline-flex' : 'none';
  }

  if (qs('nav-users-btn')) {
    qs('nav-users-btn').style.display = data.isAdmin ? 'inline-flex' : 'none';
  }

  renderChecklistView();
  showScreen('app-screen');
  loader(false);
  clearErr();

  if (qs('auth-btn')) {
    qs('auth-btn').disabled = false;
    qs('auth-btn').textContent = 'Entrar';
  }
});

// ============================================
// DRAG AND DROP PARA REORDENAR CATEGORIAS
// ============================================

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
// INICIALIZAÇÃO
// ============================================
bindStaticEvents();
bindAccountMenuEvents();
updateAuthModeUI();
loader(true);