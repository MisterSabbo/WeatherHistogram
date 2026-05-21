import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCtx = {
  save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(),
  moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), fill: vi.fn(),
  closePath: vi.fn(), arc: vi.fn(), rect: vi.fn(), fillRect: vi.fn(),
  fillText: vi.fn(), strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  clip: vi.fn(), quadraticCurveTo: vi.fn(), bezierCurveTo: vi.fn(),
  setLineDash: vi.fn(), translate: vi.fn(), rotate: vi.fn(),
  font: '', fillStyle: '', strokeStyle: '', lineWidth: 1,
  lineCap: 'butt', lineJoin: 'miter',
  shadowColor: '', shadowBlur: 0, shadowOffsetX: 0, shadowOffsetY: 0,
  globalAlpha: 1, textAlign: 'start', textBaseline: 'alphabetic'
};

describe('StickmanRenderer', () => {
  let drawStickman;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./StickmanRenderer.js');
    drawStickman = mod.drawStickman;
  });

  const defaults = {
    walkPhase: 0,
    apparentTemp: 20,
    precCode: 0,
    isWindy: false,
    isDarkTheme: false,
    isNight: false,
    thresholds: { hot: 30, cold: 5, wind: 50, clouds: 50 },
    precipAmt: 0,
    clouds: 30
  };

  it('does not throw with default params', () => {
    expect(() => drawStickman(
      mockCtx, 40, 80, defaults.walkPhase, defaults.apparentTemp, defaults.precCode,
      defaults.isWindy, defaults.isDarkTheme, defaults.isNight,
      defaults.thresholds, defaults.precipAmt, defaults.clouds
    )).not.toThrow();
  });

  it('handles hot weather reaction', () => {
    expect(() => drawStickman(
      mockCtx, 40, 80, 0, 35, 0, false, false, false,
      defaults.thresholds, 0, 30
    )).not.toThrow();
  });

  it('handles cold weather reaction', () => {
    expect(() => drawStickman(
      mockCtx, 40, 80, 0, 0, 0, false, false, false,
      defaults.thresholds, 0, 30
    )).not.toThrow();
  });

  it('handles rain', () => {
    expect(() => drawStickman(
      mockCtx, 40, 80, 0, 20, 61, false, false, false,
      defaults.thresholds, 5, 30
    )).not.toThrow();
  });

  it('handles snow', () => {
    expect(() => drawStickman(
      mockCtx, 40, 80, 0, 20, 71, false, false, false,
      defaults.thresholds, 5, 30
    )).not.toThrow();
  });

  it('handles wind', () => {
    expect(() => drawStickman(
      mockCtx, 40, 80, 0, 20, 0, true, false, false,
      defaults.thresholds, 0, 30
    )).not.toThrow();
  });

  it('handles night', () => {
    expect(() => drawStickman(
      mockCtx, 40, 80, 0, 20, 0, false, false, true,
      defaults.thresholds, 0, 30
    )).not.toThrow();
  });

  it('handles sunny day (sunglasses)', () => {
    expect(() => drawStickman(
      mockCtx, 40, 80, 0, 20, 0, false, false, false,
      defaults.thresholds, 0, 30
    )).not.toThrow();
  });

  it('handles dark theme', () => {
    expect(() => drawStickman(
      mockCtx, 40, 80, 0, 20, 0, false, true, false,
      defaults.thresholds, 0, 30
    )).not.toThrow();
  });

  it('handles thunderstorm', () => {
    expect(() => drawStickman(
      mockCtx, 40, 80, 0, 20, 95, false, false, false,
      defaults.thresholds, 10, 80
    )).not.toThrow();
  });
});
