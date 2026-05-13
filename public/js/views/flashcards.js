// js/views/flashcards.js
import { qs, escapeHtml } from '../core/ui.js';

/**
 * Renderiza a tela de flashcards.
 */
export function renderFlashcardsView(sections, cards, handlers) {
  const isAdmin = !!handlers.isAdmin;
  const containerId = isAdmin ? 'admin-flashcards-container' : 'flashcards-container';
  const cont = document.getElementById(containerId);
  if (!cont) return;

  if (!sections || !sections.length) {
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

  const safeSectionIndex = currentSectionId >= 0 && currentSectionId < sections.length ? currentSectionId : 0;
  const currentSection = sections[safeSectionIndex] || sections[0];

  const sectionCards = cards.filter(c => Number(c.sectionIndex) === safeSectionIndex);
  const safeCardIndex = currentCardIndex >= 0 && currentCardIndex < sectionCards.length ? currentCardIndex : 0;
  const activeCard = sectionCards[safeCardIndex] || sectionCards[0] || null;
  const hasCards = sectionCards.length > 0;

  // Build HTML with escaped values to prevent XSS
  const safeCat = escapeHtml(sections[safeSectionIndex]?.cat || sections[0].cat || '');
  const safeQuestion = activeCard ? escapeHtml(activeCard.question || '') : '';
  const safeAnswer = activeCard ? escapeHtml(activeCard.answer || '') : '';
  const safeSectionName = escapeHtml(currentSection.cat || '');

  cont.innerHTML = `
    <div class="fc-layout">
      <div class="fc-left">
        <div class="fc-header">
          <h2>Flashcards</h2>
          <p>Revise cada matéria com perguntas e respostas rápidas.</p>
        </div>

        <div class="fc-field">
          <label for="fc-select-trigger">Matéria</label>
          <div class="fc-custom-select" id="fc-custom-select">
            <div
              class="fc-select-trigger"
              id="fc-select-trigger"
              role="button"
              tabindex="0"
              aria-haspopup="listbox"
              aria-expanded="false"
              aria-label="Selecionar matéria"
            >
              <span class="fc-select-value" id="fc-select-value">${safeCat}</span>
              <svg class="fc-select-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                aria-hidden="true">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            <ul class="fc-select-dropdown" id="fc-select-dropdown" role="listbox" aria-label="Matérias">
              ${sections.map((sec, index) => `
                <li
                  class="fc-select-option${index === safeSectionIndex ? ' active' : ''}"
                  role="option"
                  aria-selected="${index === safeSectionIndex}"
                  data-value="${index}"
                  tabindex="-1"
                >
                  ${escapeHtml(sec.cat || '')}
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
        ` : ''}
      </div>

      <div class="fc-right">
        <div class="fc-review">
          <div class="fc-review-header">
            <div>
              <span class="fc-section-name">${safeSectionName}</span>
              <p class="fc-subtitle">
                ${hasCards ? `Card ${safeCardIndex + 1} de ${sectionCards.length}` : 'Nenhum flashcard disponível'}
              </p>
            </div>
            ${hasCards ? `<span class="fc-counter">${sectionCards.length} flashcards</span>` : ''}
          </div>

          ${hasCards ? `
            <div class="fc-card-wrapper">
              <div class="fc-card" id="fc-card" role="region" aria-label="Flashcard" aria-live="polite">
                <div class="fc-face fc-face-front" id="fc-face-front">
                  <p class="fc-text">${safeQuestion}</p>
                  <span class="fc-label">Pergunta</span>
                </div>

                <div class="fc-face fc-face-back" id="fc-face-back">
                  <p class="fc-text">${safeAnswer}</p>
                  <span class="fc-label">Resposta</span>
                </div>ss="fc-face fc-face-back" id="fc-face-back">
                  <span class="fc-label">Resposta</span>
                  <p>${safeAnswer}</p>
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

            <div class="fc-card-thumbs" role="tablist" aria-label="Navegação de cards">
              ${sectionCards.map((_, index) => `
                <button
                  type="button"
                  class="fc-chip${index === safeCardIndex ? ' active' : ''}"
                  data-card-index="${index}"
                  role="tab"
                  aria-selected="${index === safeCardIndex}"
                  aria-label="Card ${index + 1} de ${sectionCards.length}"
                >
                  #${index + 1}
                </button>
              `).join('')}
            </div>
          ` : `
            <div class="fc-empty-cards">
              <p>Nenhum flashcard criado para <strong>${safeSectionName}</strong> ainda.</p>
              ${isAdmin
                ? '<p>Use a área à esquerda para adicionar o primeiro flashcard.</p>'
                : '<p>Aguarde um administrador criar os primeiros flashcards.</p>'}
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  // ── Custom Select ──────────────────────────────────────────────────────────
  const customSelect   = qs('fc-custom-select');
  const selectTrigger  = qs('fc-select-trigger');
  const selectValue    = qs('fc-select-value');
  const selectDropdown = qs('fc-select-dropdown');
  const selectOptions  = selectDropdown ? [...selectDropdown.querySelectorAll('.fc-select-option')] : [];

  function openSelect() {
    if (!customSelect || !selectTrigger) return;
    customSelect.classList.add('open');
    selectTrigger.setAttribute('aria-expanded', 'true');
  }

  function closeSelect() {
    if (!customSelect || !selectTrigger) return;
    customSelect.classList.remove('open');
    selectTrigger.setAttribute('aria-expanded', 'false');
  }

  function toggleSelect() {
    if (!customSelect) return;
    customSelect.classList.contains('open') ? closeSelect() : openSelect();
  }

  if (selectTrigger) {
    selectTrigger.addEventListener('click', toggleSelect);
    selectTrigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSelect(); }
      if (e.key === 'Escape') { e.preventDefault(); closeSelect(); selectTrigger.focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); openSelect(); selectOptions[0]?.focus(); }
    });
  }

  selectOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      const newIndex = Number(opt.dataset.value);
      selectOptions.forEach(o => {
        o.classList.remove('active');
        o.setAttribute('aria-selected', 'false');
      });
      opt.classList.add('active');
      opt.setAttribute('aria-selected', 'true');
      if (selectValue) selectValue.textContent = opt.textContent.trim();
      closeSelect();
      if (handlers.onChangeSection) handlers.onChangeSection(newIndex);
    });
  });

  // Close on outside click
  const outsideClickHandler = (e) => {
    if (customSelect && !customSelect.contains(e.target)) closeSelect();
  };
  document.addEventListener('click', outsideClickHandler);

  // ── Other events ─────────────────────────────────────────────────────────
  const saveBtn       = qs('fc-save-btn');
  const toggleFaceBtn = qs('fc-toggle-face-btn');
  const nextBtn       = qs('fc-next-btn');
  const editBtn       = qs('fc-edit-btn');
  const deleteBtn     = qs('fc-delete-btn');
  const questionInput = qs('fc-question');
  const answerInput   = qs('fc-answer');

  let showingBack    = false;
  let editingCardId  = null;

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
        await handlers.onCreateCard(safeSectionIndex, q, a);
      }

      if (questionInput) questionInput.value = '';
      if (answerInput)   answerInput.value   = '';
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
      answerInput.value   = activeCard.answer;
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
      const nextIndex = hasCards ? (safeCardIndex + 1) % sectionCards.length : 0;
      if (handlers.onChangeCard) handlers.onChangeCard(nextIndex);
    });
  }

  document.querySelectorAll('.fc-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.cardIndex);
      if (handlers.onChangeCard) handlers.onChangeCard(idx);
    });
  });
}
