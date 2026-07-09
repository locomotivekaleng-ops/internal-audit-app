import { describe, it, expect, beforeEach } from 'vitest';

// Load the source module (side-effect import sets window.DB)
await import('../js/data.js');

const DB = globalThis.DB;

describe('DB', () => {
  beforeEach(() => {
    localStorage.clear();
    DB.clearCache();
  });

  it('should insert and retrieve records', () => {
    const record = DB.insert('wbs_cases', { caseNo: 'WBS-001', category: 'Fraud', brand: 'PHD', status: 'New' });
    expect(record.id).toBeDefined();
    expect(record.caseNo).toBe('WBS-001');
    expect(record.createdAt).toBeDefined();
    expect(record.updatedAt).toBeDefined();

    const items = DB.get('wbs_cases');
    expect(items).toHaveLength(1);
    expect(items[0].caseNo).toBe('WBS-001');
  });

  it('should find records by id (O(1) index)', () => {
    const r1 = DB.insert('wbs_cases', { caseNo: 'WBS-001', category: 'Fraud', brand: 'PHD', status: 'New' });
    const r2 = DB.insert('wbs_cases', { caseNo: 'WBS-002', category: 'Corruption', brand: 'MCD', status: 'Investigation' });

    const found = DB.find('wbs_cases', r1.id);
    expect(found).not.toBeNull();
    expect(found.caseNo).toBe('WBS-001');

    expect(DB.find('wbs_cases', 'nonexistent')).toBeNull();
  });

  it('should update records', () => {
    const r = DB.insert('wbs_cases', { caseNo: 'WBS-001', category: 'Fraud', brand: 'PHD', status: 'New' });
    const updated = DB.update('wbs_cases', r.id, { status: 'Closed' });
    expect(updated.status).toBe('Closed');
    expect(updated.updatedAt).toBeDefined();

    const fetched = DB.find('wbs_cases', r.id);
    expect(fetched.status).toBe('Closed');
  });

  it('should return null when updating nonexistent record', () => {
    const result = DB.update('wbs_cases', 'nonexistent', { status: 'Closed' });
    expect(result).toBeNull();
  });

  it('should delete records', () => {
    const r = DB.insert('wbs_cases', { caseNo: 'WBS-001', category: 'Fraud', brand: 'PHD', status: 'New' });
    DB.delete('wbs_cases', r.id);
    expect(DB.find('wbs_cases', r.id)).toBeNull();
    expect(DB.get('wbs_cases')).toHaveLength(0);
  });

  it('should cache data across get() calls', () => {
    DB.insert('wbs_cases', { caseNo: 'WBS-001', category: 'Fraud', brand: 'PHD', status: 'New' });
    const call1 = DB.get('wbs_cases');
    const call2 = DB.get('wbs_cases');
    expect(call1).toBe(call2); // same reference = cached
  });

  it('should invalidate cache on insert', () => {
    DB.insert('wbs_cases', { caseNo: 'WBS-001', category: 'Fraud', brand: 'PHD', status: 'New' });
    const before = DB.get('wbs_cases');
    DB.insert('wbs_cases', { caseNo: 'WBS-002', category: 'Corruption', brand: 'MCD', status: 'New' });
    const after = DB.get('wbs_cases');
    expect(after).toHaveLength(2);
  });

  it('should validate required fields on insert', () => {
    expect(() => DB.insert('wbs_cases', { brand: 'PHD' })).toThrow('Validation failed');
    expect(() => DB.insert('wbs_cases', {})).toThrow('Validation failed');
  });

  it('should validate field types on insert', () => {
    expect(() => DB.insert('wbs_cases', { caseNo: 123, category: 'Fraud', brand: 'PHD', status: 'New' }))
      .toThrow('must be string');
  });

  it('should validate on update (merged with existing)', () => {
    const r = DB.insert('wbs_cases', { caseNo: 'WBS-001', category: 'Fraud', brand: 'PHD', status: 'New' });
    // Updating with invalid type
    expect(() => DB.update('wbs_cases', r.id, { caseNo: 999 })).toThrow('must be string');
  });

  it('should accept partial updates that pass validation', () => {
    const r = DB.insert('wbs_cases', { caseNo: 'WBS-001', category: 'Fraud', brand: 'PHD', status: 'New' });
    const updated = DB.update('wbs_cases', r.id, { status: 'Closed' });
    expect(updated.status).toBe('Closed');
    expect(updated.caseNo).toBe('WBS-001'); // unchanged
  });

  it('should generate unique ids', () => {
    const id1 = DB.genId();
    const id2 = DB.genId();
    expect(id1).not.toBe(id2);
  });

  it('should list all tables via TABLES', () => {
    expect(DB.TABLES.USERS).toBe('users');
    expect(DB.TABLES.AUDITORS).toBe('auditors');
    expect(DB.TABLES.WBS_CASES).toBe('wbs_cases');
  });

  it('should persist data to localStorage', () => {
    DB.insert('wbs_cases', { caseNo: 'WBS-001', category: 'Fraud', brand: 'PHD', status: 'New' });
    const raw = localStorage.getItem('ia_audit_wbs_cases');
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].caseNo).toBe('WBS-001');
  });

  it('should clearCache() and reload from localStorage', () => {
    const r = DB.insert('wbs_cases', { caseNo: 'WBS-001', category: 'Fraud', brand: 'PHD', status: 'New' });
    // Directly mutate localStorage to simulate external change
    const data = JSON.parse(localStorage.getItem('ia_audit_wbs_cases'));
    data[0].caseNo = 'WBS-MODIFIED';
    localStorage.setItem('ia_audit_wbs_cases', JSON.stringify(data));

    DB.clearCache();
    const items = DB.get('wbs_cases');
    expect(items[0].caseNo).toBe('WBS-MODIFIED');
  });

  it('should reset all data', () => {
    DB.insert('wbs_cases', { caseNo: 'WBS-001', category: 'Fraud', brand: 'PHD', status: 'New' });
    DB.insert('fds_cases', { caseNo: 'FDS-001', category: 'Fraud', brand: 'PHD', status: 'New' });
    DB.reset();
    expect(DB.get('wbs_cases')).toHaveLength(0);
    expect(DB.get('fds_cases')).toHaveLength(0);
  });

  it('should detect initialization status', () => {
    expect(DB.isInitialized()).toBe(false);
    DB.markInitialized();
    expect(DB.isInitialized()).toBe(true);
  });
});
