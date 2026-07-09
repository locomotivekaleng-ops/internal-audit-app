import { describe, it, expect } from 'vitest';

await import('../../js/pages/closing-analysis.js');

describe('ClosingAnalysisPage.getClosingDays', () => {
  it('should return 0 when action has no createdAt', () => {
    expect(ClosingAnalysisPage.getClosingDays({ completionDate: '2024-03-15' })).toBe(0);
  });

  it('should return 0 when action has no completionDate', () => {
    expect(ClosingAnalysisPage.getClosingDays({ createdAt: '2024-01-01' })).toBe(0);
  });

  it('should return 0 when both dates are missing', () => {
    expect(ClosingAnalysisPage.getClosingDays({})).toBe(0);
  });

  it('should calculate days between createdAt and completionDate', () => {
    const result = ClosingAnalysisPage.getClosingDays({
      createdAt: '2024-01-01',
      completionDate: '2024-01-10'
    });
    expect(result).toBe(9);
  });

  it('should return 0 for same-day completion', () => {
    const result = ClosingAnalysisPage.getClosingDays({
      createdAt: '2024-06-15',
      completionDate: '2024-06-15'
    });
    expect(result).toBe(0);
  });

  it('should calculate cross-month duration', () => {
    const result = ClosingAnalysisPage.getClosingDays({
      createdAt: '2024-01-15',
      completionDate: '2024-02-20'
    });
    expect(result).toBe(36);
  });

  it('should handle ISO datetime strings', () => {
    const result = ClosingAnalysisPage.getClosingDays({
      createdAt: '2024-01-01T08:00:00Z',
      completionDate: '2024-01-15T16:30:00Z'
    });
    expect(result).toBe(14);
  });

  it('should never return negative days', () => {
    const result = ClosingAnalysisPage.getClosingDays({
      createdAt: '2024-03-01',
      completionDate: '2024-02-01'
    });
    expect(result).toBe(0);
  });
});
