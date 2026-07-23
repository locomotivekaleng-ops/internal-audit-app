import { describe, it, expect, beforeEach, vi } from 'vitest';

// These are normally set by supabase.js
globalThis.SUPABASE_URL = 'http://127.0.0.1:54321';
globalThis.SUPABASE_ANON_KEY = 'test_anon_key';

globalThis.Supabase = {
  authLogin: vi.fn(),
  authLogout: vi.fn(),
  _transform: vi.fn(x => x),
};

globalThis.Router = {
  navigate: vi.fn(),
};

await import('../js/auth.js');

const Auth = globalThis.Auth;

function mockFetch(result) {
  globalThis.fetch = vi.fn().mockResolvedValue(result);
}

describe('Auth', () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login and store session', async () => {
      Supabase.authLogin.mockResolvedValue({
        user: { id: 'uuid-123' },
        access_token: 'token-456',
      });
      mockFetch({
        ok: true,
        json: () => Promise.resolve([{
          id: 'uuid-123', username: 'admin', name: 'Admin User',
          role: 'superadmin', department: null, status: 'active',
        }]),
      });

      const session = await Auth.login('admin', 'admin123');
      expect(session).not.toBeNull();
      expect(session.username).toBe('admin');
      expect(session.role).toBe('superadmin');
      expect(Supabase.authLogin).toHaveBeenCalledWith('admin@internal-audit.app', 'admin123');
    });

    it('should handle login failure', async () => {
      Supabase.authLogin.mockRejectedValue(new Error('Invalid login credentials'));
      await expect(Auth.login('admin', 'wrongpass')).rejects.toThrow('Invalid login credentials');
    });
  });

  describe('session management', () => {
    it('should return null when no session exists', () => {
      expect(Auth.getSession()).toBeNull();
    });

    it('should retrieve stored session', async () => {
      Supabase.authLogin.mockResolvedValue({
        user: { id: 'uuid-123' },
        access_token: 'token-456',
      });
      mockFetch({
        ok: true,
        json: () => Promise.resolve([{
          id: 'uuid-123', username: 'admin', name: 'Admin User',
          role: 'superadmin', department: null, status: 'active',
        }]),
      });

      await Auth.login('admin', 'admin123');
      const session = Auth.getSession();
      expect(session).not.toBeNull();
      expect(session.name).toBe('Admin User');
    });

    it('should clear session on logout', async () => {
      Supabase.authLogin.mockResolvedValue({
        user: { id: 'uuid-123' },
        access_token: 'token-456',
      });
      mockFetch({
        ok: true,
        json: () => Promise.resolve([{
          id: 'uuid-123', username: 'admin', name: 'Admin User',
          role: 'superadmin', department: null, status: 'active',
        }]),
      });

      await Auth.login('admin', 'admin123');
      expect(Auth.isLoggedIn()).toBe(true);
      Supabase.authLogout.mockResolvedValue();
      await Auth.logout();
      expect(Auth.getSession()).toBeNull();
    });

    it('should detect logged in state', async () => {
      expect(Auth.isLoggedIn()).toBe(false);

      Supabase.authLogin.mockResolvedValue({
        user: { id: 'uuid-123' },
        access_token: 'token-456',
      });
      mockFetch({
        ok: true,
        json: () => Promise.resolve([{
          id: 'uuid-123', username: 'admin', name: 'Admin User',
          role: 'superadmin', department: null, status: 'active',
        }]),
      });

      await Auth.login('admin', 'admin123');
      expect(Auth.isLoggedIn()).toBe(true);

      Supabase.authLogout.mockResolvedValue();
      await Auth.logout();
      expect(Auth.isLoggedIn()).toBe(false);
    });
  });

  describe('role checks', () => {
    async function loginAs(role, dept = null) {
      Supabase.authLogin.mockResolvedValue({
        user: { id: 'uuid-' + role },
        access_token: 'token-' + role,
      });
      mockFetch({
        ok: true,
        json: () => Promise.resolve([{
          id: 'uuid-' + role,
          username: role,
          name: role.charAt(0).toUpperCase() + role.slice(1) + ' User',
          role,
          department: dept,
          status: 'active',
        }]),
      });
      await Auth.login(role, 'pass');
    }

    it('should check superadmin role', async () => {
      await loginAs('superadmin');
      expect(Auth.isSuperAdmin()).toBe(true);
      expect(Auth.isHead()).toBe(true);
      expect(Auth.isAuditor()).toBe(true);
      expect(Auth.isDivision()).toBe(false);
    });

    it('should check auditor role', async () => {
      await loginAs('auditor');
      expect(Auth.isSuperAdmin()).toBe(false);
      expect(Auth.isHead()).toBe(false);
      expect(Auth.isAuditor()).toBe(true);
      expect(Auth.isDivision()).toBe(false);
    });

    it('should check division role', async () => {
      await loginAs('division');
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
    it('should return true when logged in', async () => {
      Supabase.authLogin.mockResolvedValue({
        user: { id: 'uuid-123' },
        access_token: 'token-456',
      });
      mockFetch({
        ok: true,
        json: () => Promise.resolve([{
          id: 'uuid-123', username: 'admin', name: 'Admin User',
          role: 'superadmin', department: null, status: 'active',
        }]),
      });

      await Auth.login('admin', 'admin123');
      expect(Auth.requireAuth()).toBe(true);
    });

    it('should redirect to login when not logged in', () => {
      expect(Auth.requireAuth()).toBe(false);
      expect(Router.navigate).toHaveBeenCalledWith('login');
    });
  });

  describe('getUserDepartment', () => {
    it('should return department for division user', async () => {
      Supabase.authLogin.mockResolvedValue({
        user: { id: 'uuid-div' },
        access_token: 'token-div',
      });
      mockFetch({
        ok: true,
        json: () => Promise.resolve([{
          id: 'uuid-div', username: 'div1', name: 'Divisi User',
          role: 'division', department: 'Finance', status: 'active',
        }]),
      });
      await Auth.login('div1', 'pass');
      expect(Auth.getUserDepartment()).toBe('Finance');
    });

    it('should return null for users without department', async () => {
      Supabase.authLogin.mockResolvedValue({
        user: { id: 'uuid-admin' },
        access_token: 'token-admin',
      });
      mockFetch({
        ok: true,
        json: () => Promise.resolve([{
          id: 'uuid-admin', username: 'admin', name: 'Admin User',
          role: 'superadmin', department: null, status: 'active',
        }]),
      });
      await Auth.login('admin', 'admin123');
      expect(Auth.getUserDepartment()).toBeNull();
    });

    it('should return null when not logged in', () => {
      expect(Auth.getUserDepartment()).toBeNull();
    });
  });
});
