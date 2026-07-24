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

  // Load permissions from server if logged in
  if (Auth.isLoggedIn()) {
    try {
      await Perms._load();
    } catch (err) {
      console.warn('[App] Failed to load permissions from server:', err);
    }
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

  // Session timeout — auto-logout after 15 minutes of inactivity
  let idleTimer;
  const IDLE_TIMEOUT = 15 * 60 * 1000;
  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (Auth.isLoggedIn()) {
        Toast.show('Sesi berakhir karena tidak aktif selama 15 menit', 'warning');
        Auth.logout();
        Router.navigate('login');
      }
    }, IDLE_TIMEOUT);
  };
  ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetIdleTimer, { passive: true });
  });
  resetIdleTimer();
});
