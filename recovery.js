/* Recovery layer for older browser data and direct dashboard mode. */
(function () {
  function normalize() {
    if (typeof state === 'undefined') return;
    state.classes = Array.isArray(state.classes) ? state.classes : [];
    state.classes.forEach((item) => {
      item.assignments = Array.isArray(item.assignments) ? item.assignments : [];
    });
    state.tasks = Array.isArray(state.tasks) ? state.tasks : [];
    state.notes = Array.isArray(state.notes) ? state.notes : [];
    state.flashcardSets = Array.isArray(state.flashcardSets) ? state.flashcardSets : [];
    state.messages = Array.isArray(state.messages) ? state.messages : [];
    if (!state.user) state.user = { name: 'Hailey', email: '' };
    if (typeof saveState === 'function') saveState();
  }

  function bindNavigation() {
    document.querySelectorAll('.nav-item').forEach((button) => {
      button.onclick = function () {
        window.currentPage = button.dataset.page;
        if (typeof renderPage === 'function') renderPage();
        document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item === button));
      };
    });
  }

  function start() {
    normalize();
    bindNavigation();
    if (typeof renderPage === 'function') {
      try { renderPage(); } catch (error) { console.error('Study Bloom recovered from saved data:', error); }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
