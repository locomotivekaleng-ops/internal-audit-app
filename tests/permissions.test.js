import { describe, it, expect, beforeEach, vi } from 'vitest';

globalThis.Auth = {
  getSession: vi.fn(),
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
  });

  it('should load defaults on first access', () => {
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
    expect(Perms.canWrite('auditors')).toBe(false); // read only
    expect(Perms.canWrite('master')).toBe(false); // none
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

  it('save should persist to localStorage', () => {
    Perms.getMatrix().superadmin.dashboard = 'read';
    Perms.save();
    const raw = localStorage.getItem(Perms.STORAGE_KEY);
    expect(raw).toContain('superadmin');
  });

  it('reset should restore defaults', () => {
    Perms.getMatrix().superadmin.dashboard = 'none';
    Perms.reset();
    expect(Perms.getMatrix().superadmin.dashboard).toBe('full');
  });
});
