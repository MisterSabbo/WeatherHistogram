import { describe, it, expect } from 'vitest';
import { normalizeY } from './math.js';

describe('normalizeY', () => {
  it('returns bottom of range with padding for min value', () => {
    expect(normalizeY(0, 0, 100, 200)).toBe(180);
  });

  it('returns top of range with padding for max value', () => {
    expect(normalizeY(100, 0, 100, 200)).toBe(20);
  });

  it('returns middle value correctly', () => {
    expect(normalizeY(50, 0, 100, 200)).toBe(100);
  });

  it('extends beyond range for values below min', () => {
    expect(normalizeY(-50, 0, 100, 200)).toBe(260);
  });

  it('extends beyond range for values above max', () => {
    expect(normalizeY(150, 0, 100, 200)).toBe(-60);
  });
});
