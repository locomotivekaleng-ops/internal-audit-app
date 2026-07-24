/* ============================================================
   PERMISSIONS — Role-based access control
   Server-side enforced via permissions table + RPCs
   ============================================================ */

const Perms = {
  _defaults: {
    superadmin: {
      'master': 'full', 'users': 'full', 'auditors': 'full', 'dashboard': 'full',
      'wbs': 'full', 'fds': 'full', 'cases': 'full', 'reports': 'full',
      'outlet-profile': 'full', 'fraud-trend': 'full', 'closing-analysis': 'full',
      'dept-dashboard': 'full', 'settings': 'full',
    },
    head: {
      'master': 'full', 'users': 'full', 'auditors': 'full', 'dashboard': 'full',
      'wbs': 'full', 'fds': 'full', 'cases': 'full', 'reports': 'full',
      'outlet-profile': 'full', 'fraud-trend': 'full', 'closing-analysis': 'full',
      'dept-dashboard': 'full', 'settings': 'full',
    },
    auditor: {
      'master': 'none', 'users': 'none', 'auditors': 'read', 'dashboard': 'full',
      'wbs': 'read', 'fds': 'read', 'cases': 'full', 'reports': 'full',
      'outlet-profile': 'read', 'fraud-trend': 'read', 'closing-analysis': 'none',
      'dept-dashboard': 'none', 'settings': 'none',
    },
    division: {
      'master': 'none', 'users': 'none', 'auditors': 'none', 'dashboard': 'none',
      'wbs': 'none', 'fds': 'none', 'cases': 'none', 'reports': 'none',
      'outlet-profile': 'none', 'fraud-trend': 'none', 'closing-analysis': 'none',
      'dept-dashboard': 'full', 'settings': 'none',
    },
  },

  _cache: null,
  _loaded: false,

  _overrides: null,

  _getOverrides() {
    if (Perms._overrides) return Perms._overrides;
    const raw = localStorage.getItem('ia_audit_permissions_overrides');
    const defaults = {
      'superadmin': { 'cases:planning:write': true },
      'head': { 'cases:planning:write': true },
    };
    if (raw) {
      try {
        Perms._overrides = { ...defaults, ...JSON.parse(raw) };
        Object.keys(defaults).forEach(role => {
          if (!Perms._overrides[role]) Perms._overrides[role] = {};
          Object.keys(defaults[role]).forEach(perm => {
            if (Perms._overrides[role][perm] === undefined) {
              Perms._overrides[role][perm] = defaults[role][perm];
            }
          });
        });
      } catch (err) {
        console.warn('[Perms] Failed to parse overrides:', err);
        Perms._overrides = defaults;
      }
    } else {
      Perms._overrides = defaults;
    }
    return Perms._overrides;
  },

  /**
   * Load permission matrix from server.
   * Falls back to defaults if server unavailable.
   */
  async _load() {
    if (Perms._loaded && Perms._cache) return;
    try {
      const matrix = await Supabase._fetch('POST', 'rpc/get_permissions_matrix');
      if (matrix && typeof matrix === 'object' && Object.keys(matrix).length > 0) {
        Perms._cache = matrix;
        Perms._loaded = true;
        return;
      }
    } catch (err) {
      console.warn('[Perms] Server load failed, using defaults:', err);
    }
    Perms._cache = JSON.parse(JSON.stringify(Perms._defaults));
    Perms._loaded = true;
  },

  /**
   * Synchronous access — uses cached matrix.
   * Call _load() first during init.
   */
  getMatrix() {
    return Perms._cache || Perms._defaults;
  },

  getEffectiveAccess(pageId) {
    const matrix = Perms.getMatrix();
    const session = Auth.getSession();
    if (!session) return 'none';
    return matrix[session.role]?.[pageId] || 'none';
  },

  canRead(pageId) {
    return Perms.getEffectiveAccess(pageId) !== 'none';
  },

  canWrite(pageId) {
    return Perms.getEffectiveAccess(pageId) === 'full';
  },

  can(permissionKey) {
    const session = Auth.getSession();
    if (!session) return false;
    return !!Perms._getOverrides()[session.role]?.[permissionKey];
  },

  /**
   * Save permission matrix to server.
   */
  async save(matrix) {
    const permissions = [];
    for (const [role, pages] of Object.entries(matrix)) {
      for (const [pageId, perm] of Object.entries(pages)) {
        permissions.push({ role, page_id: pageId, permission: perm });
      }
    }
    await Supabase._fetch('POST', 'rpc/upsert_permissions_bulk', {
      body: permissions,
    });
    Perms._cache = matrix;
  },

  /**
   * Reset permissions to defaults on server.
   */
  async reset() {
    await Perms.save(JSON.parse(JSON.stringify(Perms._defaults)));
  },

  /**
   * Server-side permission check via RPC.
   */
  async checkServer(pageId, action = 'read') {
    try {
      const result = await Supabase._fetch('POST', 'rpc/has_permission', {
        body: { p_page_id: pageId, p_action: action },
      });
      return result === true;
    } catch (err) {
      console.warn('[Perms] Server check failed, using client-side:', err);
      return action === 'read' ? Perms.canRead(pageId) : Perms.canWrite(pageId);
    }
  },

  /**
   * Verify session and sync matrix from server.
   */
  async verify() {
    const session = Auth.getSession();
    if (!session) return false;

    // Sync full matrix from server
    await Perms._load();

    // For superadmin/head, server always returns true
    if (session.role === 'superadmin' || session.role === 'head') return true;

    // For auditor/division, verify a known page
    const testPage = session.role === 'division' ? 'dept-dashboard' : 'cases';
    const allowed = await Perms.checkServer(testPage, 'read');
    if (!allowed) {
      console.error('[Perms] Server denied access — role may have changed.');
      return false;
    }
    return true;
  },
};

window.Perms = Perms;
