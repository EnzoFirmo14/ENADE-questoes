// js/login-page.js
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  setDoc,
  doc
} from './firebase.js';
import { ADMIN_EMAILS } from './constants.js';
import { qs, showErr, clearErr, toast, loader } from './ui.js';

function bindAuthUI() {
  qs('tab-login')?.addEventListener('click', () => {
    qs('tab-login')?.classList.add('on');
    qs('tab-reg')?.classList.remove('on');
    updateAuthModeUI();
  });

  qs('tab-reg')?.addEventListener('click', () => {
    qs('tab-reg')?.classList.add('on');
    qs('tab-login')?.classList.remove('on');
    updateAuthModeUI();
  });

  qs('auth-btn')?.addEventListener('click', doAuth);
}

function updateAuthModeUI() {
  const isReg = qs('tab-reg')?.classList.contains('on');

  if (qs('name-field')) qs('name-field').style.display = isReg ? 'block' : 'none';
  if (qs('course-field')) qs('course-field').style.display = isReg ? 'block' : 'none';
  if (qs('confirm-pass-field')) qs('confirm-pass-field').style.display = isReg ? 'block' : 'none';
  if (qs('auth-btn')) qs('auth-btn').textContent = isReg ? 'Criar conta' : 'Entrar';
}

async function doAuth() {
  const email = qs('inp-email')?.value.trim() || '';
  const pass = qs('inp-pass')?.value || '';
  const passConfirm = qs('inp-pass-confirm')?.value || '';
  const name = qs('inp-name')?.value.trim() || '';
  const course = qs('inp-course')?.value || '';
  const isReg = qs('tab-reg')?.classList.contains('on');
  const btn = qs('auth-btn');

  if (!email || !pass) {
    return showErr('Preencha email e senha.');
  }

  if (isReg) {
    if (!name) return showErr('Preencha seu nome.');
    if (!course) return showErr('Selecione seu curso.');
    if (pass.length < 6) return showErr('A senha deve ter pelo menos 6 caracteres.');
    if (pass !== passConfirm) return showErr('As senhas não coincidem.');
  }

  if (!btn) return;

  btn.disabled = true;
  btn.textContent = '...';
  loader(true);
  clearErr();

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

      toast('Conta criada com sucesso!', true);
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
      toast('Login realizado com sucesso!', true);
    }

    window.location.href = './checklist.html';
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
  } finally {
    loader(false);
    btn.disabled = false;
    btn.textContent = isReg ? 'Criar conta' : 'Entrar';
  }
}

bindAuthUI();
updateAuthModeUI();
loader(false);