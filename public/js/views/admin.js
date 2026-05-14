// js/views/admin.js
// ============================================
// VIEW - ADMINISTRAÇÃO
// ============================================
 
import { qs, escapeHtml } from '../core/ui.js';
import { CATEGORY_COLORS } from '../core/constants.js';
 
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
      <span class="admin-item-txt">${escapeHtml(txt)}</span>
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
 
    const courses = Array.isArray(sec.courses) ? sec.courses : [];
 
    div.innerHTML = `
      <div class="admin-sec-head" data-head="${si}">
        <span class="cat-dot" style="background:${sec.color}"></span>
        <span class="admin-sec-title">☰ ${escapeHtml(sec.cat)}</span>
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
 
      <div class="admin-courses-toggle" data-courses-toggle="${si}">
        <span class="field-label">Cursos</span>
        <button type="button" class="courses-arrow">
          <span class="arrow-icon">▾</span>
        </button>
      </div>
 
      <div class="admin-courses-row" id="admin-courses-${si}">
        <label class="pill-check">
          <input type="checkbox" data-course="__ALL__" data-sec="${si}"
            ${courses.includes('__ALL__') ? 'checked' : ''}>
          <span>Todos</span>
        </label>
        <label class="pill-check">
          <input type="checkbox"
            data-course="ADS (Análise e Desenvolvimento de Sistemas)"
            data-sec="${si}"
            ${courses.includes('ADS (Análise e Desenvolvimento de Sistemas)') ? 'checked' : ''}>
          <span>ADS (Análise e Desenvolvimento de Sistemas)</span>
        </label>
        <label class="pill-check">
          <input type="checkbox"
            data-course="SI (Sistemas de Informação)"
            data-sec="${si}"
            ${courses.includes('SI (Sistemas de Informação)') ? 'checked' : ''}>
          <span>SI (Sistemas de Informação)</span>
        </label>
        <label class="pill-check">
          <input type="checkbox"
            data-course="EC (Engenharia da Computação)"
            data-sec="${si}"
            ${courses.includes('EC (Engenharia da Computação)') ? 'checked' : ''}>
          <span>EC (Engenharia da Computação)</span>
        </label>
      </div>
    `;
 
    cont.appendChild(div);
    renderAdminItems(adminSections, si, handlers);
  });
 
  // ─── CORREÇÃO CENTRAL ────────────────────────────────────────────────────
  // O select nativo dispara eventos que borbulham pelo DOM. Em alguns browsers
  // o e.target ao chegar no head já não é mais o select (pode ser o body ou
  // um elemento intermediário), fazendo e.target.closest('.prio-select')
  // retornar null e o guard falhar. A solução definitiva é parar na fonte:
  // bloqueamos click, mousedown e mouseup diretamente no select.
  cont.querySelectorAll('.prio-select').forEach(sel => {
    ['click', 'mousedown', 'mouseup'].forEach(evt =>
      sel.addEventListener(evt, e => e.stopPropagation())
    );
  });
 
  // Toggle de seção ao clicar no cabeçalho (com guards redundantes por segurança)
  cont.querySelectorAll('.admin-sec-head').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.prio-select'))          return;
      if (e.target.closest('.fc-custom-select'))     return; // Novo guard para select customizado
      if (e.target.closest('[data-remove-section]')) return;
      if (e.target.closest('[data-courses-toggle]')) return;
      handlers.toggleAdminSec(Number(el.dataset.head));
    });
  });
 
  // Alterar prioridade — só atualiza o dado, sem re-renderizar nem propagar
  cont.querySelectorAll('.prio-select').forEach(el => {
    el.addEventListener('change', e => {
      e.stopPropagation();
      handlers.updatePrio(Number(el.dataset.prio), el.value);
    });
  });
 
  // Remover seção
  cont.querySelectorAll('[data-remove-section]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      handlers.removeSection(e, Number(el.dataset.removeSection));
    });
  });
 
  // Adicionar item
  cont.querySelectorAll('[data-add-item]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      handlers.addItem(Number(el.dataset.addItem));
    });
  });
 
  // Abrir/fechar caixa de cursos
  cont.querySelectorAll('[data-courses-toggle]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const si = Number(el.dataset.coursesToggle);
      const row = qs(`admin-courses-${si}`);
      if (!row) return;
      const isOpen = row.classList.toggle('open');
      const arrow = el.querySelector('.arrow-icon');
      if (arrow) arrow.textContent = isOpen ? '▴' : '▾';
    });
  });
 
  // Checkboxes de curso
  cont.querySelectorAll('.admin-courses-row').forEach(row => {
    row.addEventListener('click', e => {
      e.stopPropagation();
      const input = e.target.closest('input[type="checkbox"][data-course]');
      if (!input) return;
      if (handlers.toggleSectionCourse) {
        handlers.toggleSectionCourse(
          Number(input.dataset.sec),
          input.dataset.course,
          input.checked
        );
      }
    });
  });
 
  // Drag and drop
  cont.querySelectorAll('.admin-sec').forEach(el => {
    el.addEventListener('dragstart', e => handlers.onDragStart?.(e));
    el.addEventListener('dragover',  e => handlers.onDragOver?.(e));
    el.addEventListener('drop',      e => handlers.onDrop?.(e));
    el.addEventListener('dragend',   e => handlers.onDragEnd?.(e));
  });
}
 
/**
 * Define a cor da próxima categoria baseada no índice
 */
export const nextCategoryColor = index =>
  CATEGORY_COLORS[index % CATEGORY_COLORS.length];