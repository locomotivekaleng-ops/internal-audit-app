import { describe, it, expect } from 'vitest';

await import('../../js/data.js');
await import('../../js/utils.js');
await import('../../js/auth.js');
await import('../../js/pages/auditors.js');

describe('AuditorsPage.buildAuditorCard', () => {
  it('should render auditor name and title', () => {
    const auditor = { id: '1', name: 'John Doe', title: 'Senior Auditor', department: 'Store Audit', nik: 'NIK001', joinDate: '2020-01-01', status: 'active' };
    const cases = [];
    const result = AuditorsPage.buildAuditorCard(auditor, cases);
    expect(result).toContain('John Doe');
    expect(result).toContain('Senior Auditor');
    expect(result).toContain('NIK001');
  });

  it('should show 0 cases when none assigned', () => {
    const auditor = { id: '1', name: 'Jane Smith', title: 'Auditor', department: 'Corporate Audit', nik: 'NIK002', joinDate: '2021-01-01', status: 'active' };
    const result = AuditorsPage.buildAuditorCard(auditor, []);
    expect(result).toContain('0');
    expect(result).toContain('Cases');
  });

  it('should count assigned and closed cases', () => {
    const auditor = { id: '1', name: 'John Doe', title: 'Senior Auditor', department: 'Store Audit', nik: 'NIK001', joinDate: '2020-01-01', status: 'active' };
    const cases = [
      { id: 'c1', assignedTo: '1', status: 'Closed', totalLoss: 1000000 },
      { id: 'c2', assignedTo: '1', status: 'In Progress', totalLoss: 500000 },
    ];
    const result = AuditorsPage.buildAuditorCard(auditor, cases);
    expect(result).toContain('2');
    expect(result).toContain('1');
  });

  it('should show inactive badge for inactive auditors', () => {
    const auditor = { id: '1', name: 'John Doe', title: 'Senior Auditor', department: 'Store Audit', nik: 'NIK001', joinDate: '2020-01-01', status: 'inactive' };
    const result = AuditorsPage.buildAuditorCard(auditor, []);
    expect(result).toContain('Inactive');
    expect(result).toContain('badge-red');
  });

  it('should not show inactive badge for active auditors', () => {
    const auditor = { id: '1', name: 'John Doe', title: 'Senior Auditor', department: 'Store Audit', nik: 'NIK001', joinDate: '2020-01-01', status: 'active' };
    const result = AuditorsPage.buildAuditorCard(auditor, []);
    expect(result).not.toContain('Inactive');
  });

  it('should show avatar with initials', () => {
    const auditor = { id: '1', name: 'John Doe', title: 'Senior Auditor', department: 'Store Audit', nik: 'NIK001', joinDate: '2020-01-01', status: 'active' };
    const result = AuditorsPage.buildAuditorCard(auditor, []);
    expect(result).toContain('JD');
  });
});
