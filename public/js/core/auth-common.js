// js/core/auth-common.js
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc } from './firebase.js';
import { toast, loader } from './ui.js';

export function requireAuth({ redirectTo = './index.html', requireAdmin = false } = {}) {
  loader(true);

  return new Promise((resolve) => {
    onAuthStateChanged(auth, async user => {
      if (!user) {
        window.location.href = redirectTo;
        return;
      }

      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);

        let data = snap.exists() ? snap.data() : null;

        // fallback: se não existir doc, cria um básico (não admin)
        if (!data) {
          data = {
            email: user.email,
            name: user.displayName || user.email.split('@')[0],
            isAdmin: false,
            course: '',
            progress: {}
          };
          await setDoc(ref, data);
        }

        const isAdmin = !!data.isAdmin;

        if (requireAdmin && !isAdmin) {
          toast('Acesso restrito a administradores.', false);
          window.location.href = './checklist.html';
          return;
        }

        loader(false);
        resolve({ user, isAdmin, userDoc: data });
      } catch (e) {
        console.error('[requireAuth] erro ao carregar usuário', e);
        toast('Erro ao carregar sua sessão. Tente novamente.', false);
        loader(false);
      }
    });
  });
}