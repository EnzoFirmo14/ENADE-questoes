// ============================================
// IMPORTAÇÕES
// ============================================
import { ADMIN_EMAILS } from './constants.js';
import { DEFAULT_DATA } from './data.js';
import {
  auth, db, doc, getDoc, setDoc, updateDoc, collection, getDocs,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, updateProfile
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

// ============================================
// AUTENTICAÇÃO
// ============================================

/**
 * Vincula eventos estáticos de interface
 */
function bindStaticEvents() {
  qs('tab-login').addEventListener('click', () => switchTab('login'));
  qs('tab-reg').addEventListener('click', () => switchTab('register'));
  qs('auth-btn').addEventListener('click', doAuth);
  qs('logout-btn').addEventListener('click', doLogout);
  qs('nav-admin-btn').addEventListener('click', () => openView('admin'));
  qs('nav-users-btn').addEventListener('click', () => openView('users'));
  qs('nav-checklist-btn').addEventListener('click', () => openView('checklist'));
  qs('reset-progress-btn').addEventListener('click', resetProgress);
  qs('save-btn').addEventListener('click', saveCurriculum);
  qs('add-cat-btn').addEventListener('click', addCategory);
}

/**
 * Realiza login ou registro
 */
async function doAuth() {
  const email = qs('inp-email').value.trim();
  const pass = qs('inp-pass').value;
  const name = qs('inp-name').value.trim();
  const isReg = qs('tab-reg').classList.contains('on');
  const btn = qs('auth-btn');

  if (!email || !pass) {
    return showErr('Preencha email e senha.');
  }

  btn.disabled = true;
  btn.textContent = '...';

  try {
    if (isReg) {
      // Registro
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
      // Login
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

/**
 * Realiza logout
 */
async function doLogout() {
  await signOut(auth);
}

// ============================================
// CURRÍCULO E PROGRESSO
// ============================================

/**
 * Carrega o currículo do Firestore
 */
async function loadCurriculum() {
  const snap = await getDoc(doc(db, 'curriculum', 'main'));
  if (snap.exists()) {
    curriculum = snap.data().sections;
  } else {
    curriculum = DEFAULT_DATA;
    await setDoc(doc(db, 'curriculum', 'main'), { sections: curriculum });
  }
}

/**
 * Salva o progresso do usuário no Firestore
 */
async function saveProgress() {
  await updateDoc(doc(db, 'users', currentUser.uid), { progress });
}

/**
 * Salva o currículo atualizado no Firestore
 */
async function saveCurriculum() {
  const btn = qs('save-btn');
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

/**
 * Reinicia o progresso do usuário
 */
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

/**
 * Abre uma visualização (checklist, admin, users)
 */
function openView(view) {
  showView(view);
  if (view === 'admin') renderAdminView();
  if (view === 'users') loadUsersView();
}

/**
 * Renderiza a visualização de checklist
 */
function renderChecklistView() {
  renderChecklist(curriculum, progress, toggleItem);
}

/**
 * Alterna o estado de um item no checklist
 */
async function toggleItem(id, si) {
  progress[id] = !progress[id];
  syncChecklistItem(curriculum, progress, id, si);
  await saveProgress();
}

// ============================================
// ADMINISTRAÇÃO (EDIÇÃO DE CURRÍCULO)
// ============================================

/**
 * Renderiza a visualização de administração
 */
function renderAdminView() {
  adminSections = JSON.parse(JSON.stringify(curriculum));
  renderAdmin(adminSections, {
    toggleAdminSec,
    updatePrio: (si, val) => { adminSections[si].prio = val; },
    removeSection,
    addItem,
    editItem,
    removeItem
  });
}

/**
 * Remove uma categoria do currículo
 */
function removeSection(e, si) {
  e.stopPropagation();
  if (!confirm(`Remover categoria "${adminSections[si].cat}"?`)) return;
  adminSections.splice(si, 1);
  renderAdminView();
}

/**
 * Adiciona um novo item à categoria
 */
function addItem(si) {
  const inp = qs(`new-item-${si}`);
  const txt = inp.value.trim();
  if (!txt) return;

  adminSections[si].items.push(txt);
  inp.value = '';
  renderAdminItems(adminSections, si, { editItem, removeItem });
}

/**
 * Edita um item existente
 */
function editItem(si, ii) {
  const txt = prompt('Editar:', adminSections[si].items[ii]);
  if (txt === null || !txt.trim()) return;

  adminSections[si].items[ii] = txt.trim();
  renderAdminItems(adminSections, si, { editItem, removeItem });
}

/**
 * Remove um item da categoria
 */
function removeItem(si, ii) {
  adminSections[si].items.splice(ii, 1);
  renderAdminItems(adminSections, si, { editItem, removeItem });
}

/**
 * Adiciona uma nova categoria ao currículo
 */
function addCategory() {
  const name = qs('new-cat-input').value.trim();
  const prio = qs('new-cat-prio').value;
  if (!name) return;

  adminSections.push({
    cat: name,
    color: nextCategoryColor(adminSections.length),
    prio,
    items: []
  });

  qs('new-cat-input').value = '';
  renderAdminView();
  setTimeout(() => toggleAdminSec(adminSections.length - 1), 50);
}

// ============================================
// VISUALIZAÇÃO DE USUÁRIOS
// ============================================

/**
 * Carrega e exibe a lista de usuários
 */
async function loadUsersView() {
  const cont = qs('users-list');
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
    showScreen('auth-screen');
    loader(false);
    qs('auth-btn').disabled = false;
    qs('auth-btn').textContent = qs('tab-reg').classList.contains('on')
      ? 'Criar conta'
      : 'Entrar';
    return;
  }

  currentUser = user;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  // Cria documento do usuário se não existir
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

  // Atualiza status de admin
  if (ADMIN_EMAILS.includes(user.email) && !data.isAdmin) {
    await updateDoc(ref, { isAdmin: true });
    data.isAdmin = true;
  }

  // Carrega currículo e renderiza UI
  await loadCurriculum();
  qs('nav-user-email').textContent = data.name;
  qs('nav-admin-btn').style.display = data.isAdmin ? 'inline-flex' : 'none';
  qs('nav-users-btn').style.display = data.isAdmin ? 'inline-flex' : 'none';
  renderChecklistView();
  showScreen('app-screen');
  loader(false);
  clearErr();
  qs('auth-btn').disabled = false;
  qs('auth-btn').textContent = 'Entrar';
});

// ============================================
// INICIALIZAÇÃO
// ============================================
bindStaticEvents();
loader(true);