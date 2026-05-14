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
let toastTimer = null;

export function toast(msg, ok = false) {
  const container = qs('toast-container') || qs('toast')?.parentElement;
  const el = qs('toast');
  if (!el) return;

  // Clear previous timer
  if (toastTimer) clearTimeout(toastTimer);

  el.textContent = msg;
  el.className = `toast ${ok ? 'toast-success' : 'toast-error'}`;
  el.setAttribute('role', 'alert');

  toastTimer = setTimeout(() => {
    el.textContent = '';
    el.className = 'toast';
    el.removeAttribute('role');
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


// ── Admin UI (mostrar/esconder coisas só de admin) ──
export function setAdminUI(isAdmin) {
  // console.log('[setAdminUI] isAdmin =', isAdmin); // use se quiser debugar

  // Qualquer elemento marcado com data-admin-only só aparece para admin
  qsa('[data-admin-only]').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
}