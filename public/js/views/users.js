// ============================================
// VIEW - LISTA DE USUÁRIOS
// ============================================

import { qs } from '../ui.js';

/**
 * Renderiza a lista de usuários com seu progresso
 */
export function renderUsersList(users, total) {
  const cont = qs('users-list');
  cont.innerHTML = '';

  // Mostrar mensagem se não houver usuários
  if (!users.length) {
    cont.innerHTML = '<p class="muted-msg">Nenhum aluno cadastrado.</p>';
    return;
  }

  // Renderizar cada usuário
  users.forEach(u => {
    const done = Object.values(u.progress || {}).filter(Boolean).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    const letter = (u.name || u.email || '?')[0].toUpperCase();

    const row = document.createElement('div');
    row.className = 'user-row';
    row.innerHTML = `
      <div class="user-avatar">${letter}</div>
      <div style="flex:1;min-width:0">
        <div class="user-email">${u.name || u.email}</div>
        <div style="font-size:11px;color:var(--muted)">${u.email}</div>
      </div>
      <span class="user-role ${u.isAdmin ? 'admin' : 'student'}">
        ${u.isAdmin ? 'Admin' : 'Aluno'}
      </span>
      <span class="user-prog">${done}/${total} (${pct}%)</span>
    `;
    cont.appendChild(row);
  });
}