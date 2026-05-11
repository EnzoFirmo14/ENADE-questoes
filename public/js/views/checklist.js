// js/views/checklist.js
export function renderChecklist(curriculum, progress, onToggle) {
  const cont = document.getElementById('sections-container');
  if (!cont) return;

  cont.innerHTML = '';
  let doneCount = 0;
  let totalCount = 0;

  curriculum.forEach((sec, si) => {
    const items = sec.items || [];

    const secEl = document.createElement('div');
    secEl.className = 'section';

    const head = document.createElement('div');
    head.className = 'sec-head';

    const title = document.createElement('span');
    title.className = 'sec-title';
    title.textContent = sec.cat || 'Seção';

    head.appendChild(title);
    secEl.appendChild(head);

    const itemsEl = document.createElement('div');
    itemsEl.className = 'items';

    items.forEach((txt, ii) => {
      const id = `${si}-${ii}`;
      totalCount++;

      const itemEl = document.createElement('div');
      itemEl.className = 'item' + (progress[id] ? ' done' : '');

      const cb = document.createElement('button');
      cb.className = 'cb';
      cb.textContent = progress[id] ? '✓' : '';
      cb.addEventListener('click', () => onToggle(id, si));

      const span = document.createElement('span');
      span.className = 'item-text';
      span.textContent = txt;

      if (progress[id]) doneCount++;

      itemEl.appendChild(cb);
      itemEl.appendChild(span);
      itemsEl.appendChild(itemEl);
    });

    secEl.appendChild(itemsEl);
    cont.appendChild(secEl);
  });

  const progNums = document.getElementById('prog-nums');
  const progPct = document.getElementById('prog-pct');
  const progFill = document.getElementById('prog-fill');

  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  if (progNums) progNums.textContent = `${doneCount} / ${totalCount}`;
  if (progPct) progPct.textContent = `${pct}%`;
  if (progFill) progFill.style.width = `${pct}%`;
}

export function syncChecklistItem(curriculum, progress, id, si) {
  // aqui você pode manter sua lógica extra, se precisar
}

export function totalItems(curriculum) {
  return curriculum.reduce((acc, sec) => acc + (sec.items?.length || 0), 0);
}