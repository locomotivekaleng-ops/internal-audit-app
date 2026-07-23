/* ============================================================
   COMPONENTS — Sidebar, Header, and reusable UI components
   ============================================================ */

const Components = {

  _sectionState: JSON.parse(localStorage.getItem('sidebar_sections') || '{}'),

  _allNavItems: [
    { route: 'dashboard',        icon: 'layout-dashboard', label: 'Executive Dashboard',   section: 'ANALYTICS' },
    { route: 'dept-dashboard',   icon: 'building',          label: 'Dashboard Divisi',      section: null },
    { route: 'outlet-profile',   icon: 'store',             label: 'Outlet Profile',        section: null },
    { route: 'fraud-trend',      icon: 'trending-up',       label: 'Fraud Trendline',       section: null },
    { route: 'closing-analysis', icon: 'clock',             label: 'AAP Closing Analysis',  section: null },
    { route: 'wbs',              icon: 'megaphone',         label: 'WBS Overview',          section: 'CASE MANAGEMENT' },
    { route: 'fds',              icon: 'scan-search',       label: 'FDS Overview',          section: null },
    { route: 'cases',            icon: 'folder-open',       label: 'Audit Assignments',     section: null },
    { route: 'reports',          icon: 'file-text',         label: 'Laporan',               section: 'LAPORAN' },
    { route: 'auditors',         icon: 'users',             label: 'Auditors',              section: 'SETTINGS' },
    { route: 'users',            icon: 'shield-check',      label: 'User Management',       section: null },
    { route: 'master',           icon: 'database',          label: 'Master Data',           section: null },
    { route: 'settings',         icon: 'shield',            label: 'Role Settings',         section: null },
  ],

  // ---- App Shell ----
  renderAppShell(pageTitle, pageSubtitle, content, activeRoute) {
    const session = Auth.getSession();
    const initials = Utils.getInitials(session?.name || 'User');

    const navItems = Components._allNavItems.filter(item => item.route === activeRoute || Perms.canRead(item.route));

    const navHtml = Components._buildNavHtml(navItems, activeRoute);

    document.getElementById('app-root').innerHTML = `
      <div class="app-shell">
        <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
        <aside class="sidebar" id="main-sidebar">
          <div class="sidebar-logo">
            <div class="logo-icon"><i data-lucide="shield-alert"></i></div>
            <div class="logo-text">
              <h1>Internal Audit</h1>
              <p>Monitoring System</p>
            </div>
          </div>
          <nav class="sidebar-nav">${navHtml}</nav>
          <div class="sidebar-footer">
            <div class="user-profile">
              <div class="user-avatar">${initials}</div>
              <div class="user-info">
                <div class="user-name">${Utils.escapeHtml(session?.name || 'User')}</div>
                <div class="user-role">${Utils.escapeHtml(Components.roleLabel(session?.role))} ${session?.department ? '· ' + Utils.escapeHtml(Utils.getDeptName(session.department)) : ''}</div>
              </div>
            </div>
            <button class="btn btn-secondary w-full mt-2" style="font-size:11px;justify-content:center" data-action="logout">
              <i data-lucide="log-out"></i> Sign Out
            </button>
          </div>
        </aside>

        <div class="main-content" id="main-content">
          <div style="background:rgba(245,158,11,0.12);border-bottom:1px solid rgba(245,158,11,0.25);padding:4px 16px;text-align:center;font-size:10px;font-weight:600;color:var(--amber-light);letter-spacing:0.5px;text-transform:uppercase">
            ⚠ TESTING — Seluruh data dalam aplikasi ini adalah data fiktif, bukan data real perusahaan
          </div>
          <header class="top-header">
            <button class="header-toggle-btn" id="sidebar-toggle" data-action="toggle-sidebar" aria-label="Toggle sidebar">
              <i data-lucide="panel-left-close" id="toggle-icon-open"></i>
              <i data-lucide="panel-left-open" id="toggle-icon-closed" class="hidden"></i>
            </button>
            <div class="header-page-title">
              <h2>${pageTitle}</h2>
              <p>${pageSubtitle || ''}</p>
            </div>
            <div class="header-actions">
              <button class="btn btn-sm btn-secondary" id="sync-btn" data-action="sync-now" title="Sync data to server" style="font-size:11px;gap:4px">
                <i data-lucide="refresh-cw" style="width:14px;height:14px"></i>
                <span id="sync-label">Sync</span>
                <span id="sync-badge" class="sync-badge hidden" style="background:var(--accent);color:#fff;border-radius:50%;min-width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;padding:0 4px"></span>
              </button>
              <div style="font-size:11px;color:var(--text-muted);" id="current-datetime"></div>
            </div>
          </header>

          <main class="page-content fade-in" id="page-content">
            ${content}
          </main>
        </div>
      </div>`;

    // Init lucide icons
    if (window.lucide) lucide.createIcons();

    // Clock
    Components.startClock();

    // Data-action listeners
    document.querySelector('[data-action="logout"]')?.addEventListener('click', () => Components.logout());
    document.querySelector('[data-action="toggle-sidebar"]')?.addEventListener('click', () => Components.toggleSidebar());
    document.getElementById('sidebar-backdrop')?.addEventListener('click', () => Components.closeMobileSidebar());
    document.querySelector('[data-action="sync-now"]')?.addEventListener('click', () => Components.manualSync());
    if (typeof Components.updateSyncBadge === 'function') Components.updateSyncBadge();

    // Sidebar delegation for nav items (rebuilt dynamically)
    document.querySelector('.sidebar-nav')?.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('[data-action="toggle-section"]');
      if (toggleBtn) { Components.toggleSection(toggleBtn.dataset.section); return; }
      const navItem = e.target.closest('[data-action="router-navigate"]');
      if (navItem) { Router.navigate(navItem.dataset.route); return; }
    });
  },

  _buildNavHtml(navItems, activeRoute) {
    const sections = [];
    let current = null;
    navItems.forEach(item => {
      if (item.section) {
        current = { section: item.section, items: [] };
        sections.push(current);
      }
      if (current) current.items.push(item);
    });

    let html = '';
    sections.forEach(s => {
      const collapsed = Components._sectionState[s.section] === false;
      html += `<div class="nav-section ${collapsed ? 'collapsed' : ''}">
        <div class="nav-section-label" data-action="toggle-section" data-section="${s.section}">
          <span>${s.section}</span>
          <i data-lucide="chevron-down" class="nav-section-chevron"></i>
        </div>`;
      s.items.forEach(item => {
        html += `
          <div class="nav-item ${item.route === activeRoute ? 'active' : ''}" data-action="router-navigate" data-route="${item.route}">
            <div class="nav-icon"><i data-lucide="${item.icon}"></i></div>
            <span class="nav-label">${item.label}</span>
          </div>`;
      });
      html += `</div>`;
    });
    return html;
  },

  toggleSection(section) {
    Components._sectionState[section] = Components._sectionState[section] === false ? true : false;
    localStorage.setItem('sidebar_sections', JSON.stringify(Components._sectionState));
    const nav = document.querySelector('.sidebar-nav');
    if (nav) {
      const activeRoute = Router.getCurrentRoute();
      const navItems = Components._allNavItems.filter(item => Perms.canRead(item.route));
      nav.innerHTML = Components._buildNavHtml(navItems, activeRoute);
      if (window.lucide) lucide.createIcons();
    }
  },

  roleLabel(role) {
    const map = { superadmin: 'Superadmin', head: 'Manager Audit', auditor: 'Auditor', division: 'Auditee / Other Dept' };
    return map[role] || role;
  },

  toggleSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (window.innerWidth < 768) {
      sidebar.classList.toggle('mobile-open');
      backdrop.classList.toggle('visible');
      return;
    }
    const content = document.getElementById('main-content');
    const open = document.getElementById('toggle-icon-open');
    const closed = document.getElementById('toggle-icon-closed');
    sidebar.classList.toggle('collapsed');
    content.classList.toggle('sidebar-collapsed');
    open.classList.toggle('hidden');
    closed.classList.toggle('hidden');
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById('main-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('visible');
  },

  async logout() {
    await Auth.logout();
    Router.navigate('login');
    Toast.info('You have been signed out.', 'Goodbye!');
  },

  startClock() {
    const el = document.getElementById('current-datetime');
    if (!el) return;
    const update = () => {
      const now = new Date();
      el.textContent = now.toLocaleString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    };
    update();
    setInterval(update, 30000);
  },

  // ---- Filter Bar Builder ----
  buildFilterBar(filters) {
    return filters.map(f => {
      if (f.type === 'select') {
        const opts = f.options.map(o =>
          `<option value="${Utils.escapeHtml(o.value)}" ${o.selected ? 'selected' : ''}>${Utils.escapeHtml(o.label)}</option>`
        ).join('');
        return `<select class="form-control" id="${f.id}" onchange="${f.onChange || ''}" title="${f.label}">
          <option value="">${f.label}</option>${opts}</select>`;
      }
      if (f.type === 'date') {
        return `<input type="date" class="form-control" id="${f.id}" value="${f.value || ''}" 
          onchange="${f.onChange || ''}" title="${f.label}" />`;
      }
      if (f.type === 'search') {
        return `<div class="search-input-wrapper">
          <i data-lucide="search"></i>
          <input type="text" class="form-control search-input" id="${f.id}" placeholder="${f.label}" 
            oninput="${f.onChange || ''}" value="${f.value || ''}" />
        </div>`;
      }
      return '';
    }).join('');
  },

  // ---- Pagination ----
  renderPagination(containerId, currentPage, totalPages, totalItems, onPageChange) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const start = (currentPage - 1) * 10 + 1;
    const end = Math.min(currentPage * 10, totalItems);
    let pages = '';
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages += `<span style="color:var(--text-muted);padding:0 4px">…</span>`;
      }
    }
    el.innerHTML = `
      <span>${start}–${end} of ${totalItems} records</span>
      <div class="pagination-controls">
        <button class="page-btn" data-page="${Math.max(1, currentPage-1)}" ${currentPage<=1?'disabled':''} aria-label="Previous page">
          <i data-lucide="chevron-left" style="width:12px;height:12px"></i>
        </button>
        ${pages}
        <button class="page-btn" data-page="${Math.min(totalPages, currentPage+1)}" ${currentPage>=totalPages?'disabled':''} aria-label="Next page">
          <i data-lucide="chevron-right" style="width:12px;height:12px"></i>
        </button>
      </div>`;
    if (!el._pagWired) {
      el._pagWired = true;
      el.addEventListener('click', function(e) {
        const btn = e.target.closest('[data-page]');
        if (btn && !btn.disabled) {
          const page = parseInt(btn.dataset.page);
          if (!isNaN(page) && this._onPageChange) {
            this._onPageChange(page);
          }
        }
      });
    }
    el._onPageChange = onPageChange;
    if (window.lucide) lucide.createIcons();
  },

  // ---- Kpi Card HTML ----
  kpiCard(label, value, sub, icon, colorClass, extra = '') {
    return `
      <div class="kpi-card ${colorClass}">
        <div class="kpi-icon"><i data-lucide="${icon}"></i></div>
        <div class="kpi-label">${label}</div>
        <div class="kpi-value ${String(value).length > 8 ? 'large' : ''}">${value}</div>
        ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
        ${extra}
      </div>`;
  },
};

