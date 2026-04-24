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

    // garante que sempre exista um array de cursos
    const courses = Array.isArray(sec.courses) ? sec.courses : [];

    div.innerHTML = `
      <div class="admin-sec-head" data-head="${si}">
        <span class="cat-dot" style="background:${sec.color}"></span>
        <span class="admin-sec-title" data-head-title="${si}">☰ ${sec.cat}</span>
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

      <!-- Toggle Cursos -->
      <div class="admin-courses-toggle" data-courses-toggle="${si}">
        <span class="field-label">Cursos</span>
        <button type="button" class="courses-arrow">
          <span class="arrow-icon">▾</span>
        </button>
      </div>

      <!-- Linha de cursos (chips) -->
      <div class="admin-courses-row" id="admin-courses-${si}">
        <label class="pill-check">
          <input
            type="checkbox"
            data-course="__ALL__"
            data-sec="${si}"
            ${courses.includes('__ALL__') ? 'checked' : ''}
          >
          <span>Todos</span>
        </label>

        <label class="pill-check">
          <input
            type="checkbox"
            data-course="ADS (Análise e Desenvolvimento de Sistemas)"
            data-sec="${si}"
            ${courses.includes('ADS (Análise e Desenvolvimento de Sistemas)') ? 'checked' : ''}
          >
          <span>ADS (Análise e Desenvolvimento de Sistemas)</span>
        </label>

        <label class="pill-check">
          <input
            type="checkbox"
            data-course="SI (Sistemas de Informação)"
            data-sec="${si}"
            ${courses.includes('SI (Sistemas de Informação)') ? 'checked' : ''}
          >
          <span>SI (Sistemas de Informação)</span>
        </label>

        <label class="pill-check">
          <input
            type="checkbox"
            data-course="EC (Engenharia da Computação)"
            data-sec="${si}"
            ${courses.includes('EC (Engenharia da Computação)') ? 'checked' : ''}
          >
          <span>EC (Engenharia da Computação)</span>
        </label>
      </div>
    `;

    cont.appendChild(div);
    renderAdminItems(adminSections, si, handlers);
  });

  // Expandir/contrair seção: agora só clicando no título
  cont.querySelectorAll('[data-head-title]').forEach(el => {
    el.addEventListener('click', () => {
      handlers.toggleAdminSec(Number(el.dataset.headTitle));
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

  // Abrir/fechar seleção de cursos
  cont.querySelectorAll('[data-courses-toggle]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation(); // clicar no toggle não colapsa a seção
      const si = Number(el.dataset.coursesToggle);
      const row = qs(`admin-courses-${si}`);
      if (!row) return;

      const isOpen = row.classList.toggle('open');
      const arrow = el.querySelector('.arrow-icon');
      if (arrow) {
        arrow.textContent = isOpen ? '▴' : '▾';
      }
    });
  });

  // Clique nos cursos (linha inteira, com delegação) – nunca fecha a seção
  cont.querySelectorAll('.admin-courses-row').forEach(row => {
    row.addEventListener('click', e => {
      e.stopPropagation(); // qualquer clique aqui NÃO fecha/abre categoria

      const input = e.target.closest('input[type="checkbox"][data-course]');
      if (!input) return;

      const si = Number(input.dataset.sec);
      const courseId = input.dataset.course;
      const checked = input.checked;

      if (handlers.toggleSectionCourse) {
        handlers.toggleSectionCourse(si, courseId, checked);
      }
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