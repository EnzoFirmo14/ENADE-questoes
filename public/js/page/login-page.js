// js/page/login-page.js
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setDoc,
  doc
} from '../core/firebase.js';
import { FIREBASE_ERRORS } from '../core/constants.js';
import { qs, showErr, clearErr, toast, loader } from '../core/ui.js';
import { enhanceNativeSelect } from '../components/customSelect.js';

let isRegisterMode = false;

function bindAuthUI() {
  const tabLogin = qs('tab-login');
  const tabReg = qs('tab-reg');
  const form = qs('auth-form');
  const togglePassBtn = qs('toggle-pass');
  const togglePassConfirmBtn = qs('toggle-pass-confirm');

  tabLogin?.addEventListener('click', () => {
    isRegisterMode = false;
    tabLogin.classList.add('active');
    tabReg?.classList.remove('active');
    tabLogin.setAttribute('aria-selected', 'true');
    tabReg?.setAttribute('aria-selected', 'false');
    updateAuthModeUI();
    clearErr();
    qs('inp-email')?.focus();
  });

  tabReg?.addEventListener('click', () => {
    isRegisterMode = true;
    tabReg.classList.add('active');
    tabLogin?.classList.remove('active');
    tabReg.setAttribute('aria-selected', 'true');
    tabLogin?.setAttribute('aria-selected', 'false');
    updateAuthModeUI();
    clearErr();
    qs('inp-name')?.focus();
  });

  const handleTabKeydown = (e, tabElement) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      tabElement.click();
    }
  };

  tabLogin?.addEventListener('keydown', (e) => handleTabKeydown(e, tabLogin));
  tabReg?.addEventListener('keydown', (e) => handleTabKeydown(e, tabReg));

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    doAuth();
  });

  // Password toggle
  togglePassBtn?.addEventListener('click', () => {
    const passInput = qs('inp-pass');
    if (!passInput) return;
    const isPassword = passInput.type === 'password';
    passInput.type = isPassword ? 'text' : 'password';
    togglePassBtn.textContent = isPassword ? 'Ocultar' : 'Mostrar';
    togglePassBtn.setAttribute('aria-label', isPassword ? 'Ocultar' : 'Mostrar');
  });

  togglePassConfirmBtn?.addEventListener('click', () => {
    const passInput = qs('inp-pass-confirm');
    if (!passInput) return;
    const isPassword = passInput.type === 'password';
    passInput.type = isPassword ? 'text' : 'password';
    togglePassConfirmBtn.textContent = isPassword ? 'Ocultar' : 'Mostrar';
    togglePassConfirmBtn.setAttribute('aria-label', isPassword ? 'Ocultar' : 'Mostrar');
  });

  // Clear errors on input
  ['inp-email', 'inp-pass', 'inp-name', 'inp-pass-confirm'].forEach(id => {
    qs(id)?.addEventListener('input', () => clearErr());
  });
}

function updateAuthModeUI() {
  const nameField = qs('name-field');
  const courseField = qs('course-field');
  const confirmField = qs('confirm-pass-field');
  const btn = qs('auth-btn');
  const nameInput = qs('inp-name');
  const courseInput = qs('inp-course');
  const confirmInput = qs('inp-pass-confirm');

  if (nameField) nameField.style.display = isRegisterMode ? 'block' : 'none';
  if (courseField) courseField.style.display = isRegisterMode ? 'block' : 'none';
  if (confirmField) confirmField.style.display = isRegisterMode ? 'block' : 'none';
  if (btn) btn.textContent = isRegisterMode ? 'Criar conta' : 'Entrar';

  // Update required attributes
  if (nameInput) nameInput.setAttribute('aria-required', isRegisterMode ? 'true' : 'false');
  if (courseInput) courseInput.setAttribute('aria-required', isRegisterMode ? 'true' : 'false');
  if (confirmInput) confirmInput.setAttribute('aria-required', isRegisterMode ? 'true' : 'false');

  // Melhorar select de curso no modo registro
  if (isRegisterMode && courseInput) {
    enhanceNativeSelect(courseInput);
  }
}

async function doAuth() {
  const email = qs('inp-email')?.value.trim() || '';
  const pass = qs('inp-pass')?.value || '';
  const passConfirm = qs('inp-pass-confirm')?.value || '';
  const name = qs('inp-name')?.value.trim() || '';
  const course = qs('inp-course')?.value || '';
  const btn = qs('auth-btn');

  // Validation
  if (!email) return showErr('Informe seu email.');
  if (!pass) return showErr('Informe sua senha.');
  if (isRegisterMode) {
    if (!name) return showErr('Informe seu nome.');
    if (!course) return showErr('Selecione seu curso.');
    if (pass.length < 6) return showErr('A senha deve ter pelo menos 6 caracteres.');
    if (pass !== passConfirm) return showErr('As senhas não coincidem.');
  }

  if (!btn) return;

  btn.disabled = true;
  btn.setAttribute('data-loading', 'true');
  btn.textContent = isRegisterMode ? 'Criando...' : 'Entrando...';
  loader(true);
  clearErr();

  try {
    if (isRegisterMode) {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }

      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        name: name || email.split('@')[0],
        isAdmin: false,
        course,
        progress: {},
        disabled: false,
        createdAt: new Date().toISOString()
      });

      toast('Conta criada com sucesso!', true);
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
      toast('Login realizado com sucesso!', true);
    }

    window.location.href = './checklist.html';
  } catch (e) {
    const msg = FIREBASE_ERRORS[e.code] || e.message || 'Erro inesperado. Tente novamente.';
    showErr(msg);
    console.error('[login]', e.code, e.message);
  } finally {
    loader(false);
    btn.disabled = false;
    btn.removeAttribute('data-loading');
    btn.textContent = isRegisterMode ? 'Criar conta' : 'Entrar';
  }
}

// Init
bindAuthUI();
updateAuthModeUI();

// Forçar a melhoria do select de curso
const courseInput = qs('inp-course');
if (courseInput) {
  enhanceNativeSelect(courseInput);
}

// Hide loader after a short delay to prevent flash
setTimeout(() => loader(false), 300);
