import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCtx = {
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  closePath: vi.fn(),
  arc: vi.fn(),
  rect: vi.fn(),
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  clip: vi.fn(),
  quadraticCurveTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  setLineDash: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  font: '',
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  shadowColor: '',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  globalAlpha: 1,
  textAlign: 'start',
  textBaseline: 'alphabetic'
};

const mockState = {
  hourlyData: [
    { time: 1700000000000, temp: 15, apparent: 13, precip: 0.5, precipProb: 30, clouds: 50, wind: 10, gusts: 15, windDir: 180, humidity: 60, pressure: 1013, uv: 5, visibility: 10000, weatherCode: 0, aqi: 30, pollen: 2, isNight: false, localHour: 12, localDayName: 'LUNES', localDayShort: 'LUN', pollenDetails: { alder: 0, birch: 0, grass: 0, mugwort: 0, olive: 0, ragweed: 0 } },
    { time: 1700003600000, temp: 17, apparent: 15, precip: 0, precipProb: 10, clouds: 30, wind: 8, gusts: 12, windDir: 90, humidity: 55, pressure: 1012, uv: 6, visibility: 10000, weatherCode: 1, aqi: 25, pollen: 1, isNight: false, localHour: 13, localDayName: 'LUNES', localDayShort: 'LUN', pollenDetails: { alder: 0, birch: 0, grass: 0, mugwort: 0, olive: 0, ragweed: 0 } },
    { time: 1700007200000, temp: 19, apparent: 18, precip: 0.8, precipProb: 60, clouds: 70, wind: 12, gusts: 40, windDir: 270, humidity: 65, pressure: 1010, uv: 3, visibility: 8000, weatherCode: 61, aqi: 35, pollen: 3, isNight: true, localHour: 14, localDayName: 'LUNES', localDayShort: 'LUN', pollenDetails: { alder: 0, birch: 0, grass: 0, mugwort: 0, olive: 0, ragweed: 0 } }
  ],
  timezone: 'UTC',
  sunData: {
    '2024-11-14': { sunrise: 1699999200000, sunset: 1700038800000 }
  },
  theme: 'light'
};

vi.mock('../store.js', () => ({
  state: mockState
}));

vi.mock('../theme.js', () => ({
  getThemeColor: vi.fn((key, fallback) => fallback || '#000'),
  getThemeFont: vi.fn(() => 'sans-serif'),
  getThemeIcon: vi.fn(() => null)
}));

vi.mock('../utils/color.js', () => ({
  hexToRgb: vi.fn(() => ({ r: 0, g: 0, b: 0 }))
}));

vi.mock('../data/atmosphericPalettes.js', () => ({
  getAtmosphericColor: vi.fn((key) => {
    const defaults = {
      rainBar: 'rgba(30, 130, 190, 0.45)',
      rainStroke: 'rgba(30, 130, 190, 0.80)',
      rainShadow: 'rgba(30, 130, 190, 0.4)',
      snowBar: 'rgba(180, 200, 220, 0.40)',
      snowStroke: 'rgba(180, 200, 220, 0.80)',
      snowFlake: 'rgba(100, 130, 160, 0.8)',
      snowShadow: 'rgba(200, 215, 230, 0.8)',
      thunderBar: 'rgba(80, 70, 150, 0.40)',
      thunderStroke: 'rgba(80, 70, 150, 0.80)',
      thunderBolt: '#FDE047',
      thunderBoltShadow: 'rgba(253, 224, 71, 0.8)',
    };
    return defaults[key] || '';
  })
}));

