// js/views/checklist.js
 
/**
 * Normaliza o identificador de curso.
 * Tanto "ADS" quanto "ADS (Análise e Desenvolvimento de Sistemas)"
 * retornam "ADS".
 */
function normalizeCourse(raw) {
  return String(raw || '').split(' ')[0].toUpperCase();
}
 
/**
 * Filtra seções de acordo com o curso do usuário e o array sec.courses.
 * A normalização é feita aqui, e APENAS aqui.
 */
export function filterSectionsByCourse(curriculum, userCourse) {
  if (!userCourse) return curriculum;
 
  const courseId = normalizeCourse(userCourse);
 
  return curriculum.filter(sec => {
    const listRaw = Array.isArray(sec.courses) ? sec.courses : [];
 
    if (listRaw.length === 0) return true;
 
    const list = listRaw.map(v => normalizeCourse(v));
 
    if (list.includes('__ALL__') || list.includes('TODOS')) return true;
 
    return list.includes(courseId);
  });
}
 
/**
 * Atualiza o visual de um único item sem re-renderizar tudo.
 * Também atualiza o contador done/total da seção pai.
 */
function updateItemDOM(id, done) {
  const item = document.querySelector(`.item[data-id="${id}"]`);
  if (!item) return;
 
  if (done) {
    item.classList.add('done');
  } else {
    item.classList.remove('done');
  }
 
  const cb = item.querySelector('.cb');
  if (cb) {
    if (done) {
      cb.classList.add('on');
      cb.textContent = '\u2713';
      cb.setAttribute('aria-pressed', 'true');
    } else {
      cb.classList.remove('on');
      cb.textContent = '';
      cb.setAttribute('aria-pressed', 'false');
    }
  }
 
  const txt = item.querySelector('.item-text');
  if (txt) {
    txt.style.textDecoration = done ? 'line-through' : '';
  }
 
  // Atualiza contador done/total da secao (ex: "3/8")
  const si = id.split('-')[0];
  const counter = document.getElementById('sec-count-' + si);
  if (counter) {
    const section = item.closest('.section');
    if (section) {
      const total   = section.querySelectorAll('.item').length;
      const doneQty = section.querySelectorAll('.item.done').length;
      counter.textContent = doneQty + '/' + total;
    }
  }
}
 
/**
 * Renderiza o checklist completo.
 *
 * @param {Array}    visibleSections  Secoes ja filtradas pelo curso.
 * @param {Object}   progress         Mapa id -> boolean.
 * @param {Function} onToggle         Callback async(id, si).
 */
