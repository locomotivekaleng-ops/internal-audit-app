import { describe, it, expect, beforeEach, vi } from 'vitest';

globalThis.Auth = {
  getSession: vi.fn(() => ({ name: 'Admin', role: 'superadmin', department: null })),
  requireAuth: vi.fn(() => true),
};

globalThis.Perms = {
  canRead: vi.fn(() => true),
};

globalThis.Utils = {
  getInitials: vi.fn(() => 'A'),
  escapeHtml: vi.fn(x => x),
  getDeptName: vi.fn(() => ''),
};

globalThis.lucide = { createIcons: vi.fn() };

const domEls = {};
document.getElementById = vi.fn((id) => {
  if (!domEls[id]) domEls[id] = document.createElement('div');
  return domEls[id];
});
document.querySelector = vi.fn(() => document.createElement('div'));
document.querySelectorAll = vi.fn(() => []);

await import('../js/components.js');

const Components = globalThis.Components;

describe('Components', () => {
  beforeEach(() => {
    for (const key of Object.keys(domEls)) domEls[key].innerHTML = '';
    vi.clearAllMocks();
  });

  it('should have all nav items defined', () => {
    expect(Components._allNavItems).toHaveLength(13);
  });

  it('renderAppShell should set app-root innerHTML', () => {
    Components.renderAppShell('Test', 'Subtitle', '<p>content</p>', 'dashboard');
    expect(domEls['app-root'].innerHTML).toContain('app-shell');
    expect(domEls['app-root'].innerHTML).toContain('Test');
  });

  it('roleLabel should map roles correctly', () => {
    expect(Components.roleLabel('superadmin')).toBe('Superadmin');
    expect(Components.roleLabel('head')).toBe('Manager Audit');
    expect(Components.roleLabel('auditor')).toBe('Auditor');
    expect(Components.roleLabel('division')).toBe('Auditee / Other Dept');
    expect(Components.roleLabel('unknown')).toBe('unknown');
  });

  it('kpiCard should return HTML string', () => {
    const html = Components.kpiCard('Total Cases', 42, 'Active', 'folder', 'blue');
    expect(html).toContain('kpi-card');
    expect(html).toContain('42');
  });

  it('buildFilterBar should render select filters', () => {
    const filters = [
      { type: 'select', id: 'ff-status', label: 'Status', options: [{ value: 'active', label: 'Active' }] },
    ];
    const html = Components.buildFilterBar(filters);
    expect(html).toContain('ff-status');
  });

  it('buildFilterBar should render date filters', () => {
    const filters = [{ type: 'date', id: 'ff-date', label: 'Date', value: '2024-01-01' }];
    const html = Components.buildFilterBar(filters);
    expect(html).toContain('type="date"');
  });

  it('buildFilterBar should render search filters', () => {
    const filters = [{ type: 'search', id: 'ff-search', label: 'Search', value: 'test' }];
    const html = Components.buildFilterBar(filters);
    expect(html).toContain('search-input');
  });

  it('buildFilterBar should return empty for unknown type', () => {
    const filters = [{ type: 'unknown', id: 'x', label: 'X' }];
    expect(Components.buildFilterBar(filters)).toBe('');
  });
});

describe('DataTable', () => {
  it('render should produce table HTML', () => {
    const html = globalThis.DataTable.render({
      columns: [{ key: 'name', label: 'Name' }],
      data: [{ name: 'Test' }],
      buildRow: (item) => `<tr><td>${item.name}</td></tr>`,
    });
    expect(html).toContain('data-table');
  });

  it('render should show empty message', () => {
    const html = globalThis.DataTable.render({
      columns: [{ key: 'name', label: 'Name' }],
      data: [],
      buildRow: () => '',
      emptyMessage: 'Nothing here',
    });
    expect(html).toContain('Nothing here');
  });

  it('render should add sort indicators', () => {
    const html = globalThis.DataTable.render({
      columns: [{ key: 'name', label: 'Name' }],
      data: [],
      buildRow: () => '',
      sort: { key: 'name', dir: 'asc', onChange: 'test' },
    });
    expect(html).toContain('sortable');
  });

  it('pageItems should slice correctly', () => {
    expect(globalThis.DataTable.pageItems([1, 2, 3, 4, 5], 1, 2)).toEqual([1, 2]);
    expect(globalThis.DataTable.pageItems([1, 2, 3, 4, 5], 3, 2)).toEqual([5]);
  });
});

describe('PageLifecycle', () => {
  it('on should attach event listener to element', () => {
    const el = document.createElement('div');
    document.getElementById.mockReturnValue(el);
    const addSpy = vi.spyOn(el, 'addEventListener');
    globalThis.PageLifecycle.on('my-btn', 'click', () => {});
    expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function));
  });

  it('on should not throw if element not found', () => {
    document.getElementById.mockReturnValue(null);
    expect(() => globalThis.PageLifecycle.on('missing', 'click', () => {})).not.toThrow();
  });
});
