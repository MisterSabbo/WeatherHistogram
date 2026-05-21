import { describe, it, expect } from 'vitest';
import { getYLimits } from './thresholds.js';

describe('getYLimits', () => {
  it('returns default limits for empty data', () => {
    const result = getYLimits([], 'temp');
    expect(result).toEqual({ min: -20, max: 40, step: 10 });
  });

  it('returns default limits when all values are null', () => {
    const result = getYLimits([{ temp: null }, { temp: null }], 'temp');
    expect(result).toEqual({ min: -20, max: 40, step: 10 });
  });

  it('calculates temp limits with rounding', () => {
    const result = getYLimits([{ temp: 10 }, { temp: 20 }, { temp: 30 }], 'temp');
    expect(result.min).toBeLessThanOrEqual(10);
    expect(result.max).toBeGreaterThanOrEqual(30);
    expect(result.step).toBe(10);
  });

  it('returns correct humidity defaults', () => {
    const result = getYLimits([], 'humidity');
    expect(result).toEqual({ min: 0, max: 100, step: 20 });
  });

  it('returns correct wind defaults', () => {
    const result = getYLimits([], 'wind');
    expect(result).toEqual({ min: 0, max: 100, step: 20 });
  });

  it('returns correct uv defaults', () => {
    const result = getYLimits([], 'uv');
    expect(result).toEqual({ min: 0, max: 11, step: 3 });
  });

  it('returns default limits for unknown metric', () => {
    const result = getYLimits([], 'unknown');
    expect(result).toEqual({ min: 0, max: 100, step: 10 });
  });

  it('handles wind data with rounding to 20', () => {
    const result = getYLimits([{ wind: 5 }, { wind: 15 }], 'wind');
    expect(result.step).toBe(20);
    expect(result.max % 20).toBe(0);
  });

  it('ensures UV max is at least 11', () => {
    const result = getYLimits([{ uv: 1 }, { uv: 3 }], 'uv');
    expect(result.max).toBeGreaterThanOrEqual(11);
  });

  it('handles single value (range = 0)', () => {
    const result = getYLimits([{ temp: 25 }], 'temp');
    expect(result.min).toBeLessThan(25);
    expect(result.max).toBeGreaterThan(25);
  });
});
