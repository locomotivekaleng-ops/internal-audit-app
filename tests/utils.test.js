import { describe, it, expect } from 'vitest';

await import('../js/utils.js');

const Utils = globalThis.Utils;

describe('Utils.escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(Utils.escapeHtml('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('should escape ampersands', () => {
    expect(Utils.escapeHtml('a & b < c')).toBe('a &amp; b &lt; c');
  });

  it('should return empty string for null/undefined', () => {
    expect(Utils.escapeHtml(null)).toBe('');
    expect(Utils.escapeHtml(undefined)).toBe('');
    expect(Utils.escapeHtml('')).toBe('');
  });

  it('should preserve safe strings', () => {
    expect(Utils.escapeHtml('Hello World')).toBe('Hello World');
    expect(Utils.escapeHtml('12345')).toBe('12345');
  });
});

describe('Utils.formatIDR', () => {
  it('should format billions as B', () => {
    expect(Utils.formatIDR(1_500_000_000)).toBe('1.5B');
  });

  it('should format millions as M', () => {
    expect(Utils.formatIDR(2_500_000)).toBe('2.5M');
  });

  it('should format thousands as K', () => {
    expect(Utils.formatIDR(1_500)).toBe('1.5K');
  });

  it('should format small numbers with locale', () => {
    expect(Utils.formatIDR(1500)).toBe('1.5K');
    expect(Utils.formatIDR(500)).toContain('500');
  });

  it('should return "-" for null/undefined', () => {
    expect(Utils.formatIDR(null)).toBe('-');
    expect(Utils.formatIDR(undefined)).toBe('-');
  });

  it('should handle zero', () => {
    expect(Utils.formatIDR(0)).toBe('0');
  });
});

describe('Utils.formatDate', () => {
  it('should format ISO date string', () => {
    expect(Utils.formatDate('2024-03-15')).toContain('Mar');
    expect(Utils.formatDate('2024-03-15')).toContain('2024');
  });

  it('should return "-" for empty input', () => {
    expect(Utils.formatDate(null)).toBe('-');
    expect(Utils.formatDate('')).toBe('-');
  });

  it('should pass through unparseable strings', () => {
    expect(Utils.formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('Utils.getInitials', () => {
  it('should extract initials from full name', () => {
    expect(Utils.getInitials('John Doe')).toBe('JD');
  });

  it('should handle single name', () => {
    expect(Utils.getInitials('John')).toBe('J');
  });

  it('should handle three-part names', () => {
    expect(Utils.getInitials('John Michael Doe')).toBe('JM');
  });

  it('should return "?" for empty input', () => {
    expect(Utils.getInitials(null)).toBe('?');
    expect(Utils.getInitials('')).toBe('?');
  });
});

describe('Utils._cmpVal', () => {
  it('should compare strings case-insensitively asc', () => {
    expect(Utils._cmpVal('apple', 'Banana', 'asc')).toBeLessThan(0);
    expect(Utils._cmpVal('Banana', 'apple', 'asc')).toBeGreaterThan(0);
  });

  it('should compare strings case-insensitively desc', () => {
    expect(Utils._cmpVal('apple', 'Banana', 'desc')).toBeGreaterThan(0);
    expect(Utils._cmpVal('Banana', 'apple', 'desc')).toBeLessThan(0);
  });

  it('should compare numbers', () => {
    expect(Utils._cmpVal(5, 10, 'asc')).toBeLessThan(0);
    expect(Utils._cmpVal(10, 5, 'asc')).toBeGreaterThan(0);
  });

  it('should put nulls/undefined last', () => {
    expect(Utils._cmpVal(null, 'hello', 'asc')).toBeGreaterThan(0);
    expect(Utils._cmpVal('hello', null, 'asc')).toBeLessThan(0);
    expect(Utils._cmpVal(null, null, 'asc')).toBe(0);
  });

  it('should compare dates', () => {
    expect(Utils._cmpVal('2024-01-01', '2024-06-15', 'asc')).toBeLessThan(0);
    expect(Utils._cmpVal('2024-06-15', '2024-01-01', 'asc')).toBeGreaterThan(0);
  });
});

describe('Utils.sortBy', () => {
  it('should sort array by key asc', () => {
    const arr = [{ name: 'Zoe' }, { name: 'Anna' }, { name: 'Max' }];
    const sorted = Utils.sortBy(arr, 'name', 'asc');
    expect(sorted.map(x => x.name)).toEqual(['Anna', 'Max', 'Zoe']);
  });

  it('should sort array by key desc', () => {
    const arr = [{ name: 'Zoe' }, { name: 'Anna' }, { name: 'Max' }];
    const sorted = Utils.sortBy(arr, 'name', 'desc');
    expect(sorted.map(x => x.name)).toEqual(['Zoe', 'Max', 'Anna']);
  });

  it('should not mutate original array', () => {
    const arr = [{ name: 'Zoe' }, { name: 'Anna' }];
    const sorted = Utils.sortBy(arr, 'name');
    expect(arr[0].name).toBe('Zoe');
    expect(sorted[0].name).toBe('Anna');
  });
});

describe('Utils.groupBy', () => {
  it('should group items by key', () => {
    const items = [
      { category: 'Fraud', name: 'A' },
      { category: 'Corruption', name: 'B' },
      { category: 'Fraud', name: 'C' },
    ];
    const grouped = Utils.groupBy(items, 'category');
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped.Fraud).toHaveLength(2);
    expect(grouped.Corruption).toHaveLength(1);
  });

  it('should use "Unknown" for missing keys', () => {
    const items = [{ name: 'A' }];
    const grouped = Utils.groupBy(items, 'category');
    expect(grouped.Unknown).toHaveLength(1);
  });
});

describe('Utils.sum', () => {
  it('should sum numeric values by key', () => {
    const items = [{ amount: 100 }, { amount: 200 }, { amount: 300 }];
    expect(Utils.sum(items, 'amount')).toBe(600);
  });

  it('should handle missing values as 0', () => {
    const items = [{ amount: 100 }, {}, { amount: 300 }];
    expect(Utils.sum(items, 'amount')).toBe(400);
  });

  it('should return 0 for empty array', () => {
    expect(Utils.sum([], 'amount')).toBe(0);
  });
});

describe('Utils.pct', () => {
  it('should calculate percentage', () => {
    expect(Utils.pct(25, 100)).toBe(25);
    expect(Utils.pct(1, 3)).toBe(33);
  });

  it('should return 0 for zero denominator', () => {
    expect(Utils.pct(10, 0)).toBe(0);
  });
});

describe('Utils.formatIDRFull', () => {
  it('should format with Rp prefix and locale separators', () => {
    expect(Utils.formatIDRFull(1000000)).toContain('Rp');
    expect(Utils.formatIDRFull(1000000)).toContain('1');
  });

  it('should return "Rp 0" for null/undefined', () => {
    expect(Utils.formatIDRFull(null)).toBe('Rp 0');
  });
});
