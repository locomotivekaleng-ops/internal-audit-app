/* ============================================================
   AUTH — Supabase Auth session management
   ============================================================ */

const Auth = {
  SESSION_KEY: 'ia_session',
  TOKEN_KEY: 'supabase_token',
  REFRESH_TOKEN_KEY: 'supabase_refresh_token',

  async login(username, password) {
    const email = username + '@internal-audit.app';
    const data = await Supabase.authLogin(email, password);
    const authUser = data.user;
    const token = data.access_token;

    localStorage.setItem(Auth.TOKEN_KEY, token);
    if (data.refresh_token) localStorage.setItem(Auth.REFRESH_TOKEN_KEY, data.refresh_token);

    // Fetch profile from REST
    let profile = null;
    try {
      const baseUrl = globalThis.SUPABASE_URL;
      const anonKey = globalThis.SUPABASE_ANON_KEY;
      const res = await fetch(
        baseUrl + '/rest/v1/profiles?id=eq.' + encodeURIComponent(authUser.id) + '&select=*',
        {
          headers: {
            'apikey': anonKey,
            'Authorization': 'Bearer ' + token,
          },
        }
      );
      if (res.ok) {
        const profiles = await res.json();
        if (profiles && profiles.length > 0) {
          const raw = profiles[0];
          profile = {
            id: raw.id,
            username: raw.username,
            name: raw.name,
            role: raw.role,
            department: raw.department,
            status: raw.status,
          };
        }
      }
    } catch (err) { console.error('[Auth] Failed to fetch profile:', err); }

    const session = {
      userId: authUser.id,
      username: profile?.username || username,
      name: profile?.name || username,
      role: profile?.role || 'auditor',
      department: profile?.department || null,
      loginAt: new Date().toISOString(),
    };
    sessionStorage.setItem(Auth.SESSION_KEY, JSON.stringify(session));
    try { await DB.init(); } catch (err) { console.error('[Auth] DB.init() failed after login:', err); }

    // Server-side permission verification
    try {
      const valid = await Perms.verify();
      if (!valid) {
        console.error('[Auth] Permission verification failed — session invalid');
        await Auth.logout();
        throw new Error('Session verification failed. Your role may have been changed.');
      }
    } catch (err) {
      if (err.message?.includes('Session verification failed')) throw err;
      console.warn('[Auth] Permission verify RPC unavailable, proceeding with client-side only:', err);
    }

    return session;
  },

  async logout() {
    await Supabase.authLogout();
    localStorage.removeItem(Auth.TOKEN_KEY);
    localStorage.removeItem(Auth.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(Auth.SESSION_KEY);
    localStorage.removeItem(Perms.STORAGE_KEY);
    DB.clearCache();
  },

  getSession() {
    try {
      const raw = sessionStorage.getItem(Auth.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) { console.error('[Auth] Failed to parse session:', err); return null; }
  },

  isLoggedIn() {
    return Auth.getSession() !== null;
  },

  hasRole(...roles) {
    const session = Auth.getSession();
    if (!session) return false;
    return roles.includes(session.role);
  },

  isSuperAdmin() { return Auth.hasRole('superadmin'); },
  isHead() { return Auth.hasRole('superadmin', 'head'); },
  isAuditor() { return Auth.hasRole('superadmin', 'head', 'auditor'); },
  isDivision() { return Auth.hasRole('division'); },

  getUserDepartment() {
    const session = Auth.getSession();
    return session ? session.department : null;
  },

  requireAuth() {
    if (!Auth.isLoggedIn()) {
      Router.navigate('login');
      return false;
    }
    return true;
  },

  /**
   * Strict auth check for sensitive pages.
   * Verifies permission server-side before allowing access.
   */
  async requireAuthStrict(pageId) {
    if (!Auth.requireAuth()) return false;
    try {
      const allowed = await Perms.checkServer(pageId, 'read');
      if (!allowed) {
        Toast.error('You do not have access to this page.', 'Access Denied');
        Router.navigate('dashboard');
        return false;
      }
    } catch (err) {
      console.warn('[Auth] Strict check failed, allowing based on client-side:', err);
    }
    return true;
  }
};

window.Auth = Auth;
