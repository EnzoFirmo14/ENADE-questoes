// js/views/checklist.js

// Filtra seções de acordo com o curso do usuário e o array sec.courses
function filterSectionsByCourse(curriculum, userCourse) {
  if (!userCourse) return curriculum; // sem curso definido -> mostra tudo

  return curriculum.filter(sec => {
    const courses = Array.isArray(sec.courses) ? sec.courses : [];

    // sem cursos marcados -> aparece para todos
    if (!courses.length) return true;

    // marcado "Todos"
    if (courses.includes('__ALL__')) return true;

    // seção específica pro curso do usuário
    return courses.includes(userCourse);
  });
}

export function renderChecklist(curriculum, progress, onToggle, userCourse) {
  const cont = document.getElementById('sections-container');
  if (!cont) return;

  // aplica filtro pelo curso
  const visibleSections = filterSectionsByCourse(curriculum, userCourse);

  cont.innerHTML = '';
  let doneCount = 0;
  let totalCount = 0;

  visibleSections.forEach((sec, si) => {
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
      // id continua baseado no índice da seção + índice do item
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

export function totalItems(curriculum, userCourse) {
  // soma só os itens das seções visíveis para o curso
  const visibleSections = filterSectionsByCourse(curriculum, userCourse);
  return visibleSections.reduce((acc, sec) => acc + (sec.items?.length || 0), 0);
}