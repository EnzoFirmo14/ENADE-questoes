import { qs } from '../ui.js';
 
/**
 * Renderiza a tela de flashcards.
 * sections: currículo filtrado (mesmas sections do checklist)
 * cards: array de flashcards vindos do Firestore
 * handlers: callbacks pra criar card, trocar matéria, editar, excluir e navegar.
 */
export function renderFlashcardsView(sections, cards, handlers) {
  const cont = qs('flashcards-container');
  if (!cont) return;
 
  if (!sections.length) {
    cont.innerHTML = `
      <div class="fc-empty">
        <h2>Nenhuma matéria disponível ainda</h2>
        <p>Use o painel Admin para criar matérias e assuntos. Depois volte aqui para gerar flashcards.</p>
      </div>
    `;
    return;
  }
 
  const currentSectionId = typeof handlers.currentSectionId === 'number' ? handlers.currentSectionId : 0;
  const currentCardIndex = typeof handlers.currentCardIndex === 'number' ? handlers.currentCardIndex : 0;
  const currentSection = sections[currentSectionId] || sections[0];
  const sectionCards = cards.filter(c => c.sectionIndex === currentSectionId);
  const activeCard = sectionCards[currentCardIndex] || sectionCards[0] || null;
  const isAdmin = !!handlers.isAdmin;
  const hasCards = sectionCards.length > 0;
 
  cont.innerHTML = `
    <div class="fc-layout">
      <div class="fc-left">
        <div class="fc-header">
          <h2>Flashcards</h2>
          <p>Revise cada matéria com perguntas e respostas rápidas.</p>
        </div>
 
        <div class="fc-field">
          <label>Matéria</label>
          <div class="fc-custom-select" id="fc-custom-select">
            <div class="fc-select-trigger" id="fc-select-trigger" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false">
              <span class="fc-select-value" id="fc-select-value">${sections[currentSectionId]?.cat || sections[0].cat}</span>
              <svg class="fc-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            <ul class="fc-select-dropdown" id="fc-select-dropdown" role="listbox">
              ${sections.map((sec, index) => `
                <li class="fc-select-option${index === currentSectionId ? ' active' : ''}"
                    role="option"
                    aria-selected="${index === currentSectionId}"
                    data-value="${index}">
                  ${sec.cat}
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
 
        ${isAdmin ? `
          <div class="fc-field">
            <label for="fc-question">Pergunta</label>
            <textarea id="fc-question" rows="3" placeholder="Escreva a pergunta do flashcard."></textarea>
          </div>
          <div class="fc-field">
            <label for="fc-answer">Resposta</label>
            <textarea id="fc-answer" rows="4" placeholder="Escreva a resposta do flashcard."></textarea>
          </div>
          <button type="button" class="btn-primary fc-save-btn" id="fc-save-btn">
            Salvar flashcard
          </button>
        ` : ``}
      </div>
 
      <div class="fc-right">
        <div class="fc-review">
          <div class="fc-review-header">
            <div>
              <span class="fc-section-name">${currentSection.cat}</span>
              <p class="fc-subtitle">${hasCards ? `Card ${currentCardIndex + 1} de ${sectionCards.length}` : 'Nenhum flashcard disponível'}</p>
            </div>
            ${hasCards ? `<span class="fc-counter">${sectionCards.length} flashcards</span>` : ''}
          </div>
 
          ${hasCards ? `
            <div class="fc-card-wrapper">
              <div class="fc-card" id="fc-card">
                <div class="fc-face fc-face-front" id="fc-face-front">
                  <span class="fc-label">Pergunta</span>
                  <p>${activeCard.question}</p>
                </div>
                <div class="fc-face fc-face-back" id="fc-face-back">
                  <span class="fc-label">Resposta</span>
                  <p>${activeCard.answer}</p>
                </div>
              </div>
            </div>
 
            <div class="fc-review-actions">
              <button type="button" class="btn-secondary" id="fc-toggle-face-btn">
                Mostrar resposta
              </button>
              <button type="button" class="btn-primary" id="fc-next-btn">
                Próximo
              </button>
              ${isAdmin ? `
                <button type="button" class="btn-secondary btn-sm" id="fc-edit-btn">
                  Editar
                </button>
                <button type="button" class="btn-danger btn-sm" id="fc-delete-btn">
                  Remover
                </button>
              ` : ''}
            </div>
 
            <div class="fc-card-thumbs">
              ${sectionCards.map((card, index) => `
                <button type="button" class="fc-chip${index === currentCardIndex ? ' active' : ''}" data-card-index="${index}">
                  #${index + 1}
                </button>
              `).join('')}
            </div>
          ` : `
            <div class="fc-empty-cards">
              <p>Nenhum flashcard criado para <strong>${currentSection.cat}</strong> ainda.</p>
              ${isAdmin ? '<p>Use a área à esquerda para adicionar o primeiro flashcard.</p>' : '<p>Aguarde um administrador criar os primeiros flashcards.</p>'}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
 
  // ── Custom Select ──────────────────────────────────────────────────────────
  const customSelect   = document.getElementById('fc-custom-select');
  const selectTrigger  = document.getElementById('fc-select-trigger');
  const selectValue    = document.getElementById('fc-select-value');
  const selectDropdown = document.getElementById('fc-select-dropdown');
  const selectOptions  = selectDropdown ? selectDropdown.querySelectorAll('.fc-select-option') : [];
 
  function openSelect() {
    customSelect.classList.add('open');
    selectTrigger.setAttribute('aria-expanded', 'true');
  }
 
  function closeSelect() {
    customSelect.classList.remove('open');
    selectTrigger.setAttribute('aria-expanded', 'false');
  }
 
  function toggleSelect() {
    customSelect.classList.contains('open') ? closeSelect() : openSelect();
  }
 
  if (selectTrigger) {
    selectTrigger.addEventListener('click', toggleSelect);
    selectTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(); }
      if (e.key === 'Escape') closeSelect();
    });
  }
 
  selectOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      const newIndex = Number(opt.dataset.value);
 
      // atualiza visual
      selectOptions.forEach(o => {
        o.classList.remove('active');
        o.setAttribute('aria-selected', 'false');
      });
      opt.classList.add('active');
      opt.setAttribute('aria-selected', 'true');
      if (selectValue) selectValue.textContent = opt.textContent.trim();
 
      closeSelect();
 
      if (handlers.onChangeSection) {
        handlers.onChangeSection(newIndex);
      }
    });
  });
 
  // Fecha ao clicar fora
  document.addEventListener('click', function handleOutside(e) {
    if (customSelect && !customSelect.contains(e.target)) {
      closeSelect();
    }
  });
 
  // ── Demais eventos ─────────────────────────────────────────────────────────
  const saveBtn       = qs('fc-save-btn');
  const toggleFaceBtn = qs('fc-toggle-face-btn');
  const nextBtn       = qs('fc-next-btn');
  const editBtn       = qs('fc-edit-btn');
  const deleteBtn     = qs('fc-delete-btn');
  const chipButtons   = document.querySelectorAll('.fc-chip');
  const questionInput = qs('fc-question');
  const answerInput   = qs('fc-answer');
 
  let showingBack = false;
  let editingCardId = null;
 
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const q = questionInput?.value.trim();
      const a = answerInput?.value.trim();
      if (!q || !a) return;
 
      if (editingCardId && handlers.onEditCard) {
        await handlers.onEditCard(editingCardId, q, a);
        editingCardId = null;
        saveBtn.textContent = 'Salvar flashcard';
      } else if (handlers.onCreateCard) {
        await handlers.onCreateCard(currentSectionId, q, a);
      }
 
      if (questionInput) questionInput.value = '';
      if (answerInput) answerInput.value = '';
      if (toggleFaceBtn) toggleFaceBtn.textContent = 'Mostrar resposta';
    });
  }
 
  if (toggleFaceBtn && sectionCards.length) {
    toggleFaceBtn.addEventListener('click', () => {
      showingBack = !showingBack;
      qs('fc-card')?.classList.toggle('flipped', showingBack);
      toggleFaceBtn.textContent = showingBack ? 'Mostrar pergunta' : 'Mostrar resposta';
    });
  }
 
  if (editBtn && hasCards && activeCard) {
    editBtn.addEventListener('click', () => {
      if (!questionInput || !answerInput) return;
      editingCardId = activeCard.id;
      questionInput.value = activeCard.question;
      answerInput.value = activeCard.answer;
      if (saveBtn) saveBtn.textContent = 'Atualizar flashcard';
      questionInput.focus();
    });
  }
 
  if (deleteBtn && hasCards && activeCard) {
    deleteBtn.addEventListener('click', async () => {
      if (!activeCard || !handlers.onDeleteCard) return;
      if (!confirm('Deseja realmente remover este flashcard?')) return;
      await handlers.onDeleteCard(activeCard.id);
    });
  }
 
  if (nextBtn && hasCards) {
    nextBtn.addEventListener('click', () => {
      const nextIndex = hasCards ? (currentCardIndex + 1) % sectionCards.length : 0;
      if (handlers.onChangeCard) {
        handlers.onChangeCard(nextIndex);
      }
    });
  }
 
  if (chipButtons.length) {
    chipButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.cardIndex);
        if (handlers.onChangeCard) {
          handlers.onChangeCard(idx);
        }
      });
    });
  }
}