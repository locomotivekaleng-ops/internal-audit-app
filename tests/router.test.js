import { describe, it, expect, beforeEach, vi } from 'vitest';

globalThis.Auth = {
  isLoggedIn: vi.fn(),
  requireAuth: vi.fn(),
};

globalThis.Perms = {
  canRead: vi.fn(() => true),
};

globalThis.Charts = { destroyAll: vi.fn() };

globalThis.Toast = { error: vi.fn() };

globalThis.Utils = { escapeHtml: vi.fn(x => x) };

globalThis.Components = { renderAppShell: vi.fn() };

Object.defineProperty(document, 'head', { value: { appendChild: vi.fn() }, writable: false });
document.getElementById = vi.fn(() => null);
document.querySelector = vi.fn(() => null);
document.querySelectorAll = vi.fn(() => []);
delete window.location.hash;
Object.defineProperty(window.location, 'hash', { value: '', writable: true });

await import('../js/router.js');

const Router = globalThis.Router;

describe('Router', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Router._loaded = {};
  });

  it('should have routes for all page names', () => {
    expect(Object.keys(Router.routes)).toHaveLength(14);
    expect(Router.routes.login).toBeDefined();
    expect(Router.routes.dashboard).toBeDefined();
    expect(Router.routes.users).toBeDefined();
  });

  it('getCurrentRoute should return current hash', () => {
    location.hash = '#test-route';
    expect(Router.getCurrentRoute()).toBe('test-route');
  });

  it('getCurrentRoute should default to login', () => {
    location.hash = '';
    expect(Router.getCurrentRoute()).toBe('login');
  });

  it('dispatch should show error for unauthorized route', async () => {
    Perms.canRead.mockReturnValue(false);
    await Router.dispatch('users');
    expect(Toast.error).toHaveBeenCalledWith('Anda tidak memiliki akses ke halaman ini.');
  });

  it('dispatch should fallback to dashboard for unknown route', async () => {
    vi.spyOn(Router, 'navigate').mockImplementation(() => {});
    await Router.dispatch('nonexistent');
    expect(Router.navigate).toHaveBeenCalledWith('dashboard', true);
  });

  it('navigate should call dispatch', () => {
    const spy = vi.spyOn(Router, 'dispatch').mockImplementation(() => {});
    Router.navigate('dashboard');
    expect(spy).toHaveBeenCalledWith('dashboard');
    spy.mockRestore();
  });

  it('navigate with replace should use replaceState', () => {
    const spy = vi.spyOn(history, 'replaceState');
    Router.navigate('dashboard', true);
    expect(spy).toHaveBeenCalled();
  });

  it('init should redirect to login when not logged in', () => {
    Auth.isLoggedIn.mockReturnValue(false);
    Router.init();
    // Should call dispatch for login when hash is empty
    // Setting hash triggers hashchange which calls dispatch
    location.hash = '#/';
  });
});
