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
