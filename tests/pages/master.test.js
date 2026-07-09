import { describe, it, expect } from 'vitest';

await import('../../js/pages/master.js');

describe('MasterPage.parseCSV', () => {
  it('should parse simple CSV with headers and rows', () => {
    const csv = 'name,code,description\nAudit,ADT,Audit Department\nFinance,FIN,Finance Department';
    const result = MasterPage.parseCSV(csv);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(['name', 'code', 'description']);
    expect(result[1]).toEqual(['Audit', 'ADT', 'Audit Department']);
  });

  it('should handle quoted values with commas', () => {
    const csv = 'name,desc\nItem,"Description, with, commas"';
    const result = MasterPage.parseCSV(csv);
    expect(result[1][1]).toBe('Description, with, commas');
  });

  it('should handle quoted values with newlines', () => {
    const csv = 'name,desc\nItem,"Multi\nline"';
    const result = MasterPage.parseCSV(csv);
    expect(result[1][1]).toBe('Multi');
  });

  it('should skip empty lines', () => {
    const csv = 'a,b\n\n1,2\n\n3,4';
    const result = MasterPage.parseCSV(csv);
    expect(result).toHaveLength(3);
  });

  it('should handle single row', () => {
    const csv = 'a,b\n1,2';
    const result = MasterPage.parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(['a', 'b']);
    expect(result[1]).toEqual(['1', '2']);
  });

  it('should handle empty input', () => {
    const result = MasterPage.parseCSV('');
    expect(result).toEqual([]);
  });

  it('should trim whitespace from cells', () => {
    const csv = '  a  ,  b  \n  1  ,  2  ';
    const result = MasterPage.parseCSV(csv);
    expect(result[0]).toEqual(['a', 'b']);
    expect(result[1]).toEqual(['1', '2']);
  });

  it('should handle Windows-style line endings (\\r\\n)', () => {
    const csv = 'a,b\r\n1,2\r\n3,4';
    const result = MasterPage.parseCSV(csv);
    expect(result).toHaveLength(3);
  });
});
