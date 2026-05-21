import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCtx = {
  save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(),
  moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(), fill: vi.fn(),
  closePath: vi.fn(), arc: vi.fn(), rect: vi.fn(), fillRect: vi.fn(), roundRect: vi.fn(),
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

vi.mock('../theme.js', () => ({
  getThemeColor: vi.fn((key, fallback) => fallback || '#000'),
  getThemeFont: vi.fn(() => 'sans-serif'),
  getThemeIcon: vi.fn(() => 'arrow_upward')
}));

vi.mock('../utils/color.js', () => ({
  hexToRgb: vi.fn(() => ({ r: 100, g: 100, b: 100 }))
}));

vi.mock('../services/AqiManager.js', () => ({
  getAggregatedPollenLevel: vi.fn(() => 0),
  getPollenColor: vi.fn(() => '#000')
}));

describe('OverlayRenderer', () => {
  let mod;

  beforeEach(async () => {
    vi.clearAllMocks();
    mod = await import('./OverlayRenderer.js');
  });

  describe('getWeatherIconName', () => {
    it('returns clear_day for code 0', () => {
      expect(mod.getWeatherIconName(0)).toBe('clear_day');
    });

    it('returns cloud for codes 1-3', () => {
      expect(mod.getWeatherIconName(1)).toBe('cloud');
      expect(mod.getWeatherIconName(3)).toBe('cloud');
    });

    it('returns foggy for codes 45/48', () => {
      expect(mod.getWeatherIconName(45)).toBe('foggy');
      expect(mod.getWeatherIconName(48)).toBe('foggy');
    });

    it('returns rainy for rain codes', () => {
      expect(mod.getWeatherIconName(61)).toBe('rainy');
      expect(mod.getWeatherIconName(80)).toBe('rainy');
    });

    it('returns ac_unit for snow codes', () => {
      expect(mod.getWeatherIconName(71)).toBe('ac_unit');
      expect(mod.getWeatherIconName(85)).toBe('ac_unit');
    });

    it('returns thunderstorm for codes >=95', () => {
      expect(mod.getWeatherIconName(95)).toBe('thunderstorm');
      expect(mod.getWeatherIconName(99)).toBe('thunderstorm');
    });
  });

  describe('interpolateScrubberData', () => {
    const d1 = { temp: 10, apparent: 9, clouds: 50, precipProb: 20 };
    const d2 = { temp: 20, apparent: 18, clouds: 80, precipProb: 60 };

    it('interpolates temp linearly at progress 0', () => {
      const result = mod.interpolateScrubberData(d1, d2, 0);
      expect(result.temp).toBe(10);
    });

    it('interpolates temp linearly at progress 1', () => {
      const result = mod.interpolateScrubberData(d1, d2, 1);
      expect(result.temp).toBe(20);
    });

    it('interpolates temp linearly at progress 0.5', () => {
      const result = mod.interpolateScrubberData(d1, d2, 0.5);
      expect(result.temp).toBe(15);
    });

    it('bezier clouds at progress 0.5 is non-linear', () => {
      const result = mod.interpolateScrubberData(d1, d2, 0.5);
      expect(result.clouds).not.toBe(65);
    });
  });

  describe('drawScrubberPoint', () => {
    it('does not throw', () => {
      expect(() => mod.drawScrubberPoint(mockCtx, 100, '#ff0000', 15, '°', {
        drawX: 60, h: 200, w: 300,
        state: { labelRects: [] },
        labelRects: []
      })).not.toThrow();
    });

    it('returns early when y >= h - 5', () => {
      expect(() => mod.drawScrubberPoint(mockCtx, 300, '#ff0000', 15, '°', {
        drawX: 60, h: 200, w: 300,
        state: { labelRects: [] },
        labelRects: []
      })).not.toThrow();
    });
  });

  describe('updateWeatherZone', () => {
    it('does not throw when DOM elements are missing', () => {
      expect(() => mod.updateWeatherZone(
        { weatherCode: 0, gusts: 10, apparent: 20, precip: 0, clouds: 30, uv: 5, aqi: 50, isNight: false, pollenDetails: { alder: 0, birch: 0, grass: 0, mugwort: 0, olive: 0, ragweed: 0 } },
        { stickmanThresholds: { wind: 50 }, skinType: 2 },
        { haloColor: '#000', isDark: false, walkPhase: 0, scrollContainer: null, drawStickman: vi.fn(), PIXELS_PER_HOUR: 60 }
      )).not.toThrow();
    });
  });

  describe('updateUVBlock', () => {
    it('does not throw when DOM element is missing', () => {
      expect(() => mod.updateUVBlock(
        { uv: 5, isNight: false },
        0,
        null,
        60
      )).not.toThrow();
    });

    it('does not throw for night hours', () => {
      expect(() => mod.updateUVBlock(
        { uv: 5, isNight: true },
        0,
        null,
        60
      )).not.toThrow();
    });
  });
});
