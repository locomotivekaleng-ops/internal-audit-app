import { describe, it, expect, beforeEach } from 'vitest';

await import('../../js/data.js');
await import('../../js/utils.js');
await import('../../js/pages/cases.js');

beforeEach(() => {
  DB.set('audit_plannings', []);
  CasesPage.filters = { dateFrom: '', dateTo: '', department: '', brand: '', outlet: '', trigger: '', status: '', search: '' };
});

describe('Utils.laporanBadge', () => {
  it('should return blue badge for Plan', () => {
    const result = Utils.laporanBadge('Plan');
    expect(result).toContain('badge-blue');
    expect(result).toContain('Plan');
  });

  it('should return amber badge for In Progress', () => {
    const result = Utils.laporanBadge('In Progress');
    expect(result).toContain('badge-amber');
    expect(result).toContain('In Progress');
  });

  it('should return green badge for Completed', () => {
    const result = Utils.laporanBadge('Completed');
    expect(result).toContain('badge-green');
    expect(result).toContain('Completed');
  });

  it('should return red badge for Cancelled', () => {
    const result = Utils.laporanBadge('Cancelled');
    expect(result).toContain('badge-red');
    expect(result).toContain('Cancelled');
  });

  it('should return gray badge for unknown status', () => {
    const result = Utils.laporanBadge('Unknown');
    expect(result).toContain('badge-gray');
  });
});

describe('Utils.aapStatusBadge', () => {
  it('should return green badge for Completed', () => {
    const result = Utils.aapStatusBadge('Completed');
    expect(result).toContain('badge-green');
    expect(result).toContain('Completed');
  });

  it('should return gray badge for New', () => {
    const result = Utils.aapStatusBadge('New');
    expect(result).toContain('badge-gray');
    expect(result).toContain('New');
  });

  it('should return amber badge for In Progress', () => {
    const result = Utils.aapStatusBadge('In Progress');
    expect(result).toContain('badge-amber');
    expect(result).toContain('In Progress');
  });

  it('should return amber badge for unknown status', () => {
    const result = Utils.aapStatusBadge('Unknown');
    expect(result).toContain('badge-amber');
  });
});

describe('CasesPage.applyFilters', () => {
  const sampleData = [
    { id: '1', reportNo: 'LAP-2024-001', planningDate: '2024-01-15', department: 'Store Audit', brand: 'BrandA', outletCode: 'OUT001', outletName: 'Outlet 1', trigger: 'WBS', status: 'In Progress' },
    { id: '2', reportNo: 'LAP-2024-002', planningDate: '2024-02-20', department: 'Corporate Audit', brand: 'BrandB', outletCode: 'OUT002', outletName: 'Outlet 2', trigger: 'FDS', status: 'Completed' },
    { id: '3', reportNo: 'LAP-2024-003', planningDate: '2024-03-10', department: 'Store Audit', brand: 'BrandA', outletCode: 'OUT003', outletName: 'Outlet 3', trigger: 'Direct', status: 'Plan' },
  ];

  it('should return all data when no filters are set', () => {
    const result = CasesPage.applyFilters(sampleData);
    expect(result).toHaveLength(3);
  });

  it('should filter by department', () => {
    CasesPage.filters.department = 'Store Audit';
    const result = CasesPage.applyFilters(sampleData);
    expect(result).toHaveLength(2);
  });

  it('should filter by status', () => {
    CasesPage.filters.status = 'Completed';
    const result = CasesPage.applyFilters(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should filter by trigger', () => {
    CasesPage.filters.trigger = 'WBS';
    const result = CasesPage.applyFilters(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should filter by brand', () => {
    CasesPage.filters.brand = 'BrandA';
    const result = CasesPage.applyFilters(sampleData);
    expect(result).toHaveLength(2);
  });

  it('should filter by outlet', () => {
    CasesPage.filters.outlet = 'OUT002';
    const result = CasesPage.applyFilters(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should filter by date range', () => {
    CasesPage.filters.dateFrom = '2024-01-01';
    CasesPage.filters.dateTo = '2024-02-28';
    const result = CasesPage.applyFilters(sampleData);
    expect(result).toHaveLength(2);
  });

  it('should filter by search (reportNo)', () => {
    CasesPage.filters.search = '002';
    const result = CasesPage.applyFilters(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should filter by search (outletCode)', () => {
    CasesPage.filters.search = 'OUT003';
    const result = CasesPage.applyFilters(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('should combine multiple filters', () => {
    CasesPage.filters.department = 'Store Audit';
    CasesPage.filters.brand = 'BrandA';
    const result = CasesPage.applyFilters(sampleData);
    expect(result).toHaveLength(2);
  });

  it('should return empty when no match', () => {
    CasesPage.filters.status = 'Cancelled';
    const result = CasesPage.applyFilters(sampleData);
    expect(result).toHaveLength(0);
  });
});