// ============================================================
//   DATATABLE — Shared table renderer with sort headers
// ============================================================
const DataTable = {
  /**
   * Renders a <table class="data-table"> with sortable column headers,
   * a row builder callback, and integrated empty state.
   *
   * @param {Object} cfg
   * @param {Array}  cfg.columns     - Array of { key, label, sortable, class, width }
   * @param {Array}  cfg.data        - Row data (already sliced for pagination)
   * @param {Function} cfg.buildRow  - (item, index) => '<tr>...</tr>' string
   * @param {string} [cfg.emptyMessage='No data'] - Empty state message
   * @param {string} [cfg.id]        - <table> id attribute
   * @param {string} [cfg.className] - Extra CSS classes on <table>
   * @param {Object} [cfg.sort]      - { key, dir, onChange }
   *   sort.key — currently sorted column key
   *   sort.dir — 'asc' or 'desc'
   *   sort.onChange — string expression, e.g. "CasesPage.setSort"
   *   Column gets sortable: true by default if cfg.sort is provided.
   *   Set sortable: false on a column to exclude it from sort.
   * @returns {string} HTML
   */
  render(cfg) {
    const { columns, data, buildRow, emptyMessage, id, className, sort } = cfg;
    const colspan = columns.length;

    const thead = columns.map(col => {
      let attrs = '';
      let label = col.label;
      if (col.class) attrs += ` class="${col.class}"`;
      if (col.sortable !== false && sort) {
        const isSorted = sort.key === col.key;
        const dir = isSorted ? sort.dir : null;
        const indicator = dir === 'asc' ? '\u25B2' : dir === 'desc' ? '\u25BC' : '\u21C5';
        attrs += ` class="sortable${isSorted ? ' sorted' : ''}${col.class ? ' ' + col.class : ''}"`;
        attrs += ` data-action="dt-sort" data-key="${col.key}"`;
        attrs += ` scope="col" aria-sort="${dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}"`;
        label += ` <span class="sort-indicator">${indicator}</span>`;
      } else {
        attrs += ` scope="col"`;
      }
      return `<th${attrs}>${label}</th>`;
    }).join('');

    const body = !data || data.length === 0
      ? `<tr><td colspan="${colspan}" class="text-center text-muted" style="padding:32px">${emptyMessage || 'No data'}</td></tr>`
      : data.map((item, i) => buildRow(item, i)).join('');

    return `<table class="data-table${className ? ' ' + className : ''}"${id ? ' id="' + id + '"' : ''}>
      <thead><tr>${thead}</tr></thead>
      <tbody>${body}</tbody>
    </table>`;
  },

  /**
   * Renders and wires pagination into a container element.
   * Thin wrapper around Components.renderPagination.
   */
  renderPagination(containerId, page, perPage, total, onChange) {
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    Components.renderPagination(containerId, page, totalPages, total, onChange);
  },

  /**
   * Slices an array for the current page.
   */
  pageItems(data, page, perPage) {
    return data.slice((page - 1) * perPage, page * perPage);
  },

  async manualSync() {
    const btn = document.getElementById('sync-btn');
    const label = document.getElementById('sync-label');
    if (btn) btn.disabled = true;
    if (label) label.textContent = 'Syncing…';
    try {
      const result = await DB.syncNow();
      Components.updateSyncBadge();
      const msg = result.failed > 0
        ? `Sync selesai: ${result.synced} berhasil, ${result.failed} gagal`
        : `Semua data tersync (${result.synced} records)`;
      Toast.success(msg, 'Sync Complete');
    } catch (e) {
      Toast.error('Sync gagal: ' + e.message);
    } finally {
      if (btn) btn.disabled = false;
      if (label) label.textContent = 'Sync';
    }
  },

  updateSyncBadge() {
    const count = DB.getUnsyncedCount();
    const badge = document.getElementById('sync-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },
};

window.Components = Components;

// ============================================================
//   PAGE LIFECYCLE — Event delegation after render
// ============================================================
const PageLifecycle = {
  /**
   * Delegates events on a container element.
   * @param {string|Element} container - Element ID or element
   * @param {Object} eventMap - { click: { '.selector': handler }, change: { ... } }
   */
  delegate(container, eventMap) {
    const el = typeof container === 'string' ? document.getElementById(container) : container;
    if (!el) return;
    for (const [eventType, handlers] of Object.entries(eventMap)) {
      el.addEventListener(eventType, (e) => {
        for (const [selector, handler] of Object.entries(handlers)) {
          const target = e.target.closest(selector);
          if (target && el.contains(target)) {
            handler(e, target);
          }
        }
      });
    }
  },

  /**
   * Wires a single element by id.
   */
  on(id, eventType, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(eventType, handler);
  },

  /**
   * Standard render + afterRender flow for page objects.
   * Page must have: render(), buildHtml(), afterRender() (optional)
   */
  render(page) {
    if (!Auth.requireAuth()) return;
    Components.renderAppShell(
      page.title,
      page.subtitle,
      page.buildHtml(),
      page.route
    );
    page.afterRender?.();
  },
};

window.Components = Components;
window.DataTable = DataTable;
window.PageLifecycle = PageLifecycle;
