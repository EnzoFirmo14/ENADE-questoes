// js/ui.js
export const qs = (id) => document.getElementById(id);

export function loader(show) {
  const el = qs('loader');
  if (!el) return;
  if (show) {
    el.classList.remove('hide');
  } else {
    el.classList.add('hide');
  }
}

export function toast(msg, ok = false) {
  const el = qs('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle('ok', !!ok);
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

export function showErr(msg) {
  const errBox = qs('auth-err');
  if (!errBox) return;
  errBox.textContent = msg;
  errBox.style.display = 'block';
}

export function clearErr() {
  const errBox = qs('auth-err');
  if (!errBox) return;
  errBox.textContent = '';
  errBox.style.display = 'none';
}