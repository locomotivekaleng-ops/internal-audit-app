import { describe, it, expect } from 'vitest';

await import('../../js/pages/dept-dashboard.js');

describe('DeptDashboardPage._sortByDueDate', () => {
  it('should sort actions by due date ascending', () => {
    const actions = [
      { id: '1', dueDate: '2024-03-15' },
      { id: '2', dueDate: '2024-01-10' },
      { id: '3', dueDate: '2024-06-20' },
    ];
    const result = DeptDashboardPage._sortByDueDate(actions);
    expect(result[0].id).toBe('2');
    expect(result[1].id).toBe('1');
    expect(result[2].id).toBe('3');
  });

  it('should place items without dueDate at the end', () => {
    const actions = [
      { id: '1', dueDate: '2024-03-15' },
      { id: '2', dueDate: null },
      { id: '3', dueDate: '2024-01-10' },
    ];
    const result = DeptDashboardPage._sortByDueDate(actions);
    expect(result[0].id).toBe('3');
    expect(result[1].id).toBe('1');
    expect(result[2].id).toBe('2');
  });

  it('should not mutate the original array', () => {
    const actions = [
      { id: '2', dueDate: '2024-03-15' },
      { id: '1', dueDate: '2024-01-10' },
    ];
    const original = [...actions];
    DeptDashboardPage._sortByDueDate(actions);
    expect(actions).toEqual(original);
  });
});

describe('DeptDashboardPage._sortByCompletionDate', () => {
  it('should sort by completion date descending', () => {
    const actions = [
      { id: '1', completionDate: '2024-03-15' },
      { id: '2', completionDate: '2024-01-10' },
      { id: '3', completionDate: '2024-06-20' },
    ];
    const result = DeptDashboardPage._sortByCompletionDate(actions);
    expect(result[0].id).toBe('3');
    expect(result[1].id).toBe('1');
    expect(result[2].id).toBe('2');
  });

  it('should place items without completionDate at the end', () => {
    const actions = [
      { id: '1', completionDate: '2024-03-15' },
      { id: '2', completionDate: null },
    ];
    const result = DeptDashboardPage._sortByCompletionDate(actions);
    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });

  it('should not mutate the original array', () => {
    const actions = [
      { id: '2', completionDate: '2024-03-15' },
      { id: '1', completionDate: '2024-01-10' },
    ];
    const original = [...actions];
    DeptDashboardPage._sortByCompletionDate(actions);
    expect(actions).toEqual(original);
  });
});
