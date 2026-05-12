// public/js/customSelect.js
export function initCustomSelect(rootEl, { value, onChange }) {
  if (!rootEl) return;

  const trigger = rootEl.querySelector('.fc-select-trigger');
  const valueSpan = rootEl.querySelector('.fc-select-value');
  const dropdown = rootEl.querySelector('.fc-select-dropdown');
  const options = dropdown ? dropdown.querySelectorAll('.fc-select-option') : [];

  function open() {
    rootEl.classList.add('open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  }

  function close() {
    rootEl.classList.remove('open');
    if (trigger) trigger.setAttribute('aria-expanded', 'false');
  }

  function toggle() {
    rootEl.classList.contains('open') ? close() : open();
  }

  if (trigger) {
    trigger.addEventListener('click', toggle);
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') {
        close();
      }
    });
  }

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      const newVal = opt.dataset.value;

      options.forEach(o => {
        o.classList.remove('active');
        o.setAttribute('aria-selected', 'false');
      });
      opt.classList.add('active');
      opt.setAttribute('aria-selected', 'true');

      if (valueSpan) valueSpan.textContent = opt.textContent.trim();

      close();
      if (onChange) onChange(newVal);
    });
  });

  document.addEventListener('click', (e) => {
    if (!rootEl.contains(e.target)) {
      close();
    }
  });

  if (value && valueSpan) {
    valueSpan.textContent = value;
  }
}