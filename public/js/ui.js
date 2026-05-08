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
  ['checklist', 'flashcards', 'admin', 'users'].forEach((id) => {
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

/**
 * Define estado de carregamento em um botão
 */
export function setButtonLoading(id, loading = true) {
  const btn = qs(id);
  if (!btn) return;

  btn.disabled = loading;
  btn.classList.toggle('btn-loading', loading);
  
  if (loading) {
    btn.dataset.originalText = btn.textContent;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
  }
}

/**
 * Marca um campo como válido ou inválido
 */
export function setFieldState(fieldId, state = 'normal', errorMsg = '') {
  const field = qs(fieldId)?.closest('.field') || qs(fieldId)?.parentElement?.closest('.field');
  if (!field) return;

  field.className = field.className.replace(/\s*(error|success)/g, '');
  
  if (state === 'error') {
    field.classList.add('error');
    const errorEl = field.querySelector('.field-error-msg');
    if (errorEl) {
      errorEl.textContent = errorMsg;
    }
  } else if (state === 'success') {
    field.classList.add('success');
  }
}

/**
 * Valida email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida senha mínima (6 caracteres)
 */
export function isValidPassword(password) {
  return password && password.length >= 6;
}

/**
 * Valida campo obrigatório
 */
export function isFieldFilled(value) {
  return value && value.toString().trim().length > 0;
}

/**
 * Limpa estado de validação de um campo
 */
export function clearFieldState(fieldId) {
  const field = qs(fieldId)?.closest('.field') || qs(fieldId)?.parentElement?.closest('.field');
  if (!field) return;

  field.className = field.className.replace(/\s*(error|success)/g, '');
  const errorEl = field?.querySelector('.field-error-msg');
  if (errorEl) {
    errorEl.textContent = '';
  }
}

/**
 * Exibe notificação de alerta
 */
export function showAlert(message, type = 'info') {
  const container = document.createElement('div');
  container.className = `alert ${type}`;
  container.innerHTML = `
    <div class="alert-icon">
      ${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ'}
    </div>
    <div class="alert-content">${message}</div>
  `;
  
  const main = qs('app-screen') || document.body;
  main.insertBefore(container, main.firstChild);
  
  setTimeout(() => {
    container.style.opacity = '0';
    setTimeout(() => container.remove(), 300);
  }, 4000);
}

/**
 * Habilita/desabilita todos os inputs em um container
 */
export function setFormDisabled(formId, disabled = true) {
  const form = qs(formId);
  if (!form) return;

  const inputs = form.querySelectorAll('input, select, textarea, button');
  inputs.forEach(input => {
    if (input.tagName !== 'BUTTON' || !input.classList.contains('btn-primary')) {
      input.disabled = disabled;
    }
  });
}

/**
 * Reseta todos os campos de um formulário
 */
export function resetForm(formId) {
  const form = qs(formId);
  if (!form) return;

  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    if (input.type === 'checkbox' || input.type === 'radio') {
      input.checked = false;
    } else {
      input.value = '';
    }
    clearFieldState(input.id);
  });
}