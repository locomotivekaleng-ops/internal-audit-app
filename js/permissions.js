/* ============================================================
   PERMISSIONS — Role-based access control
   Server-side enforced via has_permission() RPC
   ============================================================ */

const Perms = {
  STORAGE_KEY: 'ia_audit_permissions',

  _defaults: {
    superadmin: {
      'master': 'full',
      'users': 'full',
      'auditors': 'full',
      'dashboard': 'full',
      'wbs': 'full',
      'fds': 'full',
      'cases': 'full',
      'reports': 'full',
      'outlet-profile': 'full',
      'fraud-trend': 'full',
      'closing-analysis': 'full',
      'dept-dashboard': 'full',
      'settings': 'full',
    },
    head: {
      'master': 'full',
      'users': 'full',
      'auditors': 'full',
      'dashboard': 'full',
      'wbs': 'full',
      'fds': 'full',
      'cases': 'full',
      'reports': 'full',
      'outlet-profile': 'full',
      'fraud-trend': 'full',
      'closing-analysis': 'full',
      'dept-dashboard': 'full',
      'settings': 'full',
    },
    auditor: {
      'master': 'none',
      'users': 'none',
      'auditors': 'read',
      'dashboard': 'full',
      'wbs': 'read',
      'fds': 'read',
      'cases': 'full',
      'reports': 'full',
      'outlet-profile': 'read',
      'fraud-trend': 'read',
      'closing-analysis': 'none',
      'dept-dashboard': 'none',
      'settings': 'none',
    },
    division: {
      'master': 'none',
      'users': 'none',
      'auditors': 'none',
      'dashboard': 'none',
      'wbs': 'none',
      'fds': 'none',
      'cases': 'none',
      'reports': 'none',
      'outlet-profile': 'none',
      'fraud-trend': 'none',
      'closing-analysis': 'none',
      'dept-dashboard': 'full',
      'settings': 'none',
    },
  },

  _overrides: null,

  _getOverrides() {
    if (Perms._overrides) return Perms._overrides;
    const raw = localStorage.getItem('ia_audit_permissions_overrides');
    const defaults = {
      'superadmin': { 'cases:planning:write': true },
      'head':      { 'cases:planning:write': true },
    };
    if (raw) {
      try {
        Perms._overrides = { ...defaults, ...JSON.parse(raw) };
        // merge missing roles
        Object.keys(defaults).forEach(role => {
          if (!Perms._overrides[role]) Perms._overrides[role] = {};
          Object.keys(defaults[role]).forEach(perm => {
            if (Perms._overrides[role][perm] === undefined) {
              Perms._overrides[role][perm] = defaults[role][perm];
            }
          });
        });
      } catch (err) { console.warn('[Perms] Failed to parse overrides, resetting to defaults:', err); Perms._overrides = defaults; }
    } else {
      Perms._overrides = defaults;
    }
    return Perms._overrides;
  },

  _cache: null,

  _load() {
    if (Perms._cache) return;
    const raw = localStorage.getItem(Perms.STORAGE_KEY);
    if (raw) {
      try { Perms._cache = JSON.parse(raw); } catch (err) { console.warn('[Perms] Failed to parse permissions cache:', err); Perms._cache = null; }
    }
    if (!Perms._cache) {
      Perms._cache = JSON.parse(JSON.stringify(Perms._defaults));
      Perms.save();
    }
  },

  save() {
    localStorage.setItem(Perms.STORAGE_KEY, JSON.stringify(Perms._cache));
  },

  reset() {
    Perms._cache = JSON.parse(JSON.stringify(Perms._defaults));
    Perms.save();
  },

  getMatrix() {
    Perms._load();
    return Perms._cache;
  },

  getEffectiveAccess(pageId) {
    Perms._load();
    const session = Auth.getSession();
    if (!session) return 'none';
    const role = session.role;
    return Perms._cache[role]?.[pageId] || 'none';
  },

  canRead(pageId) {
    return Perms.getEffectiveAccess(pageId) !== 'none';
  },

  canWrite(pageId) {
    return Perms.getEffectiveAccess(pageId) === 'full';
  },

  can(permissionKey) {
    Perms._load();
    const session = Auth.getSession();
    if (!session) return false;
    const role = session.role;
    return !!Perms._getOverrides()[role]?.[permissionKey];
  },

  /**
   * Server-side permission check via RPC.
   * Returns true/false from the database.
   * Falls back to client-side check if RPC fails.
   */
  async checkServer(pageId, action = 'read') {
    try {
      const result = await Supabase._fetch('POST', 'rpc/has_permission', {
        body: { p_page_id: pageId, p_action: action },
      });
      return result === true;
    } catch (err) {
      console.warn('[Perms] Server-side check failed, falling back to client-side:', err);
      return action === 'read' ? Perms.canRead(pageId) : Perms.canWrite(pageId);
    }
  },

  /**
   * Verify current session permissions against server.
   * Called after login to ensure client-side cache matches server truth.
   */
  async verify() {
    const session = Auth.getSession();
    if (!session) return false;

    // For superadmin/head, server always returns true — no need to check each page
    if (session.role === 'superadmin' || session.role === 'head') return true;

    // For auditor/division, verify a known page to confirm role is legitimate
    const testPage = session.role === 'division' ? 'dept-dashboard' : 'cases';
    const allowed = await Perms.checkServer(testPage, 'read');
    if (!allowed) {
      console.error('[Perms] Server denied access — role may have been changed. Logging out.');
      return false;
    }
    return true;
  },
};

window.Perms = Perms;
