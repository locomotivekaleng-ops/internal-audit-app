/* ============================================================
   MAIN APPLICATION LOGIC
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {

  // Show loading
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.classList.remove('hidden');

  try {
    // Load all data from Supabase into local cache
    await DB.init();
  } catch (err) {
    console.error('[App] Failed to load data:', err);
  }

  // Seed/migration (compatibility shim)
  if (typeof window.seedDatabase === 'function') {
    window.seedDatabase();
  }

  // Initialize Router
  if (window.Router && typeof window.Router.init === 'function') {
    window.Router.init();
  }

  // Hide loading
  if (overlay) overlay.classList.add('hidden');

  // Escape key closes modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modalOverlay = document.getElementById('modal-overlay');
      if (modalOverlay && !modalOverlay.classList.contains('hidden')) {
        Modal.close();
      }
    }
  });
});