export function renderChecklist(visibleSections, progress, onToggle) {
  const cont = document.getElementById('sections-container');
  if (!cont) return;
 
  cont.innerHTML = '';
  let doneCount  = 0;
  let totalCount = 0;
 
  visibleSections.forEach(function(sec, si) {
    const items = sec.items || [];
 
    const secEl = document.createElement('div');
    secEl.className = 'section';
 
    const head = document.createElement('div');
    head.className = 'sec-head';
 
    // Dot colorido
    if (sec.color) {
      const dot = document.createElement('span');
      dot.className = 'cat-dot';
      dot.style.background = sec.color;
      head.appendChild(dot);
    }
 
    // Titulo
    const title = document.createElement('span');
    title.className  = 'sec-title';
    title.textContent = sec.cat || 'Secao';
    head.appendChild(title);
 
    // CORRECAO 1: Badge de prioridade
    // O admin salva como "prio" (config-page.js: adminSections[si].prio = val)
    // O codigo anterior lia "sec.priority" — campo inexistente — nunca exibia.
    const prioValue = sec.prio || sec.priority || '';
    if (prioValue) {
      const badge = document.createElement('span');
      badge.className = 'prio-badge';
      const prioColors = {
        'obrigatorio':    { bg: '#360000', color: '#dc2626' },
        'importante':     { bg: '#1f1800', color: '#d97706' },  
        'revisar':        { bg: '#000915', color: '#2563eb' },
        'atencao maxima': { bg: '#07002a', color: '#7c3aed' },
      };
      // normaliza para lookup (remove acentos para comparacao simples)
      const prioKey = prioValue
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const c = prioColors[prioKey] || { bg: '#f1f5f9', color: '#64748b' };
      badge.style.background = c.bg;
      badge.style.color       = c.color;
      badge.textContent       = prioValue;
      head.appendChild(badge);
    }
 
    // CORRECAO 2: Contador done/total por secao
    // Antes mostrava apenas total fixo ("8 itens").
    // Agora mostra marcados em tempo real ("3/8").
    const secDoneCount = items.filter(function(_, ii) {
      return !!progress[si + '-' + ii];
    }).length;
    const counter = document.createElement('span');
    counter.className   = 'sec-count';
    counter.id          = 'sec-count-' + si;
    counter.textContent = secDoneCount + '/' + items.length;
    head.appendChild(counter);
 
    secEl.appendChild(head);
 
    // Lista de itens
    const itemsEl = document.createElement('div');
    itemsEl.className = 'items';
 
    items.forEach(function(txt, ii) {
      const id   = si + '-' + ii;
      const done = !!progress[id];
      totalCount++;
      if (done) doneCount++;
 
      const itemEl = document.createElement('div');
      itemEl.className  = 'item' + (done ? ' done' : '');
      itemEl.dataset.id = id;
 
      const cb = document.createElement('button');
      cb.type      = 'button';
      cb.className = 'cb' + (done ? ' on' : '');
      cb.textContent = done ? '\u2713' : '';
      cb.setAttribute('aria-label', 'Marcar "' + txt + '" como ' + (done ? 'nao ' : '') + 'concluido');
      cb.setAttribute('aria-pressed', String(done));
 
      cb.addEventListener('click', async function(e) {
        e.stopPropagation();
 
        const novoDone = !progress[id];
        progress[id]   = novoDone;
 
        updateItemDOM(id, novoDone);
        updateProgressBar(
          document.querySelectorAll('.item').length,
          document.querySelectorAll('.item.done').length
        );
 
        try {
          await onToggle(id, si);
        } catch (err) {
          progress[id] = !novoDone;
          updateItemDOM(id, !novoDone);
          updateProgressBar(
            document.querySelectorAll('.item').length,
            document.querySelectorAll('.item.done').length
          );
          console.error('[checklist] erro ao salvar item', id, err);
        }
      });
 
      const span = document.createElement('span');
      span.className   = 'item-text';
      span.textContent = txt;
 
      itemEl.appendChild(cb);
      itemEl.appendChild(span);
      itemsEl.appendChild(itemEl);
    });
 
    secEl.appendChild(itemsEl);
    cont.appendChild(secEl);
  });
 
  updateProgressBar(totalCount, doneCount);
}
 
/**
 * Atualiza a barra de progresso global (topo da pagina).
 */
function updateProgressBar(total, done) {
  const progNums = document.getElementById('prog-nums');
  const progPct  = document.getElementById('prog-pct');
  const progFill = document.getElementById('prog-fill');
 
  const pct = total ? Math.round((done / total) * 100) : 0;
 
  if (progNums) progNums.textContent = done + ' / ' + total;
  if (progPct)  progPct.textContent  = pct + '%';
  if (progFill) progFill.style.width = pct + '%';
}
 
/**
 * Mantido por compatibilidade.
 */
export function syncChecklistItem(visibleSections, progress, id, si) {
  const total = document.querySelectorAll('.item').length;
  const done  = document.querySelectorAll('.item.done').length;
  updateProgressBar(total, done);
}
 
/**
 * Conta o total de itens visiveis para o curso.
 */
export function totalItems(curriculum, userCourse) {
  const visible = filterSectionsByCourse(curriculum, userCourse);
  return visible.reduce(function(acc, sec) {
    return acc + (sec.items ? sec.items.length : 0);
  }, 0);
}