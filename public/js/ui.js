// ============================================
// UI - FUNÇÕES DE INTERFACE
// ============================================

/**
 * Seleciona um elemento pelo ID
 */
export const qs = (id) => document.getElementById(id);

/**
 * Exibe mensagem de erro
 */
export function showErr(msg) {
  const el = qs('auth-err');
  if (!el) return;

  el.textContent = msg || 'Ocorreu um erro.';
  el.style.display = 'block';
}

/**
 * Limpa a mensagem de erro
 */
export function clearErr() {
  const el = qs('auth-err');
  if (!el) return;

  el.textContent = '';
  el.style.display = 'none';
}

/**
 * Exibe notificação toast (mensagem temporária)
 */
let toastTimer = null;

export function toast(msg, ok = false) {
  const el = qs('toast');
  if (!el) return;

  el.textContent = msg || '';
  el.className = 'toast show' + (ok ? ' ok' : '');

  if (toastTimer) clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    el.className = 'toast';
  }, 2600);
}

/**
 * Mostra ou oculta o loader
 */
export function loader(show) {
  const el = qs('loader');
  if (!el) return;

  el.className = show ? '' : 'hide';
}

/**
 * Exibe uma tela (auth-screen ou app-screen)
 */
export function showScreen(id) {
  ['auth-screen', 'app-screen'].forEach((screenId) => {
    const el = qs(screenId);
    if (!el) return;

    el.className = 'screen' + (screenId === id ? ' active' : '');
  });
}

/**
 * Alterna entre aba de login e registro
 */
export function switchTab(tab) {
  const isLogin = tab === 'login';

  const tabLogin = qs('tab-login');
  const tabReg = qs('tab-reg');
  const authBtn = qs('auth-btn');
  const fieldName = qs('field-name');
  const inpEmail = qs('inp-email');
  const inpPass = qs('inp-pass');
  const inpName = qs('inp-name');

  if (tabLogin) tabLogin.className = 'tab' + (isLogin ? ' on' : '');
  if (tabReg) tabReg.className = 'tab' + (!isLogin ? ' on' : '');
  if (authBtn) authBtn.textContent = isLogin ? 'Entrar' : 'Criar conta';
  if (fieldName) fieldName.style.display = isLogin ? 'none' : 'block';

  clearErr();

  if (inpEmail) inpEmail.value = '';
  if (inpPass) inpPass.value = '';
  if (inpName) inpName.value = '';
}

/**
 * Exibe uma visualização (checklist, admin, users)
 */
export function showView(view) {
  ['checklist', 'admin', 'users'].forEach((id) => {
    const el = qs('view-' + id);
    if (!el) return;

    el.className = 'view' + (id === view ? ' active' : '');
  });

  const navChecklistBtn = qs('nav-checklist-btn');
  if (navChecklistBtn) {
    navChecklistBtn.style.display = view !== 'checklist' ? 'inline-flex' : 'none';
  }
}

/**
 * Exibe ou oculta elementos de admin
 */
export function setAdminUI(isAdmin) {
  const adminView = qs('view-admin');
  const adminNavBtn = qs('nav-admin-btn');
  const adminPanel = qs('admin-panel');

  if (adminView) {
    adminView.style.display = isAdmin ? '' : 'none';
  }

  if (adminNavBtn) {
    adminNavBtn.style.display = isAdmin ? 'inline-flex' : 'none';
  }

  if (adminPanel) {
    adminPanel.style.display = isAdmin ? '' : 'none';
  }
}

/**
 * Aplica dados básicos do usuário na interface
 */
export function setUserUI(user = null, isAdmin = false) {
  const userName = qs('user-name');
  const userEmail = qs('user-email');
  const userBadge = qs('user-role');

  if (userName) {
    userName.textContent = user?.displayName || 'Usuário';
  }

  if (userEmail) {
    userEmail.textContent = user?.email || '';
  }

  if (userBadge) {
    userBadge.textContent = isAdmin ? 'Admin' : 'Aluno';
    userBadge.className = 'role-badge' + (isAdmin ? ' admin' : '');
  }

  setAdminUI(isAdmin);
}

/**
 * Limpa a UI do usuário no logout
 */
export function resetUserUI() {
  setUserUI(null, false);
  showView('checklist');
}

/**
 * Habilita/desabilita botão
 */
export function setBtnDisabled(id, disabled = true) {
  const btn = qs(id);
  if (!btn) return;

  btn.disabled = disabled;
  btn.classList.toggle('is-disabled', disabled);
}

/**
 * Exibe ou oculta elemento por ID
 */
export function toggleEl(id, show = true, display = '') {
  const el = qs(id);
  if (!el) return;

  el.style.display = show ? display : 'none';
}