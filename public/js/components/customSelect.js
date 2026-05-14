// public/js/customSelect.js
export function initCustomSelect(rootEl, { value, onChange }) {
  if (!rootEl) return;

  const trigger = rootEl.querySelector('.fc-select-trigger');
  const valueSpan = rootEl.querySelector('.fc-select-value');
  const dropdown = rootEl.querySelector('.fc-select-dropdown');
  const options = dropdown ? [...dropdown.querySelectorAll('.fc-select-option')] : [];

  if (!trigger || !dropdown) return;

  let activeIndex = -1;

  function open() {
    rootEl.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
    // Focus the active option or first
    const focusIdx = options.findIndex(o => o.classList.contains('active'));
    activeIndex = focusIdx >= 0 ? focusIdx : 0;
    if (options[activeIndex]) options[activeIndex].focus();
  }

  function close() {
    rootEl.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
  }

  function toggle() {
    rootEl.classList.contains('open') ? close() : open();
  }

  function selectOption(opt) {
    const newVal = opt.dataset.value;

    options.forEach(o => {
      o.classList.remove('active');
      o.setAttribute('aria-selected', 'false');
    });
    opt.classList.add('active');
    opt.setAttribute('aria-selected', 'true');

    if (valueSpan) valueSpan.textContent = opt.textContent.trim();

    close();
    trigger.focus();
    if (onChange) onChange(newVal);
  }

  // Trigger events
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  trigger.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        toggle();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!rootEl.classList.contains('open')) open();
        else if (activeIndex < options.length - 1) {
          activeIndex++;
          options[activeIndex].focus();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (activeIndex > 0) {
          activeIndex--;
          options[activeIndex].focus();
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        trigger.focus();
        break;
      case 'Tab':
        close();
        break;
    }
  });

  // Option events
  options.forEach((opt, idx) => {
    opt.setAttribute('role', 'option');
    opt.setAttribute('tabindex', '-1');

    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      selectOption(opt);
    });

    opt.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          selectOption(opt);
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (idx < options.length - 1) {
            activeIndex = idx + 1;
            options[activeIndex].focus();
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (idx > 0) {
            activeIndex = idx - 1;
            options[activeIndex].focus();
          }
          break;
        case 'Escape':
          e.preventDefault();
          close();
          trigger.focus();
          break;
      }
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!rootEl.contains(e.target)) {
      close();
    }
  });

  // Set initial value
  if (value && valueSpan) {
    valueSpan.textContent = value;
    const match = options.find(o => o.dataset.value === value);
    if (match) {
      options.forEach(o => {
        o.classList.remove('active');
        o.setAttribute('aria-selected', 'false');
      });
      match.classList.add('active');
      match.setAttribute('aria-selected', 'true');
    }
  }
}

/**
 * Converte um <select> nativo em um Custom Select dinamicamente.
 */
export function enhanceNativeSelect(selectEl, onChange) {
  if (!selectEl || selectEl.getAttribute('data-enhanced') === 'true') return;

  const options = [...selectEl.options];
  const currentValue = selectEl.value;
  const currentText = selectEl.options[selectEl.selectedIndex]?.text || '';

  const wrapper = document.createElement('div');
  wrapper.className = 'fc-custom-select';
  if (selectEl.className.includes('sm')) wrapper.classList.add('sm');
  if (selectEl.className.includes('lg')) wrapper.classList.add('lg');

  wrapper.innerHTML = `
    <div class="select-trigger" role="button" tabindex="0" aria-haspopup="listbox" aria-expanded="false">
      <span class="selected-text">${currentText}</span>
      <svg class="chevron" width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
    <ul class="select-dropdown" role="listbox">
      ${options.map(opt => `
        <li class="select-option${opt.value === currentValue ? ' selected' : ''}" 
            role="option" 
            data-value="${opt.value}" 
            tabindex="-1">
          ${opt.text}
        </li>
      `).join('')}
    </ul>
  `;

  // Esconder o select original mas manter no DOM para submissão de forms se necessário
  selectEl.style.display = 'none';
  selectEl.setAttribute('data-enhanced', 'true');
  selectEl.parentNode.insertBefore(wrapper, selectEl.nextSibling);

  const trigger = wrapper.querySelector('.select-trigger');
  const selectedText = wrapper.querySelector('.selected-text');
  const dropdown = wrapper.querySelector('.select-dropdown');
  const customOptions = [...wrapper.querySelectorAll('.select-option')];

  function open() {
    wrapper.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  function close() {
    wrapper.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.classList.contains('open') ? close() : open();
  });

  // Prevenir que mousedown propague para o cabeçalho (evita expand/collapse indesejado)
  trigger.addEventListener('mousedown', (e) => e.stopPropagation());

  customOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      const val = opt.dataset.value;
      selectEl.value = val;
      selectedText.textContent = opt.textContent.trim();
      
      customOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      
      close();
      
      // Disparar evento de mudança no select original
      selectEl.dispatchEvent(new Event('change'));
      if (onChange) onChange(val);
    });
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) close();
  });
}
