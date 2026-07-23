/* ============================================================
   ROUTER — Hash-based SPA routing
   ============================================================ */

const Router = {
  _scrollPos: { top: 0, left: 0 },
  _scrollRoute: null,
  _loaded: {},

  _loadScript(name) {
    if (Router._loaded[name]) return Router._loaded[name];
    Router._loaded[name] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `js/pages/${name}.js`;
      s.onload = () => resolve();
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return Router._loaded[name];
  },

  _pageNames: [
    'login', 'dashboard', 'dept-dashboard', 'reports', 'outlet-profile',
    'fraud-trend', 'wbs', 'fds', 'cases', 'closing-analysis', 'auditors',
    'users', 'master', 'settings'
  ],

  _lazyLoadAll() {
    Router._pageNames.forEach(name => {
      if (!Router._loaded[name]) {
        Router._loadScript(name);
      }
    });
  },

  routes: {
    'login':       () => LoginPage.render(),
    'dashboard':       () => { DashboardPage.render(); },
    'dept-dashboard':  () => { DeptDashboardPage.render(); },
    'reports':          () => { ReportsPage.render(); },
    'outlet-profile':   () => { OutletProfilePage.render(); },
    'fraud-trend': () => { FraudTrendPage.render(); },
    'wbs':         () => { WBSPage.render(); },
    'fds':         () => { FDSPage.render(); },
    'cases':            () => { CasesPage.render(); },
    'closing-analysis': () => { ClosingAnalysisPage.render(); },
    'auditors':    () => { AuditorsPage.render(); },
    'users':       () => { UsersPage.render(); },
    'master':      () => { MasterPage.render(); },
    'settings':    () => { SettingsPage.render(); },
  },

  navigate(route, replace = false) {
    if (replace) {
      history.replaceState(null, '', '#' + route);
    } else {
      location.hash = '#' + route;
    }
    Router.dispatch(route);
  },

  // Pages that require server-side permission verification
  _strictPages: ['users', 'master', 'settings'],

  async dispatch(route) {
    if (route !== 'login' && !Perms.canRead(route)) {
      Toast?.error('Anda tidak memiliki akses ke halaman ini.');
      const fallback = Perms.canRead('dept-dashboard') ? 'dept-dashboard' : 'dashboard';
      Router.navigate(fallback, true);
      return;
    }

    // Server-side verification for sensitive pages
    if (Router._strictPages.includes(route)) {
      try {
        const allowed = await Perms.checkServer(route, 'read');
        if (!allowed) {
          Toast?.error('Access denied — insufficient permissions.', 'Forbidden');
          Router.navigate('dashboard', true);
          return;
        }
      } catch (err) {
        console.warn('[Router] Server-side check unavailable for', route, err);
      }
    }

    const handler = Router.routes[route];
    if (handler) {
      await Router._loadScript(route);
      Charts.destroyAll();
      Router._saveScroll(route);
      Router._showLoading();
      setTimeout(() => {
        try {
          handler();
        } catch (e) {
          console.error('[Router] Render error:', e);
          const root = document.getElementById('app-root');
          if (root) {
            root.innerHTML = Router._fallbackUI(route, e);
            root.querySelector('[data-action="router-navigate"]')?.addEventListener('click', () => Router.navigate('dashboard', true));
            root.querySelector('[data-action="router-reload"]')?.addEventListener('click', () => location.reload());
          }
        } finally {
          Router._restoreScroll(route);
          Router._hideLoading();
        }
      });
    } else {
      Router.navigate('dashboard', true);
    }
  },

  _saveScroll(route) {
    const el = document.getElementById('page-content') || document.scrollingElement;
    if (el) {
      Router._scrollPos = { top: el.scrollTop, left: el.scrollLeft };
      Router._scrollRoute = route;
    }
  },

  _restoreScroll(route) {
    if (Router._scrollRoute !== route) return;
    const el = document.getElementById('page-content') || document.scrollingElement;
    if (el) {
      el.scrollTo(Router._scrollPos.left, Router._scrollPos.top);
    }
  },

  _showLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.classList.remove('hidden');
  },

  _hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.classList.add('hidden');
  },

  _fallbackUI(route, error) {
    return `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#080f1e;padding:40px" role="alert">
        <div style="max-width:480px;text-align:center">
          <i data-lucide="alert-triangle" style="width:48px;height:48px;color:#ef4444;margin-bottom:16px"></i>
          <h1 style="font-size:20px;font-weight:700;color:#f1f5f9;margin-bottom:8px">Something went wrong</h1>
          <p style="font-size:13px;color:#64748b;margin-bottom:24px">An error occurred while rendering this page. Please try again.</p>
          <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:12px 16px;margin-bottom:24px;text-align:left;font-size:11px;color:#f87171;font-family:monospace;word-break:break-all">${Utils.escapeHtml(error?.message || 'Unknown error')}</div>
          <button class="btn btn-primary" data-action="router-navigate" data-route="dashboard">Back to Dashboard</button>
          <button class="btn btn-secondary" style="margin-left:8px" data-action="router-reload">Reload App</button>
        </div>
      </div>`;
  },

  getCurrentRoute() {
    const hash = location.hash.replace('#', '');
    return hash || 'login';
  },

  init() {
    window.addEventListener('hashchange', () => {
      Router.dispatch(Router.getCurrentRoute());
    });

    // Global error handler
    window.onerror = function(msg, source, line, col, err) {
      console.error('[Global]', msg, source, line, col, err);
      const root = document.getElementById('app-root');
      if (root && !root.querySelector('.app-shell')) {
        root.innerHTML = Router._fallbackUI(Router.getCurrentRoute(), err || new Error(msg));
        root.querySelector('[data-action="router-navigate"]')?.addEventListener('click', () => Router.navigate('dashboard', true));
        root.querySelector('[data-action="router-reload"]')?.addEventListener('click', () => location.reload());
      }
      return true;
    };

    // Handle initial route
    const current = Router.getCurrentRoute();
    if (current === 'login' || current === '') {
      if (Auth.isLoggedIn()) {
        const target = Perms.canRead('dashboard') ? 'dashboard' : 'dept-dashboard';
        Router.navigate(target, true);
      } else {
        Router.dispatch('login');
      }
    } else {
      if (!Auth.isLoggedIn() && current !== 'login') {
        Router.navigate('login', true);
      } else if (Auth.isLoggedIn() && current !== 'login' && !Perms.canRead(current)) {
        const fallback = Perms.canRead('dept-dashboard') ? 'dept-dashboard' : 'dashboard';
        Router.navigate(fallback, true);
      } else {
        Router.dispatch(current);
      }
    }

    // Preload remaining page scripts after initial render
    setTimeout(() => Router._lazyLoadAll(), 500);
  }
};

window.Router = Router;
