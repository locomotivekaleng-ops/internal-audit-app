import { describe, it, expect, beforeEach, vi } from 'vitest';

globalThis.Auth = {
  getSession: vi.fn(),
};

globalThis.Supabase = {
  _fetch: vi.fn(),
};

globalThis.localStorage = {
  _data: {},
  getItem(key) { return this._data[key] || null; },
  setItem(key, val) { this._data[key] = String(val); },
  removeItem(key) { delete this._data[key]; },
  clear() { this._data = {}; },
};

await import('../js/permissions.js');

const Perms = globalThis.Perms;

describe('Perms', () => {
  beforeEach(() => {
    localStorage.clear();
    Auth.getSession.mockReset();
    Supabase._fetch.mockReset();
    Perms._cache = null;
    Perms._loaded = false;
  });

  it('should load defaults when server unavailable', async () => {
    Supabase._fetch.mockRejectedValue(new Error('Network error'));
    await Perms._load();
    const matrix = Perms.getMatrix();
    expect(matrix.superadmin).toBeDefined();
    expect(matrix.head).toBeDefined();
    expect(matrix.auditor).toBeDefined();
    expect(matrix.division).toBeDefined();
  });

  it('superadmin should have full access to all pages', () => {
    Auth.getSession.mockReturnValue({ role: 'superadmin' });
    expect(Perms.getEffectiveAccess('users')).toBe('full');
    expect(Perms.getEffectiveAccess('master')).toBe('full');
    expect(Perms.getEffectiveAccess('dashboard')).toBe('full');
    expect(Perms.getEffectiveAccess('wbs')).toBe('full');
  });

  it('head should have full access to all pages', () => {
    Auth.getSession.mockReturnValue({ role: 'head' });
    expect(Perms.getEffectiveAccess('users')).toBe('full');
    expect(Perms.getEffectiveAccess('master')).toBe('full');
    expect(Perms.getEffectiveAccess('auditors')).toBe('full');
  });

  it('auditor should have limited access', () => {
    Auth.getSession.mockReturnValue({ role: 'auditor' });
    expect(Perms.getEffectiveAccess('dashboard')).toBe('full');
    expect(Perms.getEffectiveAccess('cases')).toBe('full');
    expect(Perms.getEffectiveAccess('master')).toBe('none');
    expect(Perms.getEffectiveAccess('users')).toBe('none');
    expect(Perms.getEffectiveAccess('auditors')).toBe('read');
  });

  it('division should only access dept-dashboard', () => {
    Auth.getSession.mockReturnValue({ role: 'division' });
    expect(Perms.getEffectiveAccess('dept-dashboard')).toBe('full');
    expect(Perms.getEffectiveAccess('dashboard')).toBe('none');
    expect(Perms.getEffectiveAccess('master')).toBe('none');
    expect(Perms.getEffectiveAccess('users')).toBe('none');
    expect(Perms.getEffectiveAccess('cases')).toBe('none');
  });

  it('canRead should return true for accessible pages', () => {
    Auth.getSession.mockReturnValue({ role: 'superadmin' });
    expect(Perms.canRead('dashboard')).toBe(true);
    expect(Perms.canRead('nonexistent')).toBe(false);
  });

  it('canRead should return false when not logged in', () => {
    Auth.getSession.mockReturnValue(null);
    expect(Perms.canRead('dashboard')).toBe(false);
  });

  it('canWrite should return true only for full access', () => {
    Auth.getSession.mockReturnValue({ role: 'auditor' });
    expect(Perms.canWrite('dashboard')).toBe(true);
    expect(Perms.canWrite('auditors')).toBe(false);
    expect(Perms.canWrite('master')).toBe(false);
  });

  it('getEffectiveAccess should return none for unknown role', () => {
    Auth.getSession.mockReturnValue({ role: 'unknown' });
    expect(Perms.getEffectiveAccess('dashboard')).toBe('none');
  });

  it('can should check permission overrides', () => {
    Auth.getSession.mockReturnValue({ role: 'superadmin' });
    expect(Perms.can('cases:planning:write')).toBe(true);
  });

  it('can should return false for unknown permission', () => {
    Auth.getSession.mockReturnValue({ role: 'auditor' });
    expect(Perms.can('cases:planning:write')).toBe(false);
  });

  it('can should return false when not logged in', () => {
    Auth.getSession.mockReturnValue(null);
    expect(Perms.can('cases:planning:write')).toBe(false);
  });

  it('save should call server RPC', async () => {
    Supabase._fetch.mockResolvedValue(true);
    const matrix = {
      superadmin: { dashboard: 'full', users: 'full' },
      head: { dashboard: 'full', users: 'full' },
      auditor: { dashboard: 'read', users: 'none' },
      division: { dashboard: 'none', users: 'none' },
    };
    await Perms.save(matrix);
    expect(Supabase._fetch).toHaveBeenCalledWith('POST', 'rpc/upsert_permissions_bulk', {
      body: expect.arrayContaining([
        expect.objectContaining({ role: 'superadmin', page_id: 'dashboard', permission: 'full' }),
      ]),
    });
    expect(Perms._cache).toEqual(matrix);
  });

  it('reset should call server RPC with defaults', async () => {
    Supabase._fetch.mockResolvedValue(true);
    await Perms.reset();
    expect(Supabase._fetch).toHaveBeenCalledWith('POST', 'rpc/upsert_permissions_bulk', {
      body: expect.arrayContaining([
        expect.objectContaining({ role: 'superadmin', page_id: 'dashboard', permission: 'full' }),
      ]),
    });
  });
});
