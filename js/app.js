/* ============================================================
   MAIN APPLICATION LOGIC
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  console.log('[App] Initializing Internal Audit Monitoring System...');

  // Initialize data seed if not already present
  if (typeof window.seedDatabase === 'function') {
    window.seedDatabase();
  } else {
    console.error('[App] seedDatabase is not defined or loaded.');
  }

  // Initialize Router
  if (window.Router && typeof window.Router.init === 'function') {
    window.Router.init();
    console.log('[App] Router initialized.');
  } else {
    console.error('[App] Router is not defined or loaded.');
  }

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('modal-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        Modal.close();
      }
    }
  });
});
