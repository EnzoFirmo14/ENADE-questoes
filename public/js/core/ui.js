// js/core/ui.js — UI utilities

export const qs = (id) => document.getElementById(id);
export const qsa = (sel, parent = document) => [...parent.querySelectorAll(sel)];


// ── Loader ──
export function loader(show) {
  const el = qs('loader');
  if (!el) return;
  if (show) {
    el.classList.remove('hide');
    el.setAttribute('aria-hidden', 'false');
  } else {
    el.classList.add('hide');
    el.setAttribute('aria-hidden', 'true');
  }
}


// ── Toast Notifications ──
export function toast(msg, ok = false) {
  const container = qs('toast-container');
  if (!container) return;

  const el = document.createElement('div');
  el.className = `toast ${ok ? 'toast-success' : 'toast-error'}`;
  el.setAttribute('role', 'alert');
  el.textContent = msg;
  container.appendChild(el);

  // Auto-remove after 3.5s
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateX(100%)';
    el.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3500);
}


// ── Error Display ──
export function showErr(msg, targetId = 'auth-err') {
  const errBox = qs(targetId);
  if (!errBox) return;
  const textEl = errBox.querySelector(`#${targetId}-text`) || errBox;
  textEl.textContent = msg;
  errBox.style.display = 'flex';
  errBox.classList.add('show');
}

export function clearErr(targetId = 'auth-err') {
  const errBox = qs(targetId);
  if (!errBox) return;
  errBox.textContent = '';
  errBox.style.display = 'none';
  errBox.classList.remove('show');
}


// ── Debounce ──
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}


// ── Throttle ──
export function throttle(fn, limit = 100) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}


// ── Escape HTML (XSS prevention) ──
export function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}


// ── Safe Text Insertion ──
export function setText(el, text) {
  if (typeof el === 'string') el = qs(el);
  if (el) el.textContent = text;
}


// ── Toggle Element Visibility ──
export function toggle(el, show) {
  if (typeof el === 'string') el = qs(el);
  if (!el) return;
  if (show) {
    el.style.display = '';
    el.removeAttribute('aria-hidden');
  } else {
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
  }
}


// ── Confirm Dialog ──
export function confirmAction(message) {
  return confirm(message);
}

// ── Custom Modal System ──
export function openModal(id) {
  const modal = qs(id);
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

export function closeModal(id) {
  const modal = qs(id);
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

/**
 * Substitutos elegantes para confirm() e prompt()
 */
export async function customConfirm(title, message) {
  return new Promise((resolve) => {
    // Tenta encontrar ou criar o modal de confirmação
    let modal = qs('modal-confirm');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-confirm';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-header"><h3>${title}</h3></div>
          <div class="modal-body"><p>${message}</p></div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
            <button class="btn btn-primary" id="confirm-ok">Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      modal.querySelector('h3').textContent = title;
      modal.querySelector('p').textContent = message;
    }

    openModal('modal-confirm');

    const onCancel = () => {
      closeModal('modal-confirm');
      resolve(false);
      cleanup();
    };

    const onOk = () => {
      closeModal('modal-confirm');
      resolve(true);
      cleanup();
    };

    const cleanup = () => {
      qs('confirm-cancel').removeEventListener('click', onCancel);
      qs('confirm-ok').removeEventListener('click', onOk);
    };

    qs('confirm-cancel').addEventListener('click', onCancel);
    qs('confirm-ok').addEventListener('click', onOk);
  });
}

export async function customPrompt(title, label, defaultValue = '') {
  return new Promise((resolve) => {
    let modal = qs('modal-prompt');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-prompt';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal">
          <div class="modal-header"><h3>${title}</h3></div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">${label}</label>
              <input type="text" class="form-input" id="prompt-input" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="prompt-cancel">Cancelar</button>
            <button class="btn btn-primary" id="prompt-ok">OK</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    } else {
      modal.querySelector('h3').textContent = title;
      modal.querySelector('label').textContent = label;
    }

    const input = qs('prompt-input');
    input.value = defaultValue;
    openModal('modal-prompt');
    setTimeout(() => input.focus(), 100);

    const onCancel = () => {
      closeModal('modal-prompt');
      resolve(null);
      cleanup();
    };

    const onOk = () => {
      const val = input.value;
      closeModal('modal-prompt');
      resolve(val);
      cleanup();
    };

    const cleanup = () => {
      qs('prompt-cancel').removeEventListener('click', onCancel);
      qs('prompt-ok').removeEventListener('click', onOk);
      input.removeEventListener('keydown', onKey);
    };

    const onKey = (e) => {
      if (e.key === 'Enter') onOk();
      if (e.key === 'Escape') onCancel();
    };

    qs('prompt-cancel').addEventListener('click', onCancel);
    qs('prompt-ok').addEventListener('click', onOk);
    input.addEventListener('keydown', onKey);
  });
}


// ── Admin UI (mostrar/esconder coisas só de admin) ──
export function setAdminUI(isAdmin) {
  // console.log('[setAdminUI] isAdmin =', isAdmin); // use se quiser debugar

  // Qualquer elemento marcado com data-admin-only só aparece para admin
  qsa('[data-admin-only]').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
}