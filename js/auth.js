/* ============================================================
   AUTH — Session management
   ============================================================ */

const Auth = {
  SESSION_KEY: 'ia_session',

  login(username, password) {
    const users = DB.get('users');
    const user = users.find(u =>
      u.username === username.trim() &&
      u.password === password &&
      u.status === 'active'
    );
    if (!user) return null;
    const session = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      department: user.department,
      loginAt: new Date().toISOString()
    };
    sessionStorage.setItem(Auth.SESSION_KEY, JSON.stringify(session));
    return session;
  },

  logout() {
    sessionStorage.removeItem(Auth.SESSION_KEY);
  },

  getSession() {
    try {
      const raw = sessionStorage.getItem(Auth.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
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
  }
};

window.Auth = Auth;
