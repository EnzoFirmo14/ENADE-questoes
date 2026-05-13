// js/app.js

// ============================================
// IMPORTAÇÕES
// ============================================
import { ADMIN_EMAILS } from './core/constants.js';
import {
  auth, db, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, addDoc,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  onAuthStateChanged, updateProfile, updatePassword
} from './core/firebase.js';
import {
  qs, showErr, clearErr, toast, loader,
  showScreen, switchTab, showView, setAdminUI
} from './core/ui.js';
import { renderChecklist, syncChecklistItem, totalItems } from './views/checklist.js';
import { renderAdmin, renderAdminItems, toggleAdminSec, nextCategoryColor } from './views/admin.js';
import { renderFlashcardsView } from './views/flashcards.js';
import { renderUsersList } from './views/users.js';
import { initCustomSelect } from './customSelect.js';

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentUser = null;
let userDoc = null;
let curriculum = [];
let progress = {};
let adminSections = [];
let flashcards = [];
let draggedSectionIndex = null;
let editingUserId = null;
let openCourseBoxes = new Set();

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

  const authInputs = ['inp-email', 'inp-pass', 'inp-pass-confirm', 'inp-name', 'inp-course'];
  authInputs.forEach(id => {
    qs(id)?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        qs('auth-btn')?.click();
      }
    });
  });

  qs('logout-btn')?.addEventListener('click', doLogout);
  qs('nav-admin-btn')?.addEventListener('click', () => openView('admin'));
  qs('nav-users-btn')?.addEventListener('click', () => openView('users'));
  qs('nav-checklist-btn')?.addEventListener('click', () => openView('checklist'));
  qs('nav-flashcards-btn')?.addEventListener('click', () => openView('flashcards'));
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
  const course = qs('inp-course')?.value || '';
  const isReg = qs('tab-reg')?.classList.contains('on');
  const btn = qs('auth-btn');

  console.log('[doAuth] chamado, isReg =', isReg, 'email =', email);

  if (!email || !pass) {
    return showErr('Preencha email e senha.');
  }

  if (isReg) {
    if (!name) {
      return showErr('Preencha seu nome.');
    }

    if (!course) {
      return showErr('Selecione seu curso.');
    }

    if (pass.length < 6) {
      return showErr('A senha deve ter pelo menos 6 caracteres.');
    }

    if (pass !== passConfirm) {
      return showErr('As senhas não coincidem. Por favor, digite novamente.');
    }
  }

  if (!btn) {
    console.warn('[doAuth] Botão auth-btn não encontrado');
    return;
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
        isAdmin: ADMIN_EMAILS.includes(email),
        course,
        progress: {}
      });

      console.log('[doAuth] registro concluído com sucesso');
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
      console.log('[doAuth] login concluído com sucesso');
    }

    toast('Login realizado com sucesso!', true);
    // NÃO redireciona. O onAuthStateChanged abaixo cuida de trocar a tela.
    clearErr();
  } catch (e) {
    console.error('[doAuth] erro', e);

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

  if (qs('course-field')) {
    qs('course-field').style.display = isReg ? 'block' : 'none';
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
  const newCourse = qs('account-course')?.value || '';

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
    await updateDoc(doc(db, 'users', currentUser.uid), {
      name: newName,
      course: newCourse
    });

    if (newPass) {
      await updatePassword(currentUser, newPass);
    }

    if (userDoc) {
      userDoc.name = newName;
      userDoc.course = newCourse;
    }

    if (qs('nav-user-email')) {
      qs('nav-user-email').textContent = newName;
    }

    if (qs('account-name-input')) {
      qs('account-name-input').value = newName;
    }
    if (qs('account-course')) {
      qs('account-course').value = newCourse;
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

    initChecklistCourseFilter({
      ...userDoc,
      name: newName,
      course: newCourse
    });

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

  curriculum.forEach(sec => {
    if (!Array.isArray(sec.courses)) {
      sec.courses = [];
    }
  });
}

async function saveProgress() {
  if (!currentUser) return;
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
  renderChecklist(curriculum.sections, progress, handleToggle, userDoc.course);

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
// FILTRO POR CURSO NA CHECKLIST
// ============================================
function applyCourseFilter(courseValue, isAdmin) {
  const filtered =
    !courseValue || isAdmin
      ? curriculum
      : curriculum.filter(
          sec =>
            Array.isArray(sec.courses) &&
            (sec.courses.includes('__ALL__') ||
             sec.courses.includes(courseValue))
        );

  renderChecklist(curriculum.sections, progress, handleToggle, userDoc.course);

  if (!filtered.length && qs('sections-container')) {
    qs('sections-container').innerHTML = `
      <div class="section">
        <div class="sec-head">
          <span class="sec-title">Nenhuma matéria para este curso</span>
        </div>
        <div class="items">
          <div class="item">
            <span class="item-text">
              Ajuste o filtro de curso ou peça para o admin associar matérias a este curso.
            </span>
          </div>
        </div>
      </div>
    `;
  }
}

function initChecklistCourseFilter(userData) {
  const isAdmin = !!userData.isAdmin;
  const userCourse = userData.course || '';

  if (isAdmin) {
    applyCourseFilter('', true);
  } else {
    applyCourseFilter(userCourse, false);
  }
}

//=============================================
// FLASHCARDS
// ============================================
async function loadFlashcards() {
  const snap = await getDocs(collection(db, 'flashcards'));
  flashcards = [];
  snap.forEach(d => flashcards.push({ id: d.id, ...d.data() }));
}

async function createFlashcard(sectionIndex, question, answer) {
  if (!currentUser) return;
  const ref = collection(db, 'flashcards');
  await addDoc(ref, {
    sectionIndex,
    question,
    answer,
    createdBy: currentUser.uid,
    createdAt: Date.now()
  });
  await loadFlashcards();
}

async function updateFlashcard(id, question, answer) {
  if (!id) return;
  await updateDoc(doc(db, 'flashcards', id), {
    question,
    answer
  });
  await loadFlashcards();
}

async function deleteFlashcardById(id) {
  if (!id) return;
  await deleteDoc(doc(db, 'flashcards', id));
  await loadFlashcards();
}

// ============================================
// ADMINISTRAÇÃO / VIEWS
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

  if (view === 'flashcards') {
    const renderFlashcardsPage = async (sectionIndex = 0, cardIndex = 0) => {
      renderFlashcardsView(curriculum, flashcards, {
        currentSectionId: sectionIndex,
        currentCardIndex: cardIndex,
        isAdmin: userDoc?.isAdmin,
        onChangeSection: (idx) => renderFlashcardsPage(idx, 0),
        onCreateCard: userDoc?.isAdmin
          ? async (idx, question, answer) => {
              await createFlashcard(idx, question, answer);
              renderFlashcardsPage(idx, 0);
            }
          : null,
        onEditCard: userDoc?.isAdmin
          ? async (id, question, answer) => {
              await updateFlashcard(id, question, answer);
              renderFlashcardsPage(sectionIndex, cardIndex);
            }
          : null,
        onDeleteCard: userDoc?.isAdmin
          ? async (id) => {
              await deleteFlashcardById(id);
              renderFlashcardsPage(sectionIndex, 0);
            }
          : null,
        onChangeCard: async (idx) => renderFlashcardsPage(sectionIndex, idx)
      });
    };

    renderFlashcardsPage(0, 0);
  }

  if (view === 'checklist') {
    renderChecklistView();
  }
}

function saveOpenCourseBoxesState() {
  openCourseBoxes.clear();
  document.querySelectorAll('.admin-courses-row.open').forEach(row => {
    const id = row.id;
    const si = id.replace('admin-courses-', '');
    openCourseBoxes.add(parseInt(si));
  });
}

function restoreOpenCourseBoxesState() {
  openCourseBoxes.forEach(si => {
    const row = qs(`admin-courses-${si}`);
    if (row) {
      row.classList.add('open');
      const arrow = document.querySelector(`[data-courses-toggle="${si}"] .arrow-icon`);
      if (arrow) {
        arrow.textContent = '▴';
      }
    }
  });
}

function renderAdminView() {
  saveOpenCourseBoxesState();

  renderAdmin(adminSections, {
    toggleAdminSec,
    updatePrio: (si, val) => { adminSections[si].prio = val; },
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

  document.querySelectorAll('[data-prio-select]').forEach(el => {
    const si = Number(el.getAttribute('data-prio-select'));
    const currentPrio = adminSections[si]?.prio || 'obrigatório';

    initCustomSelect(el, {
      value: currentPrio,
      onChange: (newVal) => {
        adminSections[si].prio = newVal;
      }
    });
  });

  restoreOpenCourseBoxesState();
}

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
    snap.forEach(d => users.push({ uid: d.id, ...d.data() }));
    renderUsersList(users, totalItems(curriculum), {
      onEditUser,
      onRemoveUser
    });
  } catch {
    cont.innerHTML = '<p class="muted-msg">Erro ao carregar usuários.</p>';
  }
}

async function onEditUser(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    toast('Usuário não encontrado.');
    return;
  }

  const data = snap.data();
  openEditUserModal({ uid, ...data });
}

async function onRemoveUser(uid) {
  if (!confirm('Remover este usuário? Essa ação não pode ser desfeita.')) return;

  try {
    await updateDoc(doc(db, 'users', uid), { disabled: true });
    toast('Usuário removido (desabilitado).', true);
    loadUsersView();
  } catch {
    toast('Erro ao remover usuário.');
  }
}

// ============================================
// MODAL DE EDIÇÃO DE USUÁRIO
// ============================================
function openEditUserModal(user) {
  editingUserId = user.uid;

  const modal = qs('edit-user-modal');
  if (!modal) return;

  const nameInp = qs('edit-user-name');
  const courseSel = qs('edit-user-course');
  const adminCheckbox = qs('edit-user-is-admin');
  const adminField = qs('edit-user-admin-field');

  if (nameInp) nameInp.value = user.name || '';
  if (courseSel) courseSel.value = user.course || '';
  if (adminCheckbox) adminCheckbox.checked = user.isAdmin || false;

  if (adminField) {
    adminField.style.display = (userDoc && userDoc.isAdmin) ? 'block' : 'none';
  }

  modal.style.display = 'flex';
}

function closeEditUserModal() {
  const modal = qs('edit-user-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  editingUserId = null;
}

async function saveEditedUser() {
  if (!editingUserId) {
    closeEditUserModal();
    return;
  }

  if (!userDoc || !userDoc.isAdmin) {
    toast('Apenas administradores podem editar usuários.');
    closeEditUserModal();
    return;
  }

  const nameInp = qs('edit-user-name');
  const courseSel = qs('edit-user-course');
  const adminCheckbox = qs('edit-user-is-admin');

  const newName = (nameInp?.value || '').trim();
  const newCourse = (courseSel?.value || '').trim();
  const newIsAdmin = adminCheckbox?.checked || false;

  if (!newName) {
    toast('Informe o nome do aluno.');
    return;
  }

  const ref = doc(db, 'users', editingUserId);

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      toast('Usuário não encontrado.');
      closeEditUserModal();
      return;
    }
    const data = snap.data();

    await updateDoc(ref, {
      name: newName || data.name,
      course: newCourse,
      isAdmin: newIsAdmin
    });

    toast('Dados do aluno atualizados.', true);

    if (currentUser && currentUser.uid === editingUserId) {
      if (userDoc) {
        userDoc.name = newName || data.name;
        userDoc.course = newCourse;
        userDoc.isAdmin = newIsAdmin;
      }
      if (qs('nav-user-email')) {
        qs('nav-user-email').textContent = newName || data.name;
      }
      if (qs('account-name-input')) {
        qs('account-name-input').value = newName || data.name;
      }
      if (qs('account-course')) {
        qs('account-course').value = newCourse;
      }
      initChecklistCourseFilter({
        ...userDoc,
        name: newName || data.name,
        course: newCourse,
        isAdmin: newIsAdmin
      });
      if (newIsAdmin !== data.isAdmin) {
        setAdminUI(newIsAdmin);
      }
    }

    closeEditUserModal();
    loadUsersView();
  } catch {
    toast('Erro ao atualizar dados do aluno.');
  }
}

