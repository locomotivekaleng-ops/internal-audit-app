import { describe, it, expect, beforeEach } from 'vitest';

await import('../../js/data.js');
await import('../../js/utils.js');
await import('../../js/pages/wbs.js');

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = String(new Date().getMonth() + 1).padStart(2, '0');

beforeEach(() => {
  DB.set('wbs_cases', []);
  WBSPage.filters = { dateFrom: '', dateTo: '', brand: '', outlet: '', status: '', search: '' };
});

describe('WBSPage.applyFilters', () => {
  const sampleData = [
    { id: '1', caseNo: 'WBS-001', reportDate: '2024-01-15', status: 'New', brand: 'BrandA', outletCode: 'OUT001', outletName: 'Outlet 1' },
    { id: '2', caseNo: 'WBS-002', reportDate: '2024-02-20', status: 'Closed', brand: 'BrandB', outletCode: 'OUT002', outletName: 'Outlet 2' },
    { id: '3', caseNo: 'WBS-003', reportDate: '2024-03-10', status: 'Investigation', brand: 'BrandA', outletCode: 'OUT003', outletName: 'Outlet 3' },
  ];

  it('should return all when no filters', () => {
    const result = WBSPage.applyFilters(sampleData);
    expect(result).toHaveLength(3);
  });

  it('should filter by status', () => {
    WBSPage.filters.status = 'Closed';
    const result = WBSPage.applyFilters(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should filter by brand', () => {
    WBSPage.filters.brand = 'BrandA';
    const result = WBSPage.applyFilters(sampleData);
    expect(result).toHaveLength(2);
  });

  it('should filter by outlet', () => {
    WBSPage.filters.outlet = 'OUT002';
    const result = WBSPage.applyFilters(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should filter by date range', () => {
    WBSPage.filters.dateFrom = '2024-02-01';
    WBSPage.filters.dateTo = '2024-03-31';
    const result = WBSPage.applyFilters(sampleData);
    expect(result).toHaveLength(2);
  });

  it('should filter by search', () => {
    WBSPage.filters.search = '003';
    const result = WBSPage.applyFilters(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });
});

describe('WBSPage._genCaseNo', () => {
  it('should generate next case number based on total count', () => {
    DB.set('wbs_cases', [
      { caseNo: `WBS-${CURRENT_MONTH}-${CURRENT_YEAR}-001` },
      { caseNo: `WBS-${CURRENT_MONTH}-${CURRENT_YEAR}-002` },
    ]);
    const result = WBSPage._genCaseNo();
    expect(result).toBe(`WBS-${CURRENT_MONTH}-${CURRENT_YEAR}-003`);
  });

  it('should generate first case number when none exist', () => {
    DB.set('wbs_cases', []);
    const result = WBSPage._genCaseNo();
    expect(result).toBe(`WBS-${CURRENT_MONTH}-${CURRENT_YEAR}-001`);
  });

  it('should start fresh for new year', () => {
    DB.set('wbs_cases', [
      { caseNo: 'WBS-12-2023-005' },
    ]);
    const result = WBSPage._genCaseNo();
    expect(result).toBe(`WBS-${CURRENT_MONTH}-${CURRENT_YEAR}-001`);
  });
});
