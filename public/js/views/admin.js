// ============================================
// VIEW - ADMINISTRAÇÃO
// ============================================

import { qs } from '../ui.js';
import { CATEGORY_COLORS } from '../constants.js';

/**
 * Alterna a expansão/contração de uma seção administrativamente
 */
export function toggleAdminSec(si) {
  const body = qs(`admin-body-${si}`);
  if (!body) return;

  body.className =
    'admin-sec-body' + (body.className.includes('open') ? '' : ' open');
}

/**
 * Renderiza a lista de itens de uma categoria para edição
 */
export function renderAdminItems(adminSections, si, handlers) {
  const cont = qs(`admin-items-${si}`);
  if (!cont) return;

  cont.innerHTML = '';

  adminSections[si].items.forEach((txt, ii) => {
    const row = document.createElement('div');
    row.className = 'admin-item-row';
    row.innerHTML = `
      <span class="admin-item-txt">${txt}</span>
      <button class="icon-btn edit" data-edit-item="${si}-${ii}">✎</button>
      <button class="icon-btn del" data-remove-item="${si}-${ii}">✕</button>
    `;
    cont.appendChild(row);
  });

  cont.querySelectorAll('[data-edit-item]').forEach(el => {
    el.addEventListener('click', () => {
      const [si2, ii2] = el.dataset.editItem.split('-').map(Number);
      handlers.editItem(si2, ii2);
    });
  });

  cont.querySelectorAll('[data-remove-item]').forEach(el => {
    el.addEventListener('click', () => {
      const [si2, ii2] = el.dataset.removeItem.split('-').map(Number);
      handlers.removeItem(si2, ii2);
    });
  });
}

/**
 * Renderiza a interface de administração de categorias
 */
export function renderAdmin(adminSections, handlers) {
  const cont = qs('admin-sections');
  cont.innerHTML = '';

  adminSections.forEach((sec, si) => {
    const div = document.createElement('div');
    div.className = 'admin-sec';
    div.setAttribute('draggable', 'true');
    div.dataset.index = si;

    div.innerHTML = `
      <div class="admin-sec-head" data-head="${si}">
        <span class="cat-dot" style="background:${sec.color}"></span>
        <span class="admin-sec-title">☰ ${sec.cat}</span>
        <select class="prio-select" data-prio="${si}">
          ${['obrigatório', 'importante', 'revisar', 'atenção máxima']
            .map(p => `<option${p === sec.prio ? ' selected' : ''}>${p}</option>`)
            .join('')}
        </select>
        <button class="icon-btn del" data-remove-section="${si}" style="margin-left:8px">✕</button>
      </div>

      <div class="admin-sec-body" id="admin-body-${si}">
        <div id="admin-items-${si}"></div>
        <div class="add-item-row">
          <input id="new-item-${si}" placeholder="Novo item…"/>
          <button data-add-item="${si}">+ Adicionar</button>
        </div>
      </div>
    `;

    cont.appendChild(div);
    renderAdminItems(adminSections, si, handlers);
  });

  // Expandir/contrair seção
  cont.querySelectorAll('[data-head]').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('select') || e.target.closest('button')) return;
      handlers.toggleAdminSec(Number(el.dataset.head));
    });
  });

  // Alterar prioridade
  cont.querySelectorAll('[data-prio]').forEach(el => {
    el.addEventListener('change', () => {
      handlers.updatePrio(Number(el.dataset.prio), el.value);
    });
  });

  // Remover seção
  cont.querySelectorAll('[data-remove-section]').forEach(el => {
    el.addEventListener('click', e => {
      handlers.removeSection(e, Number(el.dataset.removeSection));
    });
  });

  // Adicionar item
  cont.querySelectorAll('[data-add-item]').forEach(el => {
    el.addEventListener('click', () => {
      handlers.addItem(Number(el.dataset.addItem));
    });
  });

  // Drag and drop
  cont.querySelectorAll('.admin-sec').forEach(el => {
    el.addEventListener('dragstart', e => {
      if (handlers.onDragStart) handlers.onDragStart(e);
    });

    el.addEventListener('dragover', e => {
      if (handlers.onDragOver) handlers.onDragOver(e);
    });

    el.addEventListener('drop', e => {
      if (handlers.onDrop) handlers.onDrop(e);
    });

    el.addEventListener('dragend', e => {
      if (handlers.onDragEnd) handlers.onDragEnd(e);
    });
  });
}

/**
 * Define a cor da próxima categoria baseada no índice
 */
export const nextCategoryColor = index =>
  CATEGORY_COLORS[index % CATEGORY_COLORS.length];