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

const mockState = {
  hourlyData: [
    { time: 1700000000000, temp: 15, apparent: 13, precip: 0, precipProb: 0, clouds: 50, wind: 10, gusts: 15, windDir: 180, humidity: 60, pressure: 1013, uv: 5, visibility: 10000, weatherCode: 0, aqi: 30, pollen: 2, isNight: false, localHour: 12, localDayName: 'LUNES', localDayShort: 'LUN', pollenDetails: { alder: 0, birch: 0, grass: 0, mugwort: 0, olive: 0, ragweed: 0 } },
    { time: 1700003600000, temp: 17, apparent: 15, precip: 0, precipProb: 10, clouds: 30, wind: 8, gusts: 12, windDir: 90, humidity: 55, pressure: 1012, uv: 6, visibility: 10000, weatherCode: 1, aqi: 25, pollen: 1, isNight: false, localHour: 13, localDayName: 'LUNES', localDayShort: 'LUN', pollenDetails: { alder: 0, birch: 0, grass: 0, mugwort: 0, olive: 0, ragweed: 0 } },
    { time: 1700007200000, temp: 19, apparent: 18, precip: 0.8, precipProb: 60, clouds: 70, wind: 12, gusts: 40, windDir: 270, humidity: 65, pressure: 1010, uv: 3, visibility: 8000, weatherCode: 61, aqi: 35, pollen: 3, isNight: true, localHour: 14, localDayName: 'LUNES', localDayShort: 'LUN', pollenDetails: { alder: 0, birch: 0, grass: 0, mugwort: 0, olive: 0, ragweed: 0 } }
  ],
  theme: 'light'
};

vi.mock('../../store.js', () => ({
  state: mockState
}));

vi.mock('../../theme.js', () => ({
  getThemeColor: vi.fn((key, fallback) => fallback || '#000'),
  getThemeFont: vi.fn(() => 'sans-serif'),
  getThemeIcon: vi.fn(() => null)
}));

vi.mock('../../utils/math.js', () => ({
  normalizeY: vi.fn((val) => 200 - val * 4)
}));

describe('TemperatureRenderer', () => {
  let drawTemperature;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./TemperatureRenderer.js');
    drawTemperature = mod.drawTemperature;
  });

  it('does not throw', () => {
    expect(() => drawTemperature(mockCtx, 0, 200, 200, {}, 60)).not.toThrow();
  });
});

describe('WindRenderer', () => {
  let drawWind;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./WindRenderer.js');
    drawWind = mod.drawWind;
  });

  it('does not throw', () => {
    expect(() => drawWind(mockCtx, 0, 200, 200, {}, 60)).not.toThrow();
  });

  it('only renders for localHour % 3 === 0', () => {
    drawWind(mockCtx, 0, 200, 200, {}, 60);
    // localHours: 12, 13, 14 - only 12 % 3 === 0
    expect(mockCtx.translate).toHaveBeenCalledTimes(1);
  });
});
