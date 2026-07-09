import { vi } from 'vitest';

// Mock lucide
global.window.lucide = { createIcons: vi.fn() };

// Mock Chart.js
global.window.Chart = class Chart {
  constructor() { this.destroy = vi.fn(); }
  static register() {}
};
global.window.Chart.register = vi.fn();

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
