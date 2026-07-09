import { describe, it, expect, beforeEach, vi } from 'vitest';

// Minimal DB mock for Auth tests (avoid loading full data.js here)
const mockUsers = [
  { id: 'u1', username: 'admin', password: 'admin123', name: 'Admin User', role: 'superadmin', status: 'active' },
  { id: 'u2', username: 'auditor1', password: 'pass123', name: 'Auditor Satu', role: 'auditor', status: 'active' },
  { id: 'u3', username: 'div1', password: 'pass123', name: 'Divisi User', role: 'division', status: 'active', department: 'Finance' },
  { id: 'u4', username: 'inactive', password: 'pass123', name: 'Inactive User', role: 'auditor', status: 'inactive' },
];

globalThis.DB = {
  get: vi.fn((table) => table === 'users' ? mockUsers : []),
  find: vi.fn(),
};

globalThis.Router = {
  navigate: vi.fn(),
};

await import('../js/auth.js');

const Auth = globalThis.Auth;

describe('Auth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login with valid credentials', () => {
      const session = Auth.login('admin', 'admin123');
      expect(session).not.toBeNull();
      expect(session.username).toBe('admin');
      expect(session.role).toBe('superadmin');
    });

    it('should return null for invalid password', () => {
      const session = Auth.login('admin', 'wrongpass');
      expect(session).toBeNull();
    });

    it('should return null for unknown user', () => {
      const session = Auth.login('nonexistent', 'pass123');
      expect(session).toBeNull();
    });

    it('should return null for inactive user', () => {
      const session = Auth.login('inactive', 'pass123');
      expect(session).toBeNull();
    });

    it('should store session in sessionStorage', () => {
      Auth.login('admin', 'admin123');
      const raw = sessionStorage.getItem(Auth.SESSION_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw);
      expect(parsed.userId).toBe('u1');
    });
  });

  describe('session management', () => {
    it('should return null when no session exists', () => {
      expect(Auth.getSession()).toBeNull();
    });

    it('should retrieve stored session', () => {
      Auth.login('admin', 'admin123');
      const session = Auth.getSession();
      expect(session).not.toBeNull();
      expect(session.name).toBe('Admin User');
    });

    it('should clear session on logout', () => {
      Auth.login('admin', 'admin123');
      Auth.logout();
      expect(Auth.getSession()).toBeNull();
    });

    it('should detect logged in state', () => {
      expect(Auth.isLoggedIn()).toBe(false);
      Auth.login('admin', 'admin123');
      expect(Auth.isLoggedIn()).toBe(true);
      Auth.logout();
      expect(Auth.isLoggedIn()).toBe(false);
    });
  });

  describe('role checks', () => {
    it('should check superadmin role', () => {
      Auth.login('admin', 'admin123');
      expect(Auth.isSuperAdmin()).toBe(true);
      expect(Auth.isHead()).toBe(true);
      expect(Auth.isAuditor()).toBe(true);
      expect(Auth.isDivision()).toBe(false);
    });

    it('should check auditor role', () => {
      Auth.login('auditor1', 'pass123');
      expect(Auth.isSuperAdmin()).toBe(false);
      expect(Auth.isHead()).toBe(false);
      expect(Auth.isAuditor()).toBe(true);
      expect(Auth.isDivision()).toBe(false);
    });

    it('should check division role', () => {
      Auth.login('div1', 'pass123');
      expect(Auth.isSuperAdmin()).toBe(false);
      expect(Auth.isHead()).toBe(false);
      expect(Auth.isAuditor()).toBe(false);
      expect(Auth.isDivision()).toBe(true);
    });

    it('should return false for role checks when not logged in', () => {
      expect(Auth.isSuperAdmin()).toBe(false);
      expect(Auth.isHead()).toBe(false);
      expect(Auth.isAuditor()).toBe(false);
      expect(Auth.isDivision()).toBe(false);
    });
  });

  describe('requireAuth', () => {
    it('should return true when logged in', () => {
      Auth.login('admin', 'admin123');
      expect(Auth.requireAuth()).toBe(true);
    });

    it('should redirect to login when not logged in', () => {
      expect(Auth.requireAuth()).toBe(false);
      expect(Router.navigate).toHaveBeenCalledWith('login');
    });
  });

  describe('getUserDepartment', () => {
    it('should return department for division user', () => {
      Auth.login('div1', 'pass123');
      expect(Auth.getUserDepartment()).toBe('Finance');
    });

    it('should return null for users without department', () => {
      Auth.login('admin', 'admin123');
      expect(Auth.getUserDepartment()).toBeUndefined();
    });

    it('should return null when not logged in', () => {
      expect(Auth.getUserDepartment()).toBeNull();
    });
  });
});
