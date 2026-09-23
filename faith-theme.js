(() => {
  const setFaithMessage = () => {
    const heading = document.querySelector('.welcome h2');
    if (heading) heading.textContent = 'Psalms 91:2';
    const plant = document.querySelector('.welcome .plant');
    if (plant) {
      plant.textContent = '✝';
      plant.setAttribute('aria-label', 'cross');
      plant.title = 'Psalms 91:2';
    }
  };

  const style = document.createElement('style');
  style.textContent = `
    /* Let the selected pastel palette reach the major surfaces and controls. */
    .app { background: linear-gradient(180deg, color-mix(in srgb, var(--primary) 14%, white), color-mix(in srgb, var(--primary) 8%, var(--bg))); }
    .primary { background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 72%, white), color-mix(in srgb, var(--primary-dark) 52%, white)); }
    .round-btn { background: color-mix(in srgb, var(--primary) 55%, white); }
    .welcome { background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 22%, white), color-mix(in srgb, var(--primary) 9%, white)); }
    .welcome h2, .page-head h2, .section-title h3, .class-card h3, .note-card h3 { color: color-mix(in srgb, var(--primary-dark) 72%, var(--text)); }
    .progress-bar i { background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary-dark) 55%, white)); }
    .calendar-grid > span { background: color-mix(in srgb, var(--primary) 10%, white); }
    .calendar-day.today { background: color-mix(in srgb, var(--primary) 12%, white); }
    .btn, .calc-btn { background: color-mix(in srgb, var(--primary) 12%, white); }
    .calc-btn.operator { background: var(--primary); }
    .calc-btn.equals { background: var(--primary-dark); }
    .link-btn, .day-add { color: var(--primary-dark); }
    .plant { color: var(--primary-dark); font-size: 68px; font-family: Georgia, serif; text-shadow: 0 4px 12px color-mix(in srgb, var(--primary) 30%, transparent); }
  `;
  document.head.appendChild(style);

  const observer = new MutationObserver(setFaithMessage);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('load', setFaithMessage);
  setTimeout(setFaithMessage, 0);
})();
