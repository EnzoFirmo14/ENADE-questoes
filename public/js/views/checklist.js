// ============================================
// VIEW - CHECKLIST
// ============================================

import { qs } from '../ui.js';
import { PRIO_STYLE } from '../constants.js';

/**
 * Calcula o total de itens no currículo
 */
export const totalItems = curriculum => curriculum.reduce((a, s) => a + s.items.length, 0);

/**
 * Calcula quantos itens foram marcados como concluídos
 */
export const doneItems = progress => Object.values(progress).filter(Boolean).length;

/**
 * Atualiza a barra de progresso visual
 */
export function updateProgress(curriculum, progress) {
  const d = doneItems(progress);
  const t = totalItems(curriculum);
  const pct = t ? Math.round(d / t * 100) : 0;

  qs('prog-nums').textContent = `${d} / ${t}`;
  qs('prog-fill').style.width = `${pct}%`;
  qs('prog-pct').textContent = `${pct}%`;
}

/**
 * Renderiza a lista de checklist com todas as categorias e itens
 */
export function renderChecklist(curriculum, progress, onToggle) {
  const cont = qs('sections-container');
  cont.innerHTML = '';

  curriculum.forEach((sec, si) => {
    // Contar itens concluídos nesta seção
    const doneInSec = sec.items.filter((_, ii) => progress[`${si}-${ii}`]).length;

    // Obter estilo de prioridade
    const style = PRIO_STYLE[sec.prio] || PRIO_STYLE['revisar'];

    // Criar elemento da seção
    const div = document.createElement('div');
    div.className = 'section';
    div.innerHTML = `
      <div class="sec-head">
        <span class="cat-dot" style="background:${sec.color}"></span>
        <span class="sec-title">${sec.cat}</span>
        <span class="prio-badge" style="background:${style.bg};color:${style.text}">${sec.prio}</span>
        <span class="sec-count" id="seccount-${si}">${doneInSec}/${sec.items.length}</span>
      </div>
      <div class="items" id="items-${si}"></div>
    `;
    cont.appendChild(div);

    // Renderizar itens
    const itemsEl = qs(`items-${si}`);
    sec.items.forEach((txt, ii) => {
      const id = `${si}-${ii}`;
      const el = document.createElement('div');
      el.id = `item-${id}`;
      el.className = 'item' + (progress[id] ? ' done' : '');
      el.innerHTML = `
        <span class="cb${progress[id] ? ' on' : ''}">${progress[id] ? '✓' : ''}</span>
        <span class="item-text">${txt}</span>
      `;
      el.addEventListener('click', () => onToggle(id, si));
      itemsEl.appendChild(el);
    });
  });

  updateProgress(curriculum, progress);
}

/**
 * Sincroniza a visualização de um item após mudança de estado
 */
export function syncChecklistItem(curriculum, progress, id, si) {
  const el = qs(`item-${id}`);

  if (el) {
    el.className = 'item' + (progress[id] ? ' done' : '');
    const cb = el.querySelector('.cb');
    cb.className = 'cb' + (progress[id] ? ' on' : '');
    cb.textContent = progress[id] ? '✓' : '';
  }

  // Atualizar contador da seção
  const sec = curriculum[si];
  if (sec) {
    const done = sec.items.filter((_, ii) => progress[`${si}-${ii}`]).length;
    const counter = qs(`seccount-${si}`);
    if (counter) counter.textContent = `${done}/${sec.items.length}`;
  }

  updateProgress(curriculum, progress);
}