describe('render/AtmosphereRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exports drawClouds and drawPrecipitationProbability as re-exports', async () => {
    const mod = await import('./AtmosphereRenderer.js');
    expect(mod.drawClouds).toBeInstanceOf(Function);
    expect(mod.drawPrecipitationProbability).toBeInstanceOf(Function);
  });

  it('drawPrecipitation does not throw', async () => {
    const { drawPrecipitation } = await import('./AtmosphereRenderer.js');
    expect(() => drawPrecipitation(mockCtx, 0, 100, 200, {}, 60, 2)).not.toThrow();
  });

  it('drawPrecipitation handles empty data', async () => {
    vi.mocked((await import('../store.js')).state).hourlyData = [];

    await vi.resetModules();

    const emptyModState = { hourlyData: [], theme: 'light' };
    vi.doMock('../store.js', () => ({ state: emptyModState }));

    const { drawPrecipitation } = await import('./AtmosphereRenderer.js');
    expect(() => drawPrecipitation(mockCtx, 0, 100, 200, {}, 60, 2)).not.toThrow();
  });
});

describe('render/CloudRenderer', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('drawClouds does not throw', async () => {
    const { drawClouds } = await import('./CloudRenderer.js');
    expect(() => drawClouds(mockCtx, 0, 200, 200, {}, 60)).not.toThrow();
  });

  it('drawClouds returns early with <2 points', async () => {
    const emptyModState = { hourlyData: [{ time: 1, clouds: 50, temp: 15, isNight: false, localHour: 12, localDayName: 'LUN', localDayShort: 'L' }], theme: 'light' };
    vi.doMock('../store.js', () => ({ state: emptyModState }));
    await vi.resetModules();
    const { drawClouds } = await import('./CloudRenderer.js');
    expect(() => drawClouds(mockCtx, 0, 200, 200, {}, 60)).not.toThrow();
  });
});

describe('render/MoonRenderer', () => {
  it('drawMoon does not throw', async () => {
    const { drawMoon } = await import('./MoonRenderer.js');
    expect(() => drawMoon(mockCtx, 100, 100, '#fff', '#90caf9')).not.toThrow();
  });
});

describe('render/PrecipProbabilityRenderer', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('drawPrecipitationProbability does not throw with data', async () => {
    const { drawPrecipitationProbability } = await import('./PrecipProbabilityRenderer.js');
    expect(() => drawPrecipitationProbability(mockCtx, 0, 200, 200, {}, 60)).not.toThrow();
  });

  it('drawPrecipitationProbability handles zero probability', async () => {
    const zeroState = {
      hourlyData: [
        { time: 1, precipProb: 0, clouds: 0, weatherCode: 0, isNight: false, localHour: 0, temp: 15, apparent: 15, precip: 0, wind: 0, gusts: 0, windDir: 0, humidity: 50, pressure: 1013, uv: 0, visibility: 10000, aqi: 0, pollen: 0, localDayName: 'L', localDayShort: 'L', pollenDetails: { alder: 0, birch: 0, grass: 0, mugwort: 0, olive: 0, ragweed: 0 } },
        { time: 2, precipProb: 0, clouds: 0, weatherCode: 0, isNight: false, localHour: 1, temp: 15, apparent: 15, precip: 0, wind: 0, gusts: 0, windDir: 0, humidity: 50, pressure: 1013, uv: 0, visibility: 10000, aqi: 0, pollen: 0, localDayName: 'L', localDayShort: 'L', pollenDetails: { alder: 0, birch: 0, grass: 0, mugwort: 0, olive: 0, ragweed: 0 } }
      ],
      theme: 'light'
    };
    vi.doMock('../store.js', () => ({ state: zeroState }));
    await vi.resetModules();
    const { drawPrecipitationProbability } = await import('./PrecipProbabilityRenderer.js');
    expect(() => drawPrecipitationProbability(mockCtx, 0, 200, 200, {}, 60)).not.toThrow();
  });
});

describe('render/MetricsRenderer', () => {
  it('re-exports drawWind, drawTemperature', async () => {
    const mod = await import('./MetricsRenderer.js');
    expect(mod.drawWind).toBeInstanceOf(Function);
    expect(mod.drawTemperature).toBeInstanceOf(Function);
  });
});