function bindEditUserModalEvents() {
  const cancelBtn = qs('edit-user-cancel');
  const saveBtn = qs('edit-user-save');
  const backdrop = qs('edit-user-modal');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeEditUserModal);
  }

  if (backdrop) {
    backdrop.addEventListener('click', e => {
      if (e.target === backdrop) {
        closeEditUserModal();
      }
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', saveEditedUser);
  }
}

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
// INICIALIZAÇÃO + LISTENER DE AUTH
// ============================================
bindStaticEvents();
bindAccountMenuEvents();
bindEditUserModalEvents();
updateAuthModeUI();
loader(true);

onAuthStateChanged(auth, async user => {
  console.log('[onAuthStateChanged] disparou. user =', user);

  try {
    if (!user) {
      console.log('[onAuthStateChanged] user NULL, tela de login');
      currentUser = null;
      userDoc = null;
      curriculum = [];
      progress = {};
      adminSections = [];
      flashcards = [];

      setAdminUI(false);
      showScreen('auth-screen', false);
      showView('checklist');
      loader(false);
      clearErr();
      return;
    }

    console.log('[onAuthStateChanged] user LOGADO', user);
    currentUser = user;

    const ref = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    let data;

    if (!snap.exists()) {
      data = {
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        isAdmin: ADMIN_EMAILS.includes(user.email),
        course: '',
        progress: {}
      };
      await setDoc(ref, data);
    } else {
      data = snap.data();
    }

    userDoc = data;
    progress = data.progress || {};

    if (ADMIN_EMAILS.includes(user.email) && !data.isAdmin) {
      await updateDoc(ref, { isAdmin: true });
      data.isAdmin = true;
      userDoc.isAdmin = true;
    }

    await loadCurriculum();
    await loadFlashcards();

    if (qs('nav-user-email')) qs('nav-user-email').textContent = data.name || user.email;
    if (qs('account-email')) qs('account-email').value = data.email || user.email;
    if (qs('account-name-input')) qs('account-name-input').value = data.name || '';
    if (qs('account-course')) qs('account-course').value = data.course || '';

    initChecklistCourseFilter(data);
    setAdminUI(!!data.isAdmin);

    showScreen('app-screen', false, clearErr);
    showView('checklist');
    loader(false);

    console.log('[onAuthStateChanged] fluxo de login finalizado com sucesso');
  } catch (e) {
    console.error('[onAuthStateChanged] ERRO:', e);
    toast('Erro ao carregar seus dados. Tente novamente.', false);
    showScreen('auth-screen', false);
    showView('checklist');
    loader(false);
  }
});

// ============================================
// EXPORTS (se precisar em outros módulos)
// ============================================
export {
  openView,
  renderChecklistView,
  initChecklistCourseFilter
};