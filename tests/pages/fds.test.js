import { describe, it, expect, beforeEach } from 'vitest';

await import('../../js/data.js');
await import('../../js/utils.js');
await import('../../js/pages/fds.js');

const CURRENT_YEAR = new Date().getFullYear();

beforeEach(() => {
  DB.set('fds_cases', []);
  FDSPage.filters = { dateFrom: '', dateTo: '', brand: '', outlet: '', status: '', search: '' };
});

describe('FDSPage.applyFilters', () => {
  const sampleData = [
    { id: '1', caseNo: 'FDS-001', detectionDate: '2024-01-15', status: 'Planned', brand: 'BrandA', outletCode: 'OUT001', outletName: 'Outlet 1' },
    { id: '2', caseNo: 'FDS-002', detectionDate: '2024-02-20', status: 'Closed', brand: 'BrandB', outletCode: 'OUT002', outletName: 'Outlet 2' },
    { id: '3', caseNo: 'FDS-003', detectionDate: '2024-03-10', status: 'Investigation', brand: 'BrandA', outletCode: 'OUT003', outletName: 'Outlet 3' },
  ];

  it('should return all when no filters', () => {
    const result = FDSPage.applyFilters(sampleData);
    expect(result).toHaveLength(3);
  });

  it('should filter by status', () => {
    FDSPage.filters.status = 'Closed';
    const result = FDSPage.applyFilters(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should filter by brand', () => {
    FDSPage.filters.brand = 'BrandB';
    const result = FDSPage.applyFilters(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should filter by outlet', () => {
    FDSPage.filters.outlet = 'OUT003';
    const result = FDSPage.applyFilters(sampleData);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('should filter by date range', () => {
    FDSPage.filters.dateFrom = '2024-02-01';
    FDSPage.filters.dateTo = '2024-02-29';
    const result = FDSPage.applyFilters(sampleData);
    expect(result).toHaveLength(1);
  });
});

describe('FDSPage._genCaseNo', () => {
  it('should generate next case number based on total count', () => {
    DB.set('fds_cases', [
      { caseNo: `FDS-${CURRENT_YEAR}-001` },
      { caseNo: `FDS-${CURRENT_YEAR}-002` },
    ]);
    const result = FDSPage._genCaseNo();
    expect(result).toBe(`FDS-${CURRENT_YEAR}-003`);
  });

  it('should generate first case number when none exist', () => {
    DB.set('fds_cases', []);
    const result = FDSPage._genCaseNo();
    expect(result).toBe(`FDS-${CURRENT_YEAR}-001`);
  });

  it('should count previous year cases too', () => {
    DB.set('fds_cases', [
      { caseNo: 'FDS-2023-005' },
    ]);
    const result = FDSPage._genCaseNo();
    expect(result).toBe(`FDS-${CURRENT_YEAR}-002`);
  });
});
