// js/views/users.js

// ============================================
// VIEW - LISTA DE USUÁRIOS
// ============================================

import { qs, escapeHtml } from '../core/ui.js';

/**
 * Renderiza a lista de usuários com seu progresso
 */
export function renderUsersList(users, total, handlers = {}) {
  const cont = qs('users-list');
  if (!cont) return;

  cont.innerHTML = '';

  // Mostrar mensagem se não houver usuários
  if (!users.length) {
    cont.innerHTML = '<p class="muted-msg">Nenhum aluno cadastrado.</p>';
    return;
  }

  // Renderizar cada usuário
  users.forEach(u => {
    const done = Object.values(u.progress || {}).filter(Boolean).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const safeName = escapeHtml(u.name || u.email || '?');
    const safeEmail = escapeHtml(u.email || '');
    const safeCourse = escapeHtml(u.course || 'Sem curso definido');
    const letter = safeName[0].toUpperCase();

    const row = document.createElement('div');
    row.className = 'user-row';
    row.innerHTML = `
      <div class="user-avatar">${letter}</div>

      <div class="user-main" style="flex:1;min-width:0">
        <div class="user-email">${safeName}</div>
        <div style="font-size:11px;color:var(--muted)">${safeEmail}</div>
        <div class="user-course" style="font-size:11px;color:var(--muted)">
          ${safeCourse}
        </div>
      </div>

      <div class="user-actions">
        <span class="user-role ${u.isAdmin ? 'admin' : 'student'}">
          ${u.isAdmin ? 'Admin' : 'Aluno'}
        </span>
        <span class="user-prog">${done}/${total} (${pct}%)</span>
        <button class="user-btn edit" data-edit-user="${escapeHtml(u.uid)}">Editar</button>
        <button class="user-btn remove" data-remove-user="${escapeHtml(u.uid)}">Remover</button>
      </div>
    `;
    cont.appendChild(row);
  });

  // Eventos de editar/remover
  cont.querySelectorAll('[data-edit-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (handlers.onEditUser) {
        handlers.onEditUser(btn.dataset.editUser);
      }
    });
  });

  cont.querySelectorAll('[data-remove-user]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (handlers.onRemoveUser) {
        handlers.onRemoveUser(btn.dataset.removeUser);
      }
    });
  });
}