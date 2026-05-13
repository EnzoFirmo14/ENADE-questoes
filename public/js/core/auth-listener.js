// js/auth-listener.js
import { auth, onAuthStateChanged } from './firebase.js';
import { loader, clearErr } from './ui.js';

function getCurrentPage() {
  const path = window.location.pathname;
  const file = path.split('/').pop() || 'index.html';
  return file.toLowerCase();
}

function handleAuthState() {
  loader(true);

  onAuthStateChanged(auth, (user) => {
    const page = getCurrentPage();
    const isIndex = page === '' || page === 'index.html';
    const isChecklist = page === 'checklist.html';

    // Só para log de depuração:
    console.log('[auth-listener] page=', page, 'user=', !!user);

    if (isIndex) {
      // Na index: NÃO redireciona nunca.
      // Quem decide ir para checklist é o seu código de login (doAuth) chamando window.location.href.
      clearErr();
      loader(false);
      return;
    }

    if (isChecklist) {
      if (!user) {
        // Está em checklist sem login → volta para index
        window.location.href = './index.html';
        return;
      }

      // Está em checklist logado → ok, não redireciona
      clearErr();
      loader(false);
      return;
    }

    // Em outras páginas (flashcards, config, etc.) por enquanto não tratamos nada
    clearErr();
    loader(false);
  });
}

handleAuthState();