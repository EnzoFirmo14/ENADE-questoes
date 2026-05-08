import { qs } from '../ui.js';
import { CATEGORY_COLORS } from '../constants.js';

export function toggleAdminSec(si) {
  const body = qs(`admin-body-${si}`);
  if (!body) return;

  body.className =
    'admin-sec-body' + (body.className.includes('open') ? '' : ' open');
}

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
        <span class="admin-sec-title" data-head-title="${si}">☰ ${sec.cat}</span>

        <div
          class="fc-custom-select fc-custom-select--small"
          data-prio-select="${si}"
        >
          <div
            class="fc-select-trigger"
            role="button"
            tabindex="0"
            aria-haspopup="listbox"
            aria-expanded="false"
          >
            <span class="fc-select-value">
              ${sec.prio || 'obrigatório'}
            </span>
            <svg class="fc-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          <ul class="fc-select-dropdown" role="listbox">
            ${['obrigatório', 'importante', 'revisar', 'atenção máxima']
              .map(p => `
                <li
                  class="fc-select-option${p === sec.prio ? ' active' : ''}"
                  role="option"
                  aria-selected="${p === sec.prio}"
                  data-value="${p}"
                >
                  ${p}
                </li>
              `).join('')}
          </ul>
        </div>

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
        <!-- chips de cursos, igual estavam antes -->
        ...
      </div>
    `;

    cont.appendChild(div);
    renderAdminItems(adminSections, si, handlers);
  });

  // título abre/fecha
  cont.querySelectorAll('[data-head-title]').forEach(el => {
    el.addEventListener('click', () => {
      handlers.toggleAdminSec(Number(el.dataset.headTitle));
    });
  });

  // remover seção
  cont.querySelectorAll('[data-remove-section]').forEach(el => {
    el.addEventListener('click', e => {
      handlers.removeSection(e, Number(el.dataset.removeSection));
    });
  });

  // adicionar item
  cont.querySelectorAll('[data-add-item]').forEach(el => {
    el.addEventListener('click', () => {
      handlers.addItem(Number(el.dataset.addItem));
    });
  });

  // cursos (toggle + click)
  // ... (resto igual ao que você já tinha)

}

export const nextCategoryColor = index =>
  CATEGORY_COLORS[index % CATEGORY_COLORS.length];