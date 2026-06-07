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

const hourlyEntry = (overrides = {}) => ({
  time: 1700000000000, temp: 15, apparent: 13, precip: 0, precipProb: 0,
  clouds: 50, wind: 10, gusts: 15, windDir: 180, humidity: 60,
  pressure: 1013, uv: 5, visibility: 10000, weatherCode: 0, aqi: 30,
  pollen: 2, isNight: false, localHour: 12, localDayName: 'LUNES',
  localDayShort: 'LUN',
  pollenDetails: { alder: 0, birch: 0, grass: 0, mugwort: 0, olive: 0, ragweed: 0 },
  ...overrides
});

const mockState = {
  hourlyData: [hourlyEntry({ time: 1700000000000, precip: 0.5, precipProb: 30, localHour: 12 }),
               hourlyEntry({ time: 1700003600000, precip: 0, precipProb: 10, clouds: 30, localHour: 13 }),
               hourlyEntry({ time: 1700007200000, precip: 0.8, precipProb: 60, clouds: 70, isNight: true, localHour: 14, weatherCode: 61 })],
  timezone: 'UTC',
  sunData: { '2024-11-14': { sunrise: 1699999200000, sunset: 1700038800000 } },
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
      daySky: '#fff2c0',
      daySun: '#FDD835',
      daySunRay: '#FFF59D',
      nightFill: '#1A2744',
      nightTransitionMid: '#FFDDBA',
      nightShadowColor: 'rgba(26, 39, 68, 0.15)',
      nightShadowColorTransparent: 'rgba(26, 39, 68, 0)',
      precipProbRain: { r: 30, g: 144, b: 200 },
      precipProbSnow: { r: 200, g: 215, b: 230 },
      precipProbThunder: { r: 100, g: 80, b: 160 },
      'cloudFill.light': { r: 185, g: 180, b: 175, a: 0.40 },
      'cloudFill.medium': { r: 155, g: 150, b: 145, a: 0.50 },
      'cloudFill.heavy': { r: 125, g: 120, b: 115, a: 0.60 },
      'cloudStroke.light': { r: 170, g: 165, b: 160 },
      'cloudStroke.medium': { r: 145, g: 140, b: 135 },
      'cloudStroke.heavy': { r: 115, g: 110, b: 105 },
      cloudLayers: [
        { offset: 5, width: 4, color: 'rgba(195, 188, 182, 0.3)' },
        { offset: 12, width: 8, color: 'rgba(185, 180, 175, 0.2)' },
        { offset: 25, width: 15, color: 'rgba(170, 165, 160, 0.1)' },
        { offset: 45, width: 22, color: 'rgba(155, 150, 145, 0.05)' },
        { offset: 65, width: 30, color: 'rgba(155, 150, 145, 0.03)' }
      ]
    };
    return defaults[key] || '';
  })
}));

vi.mock('../utils/math.js', () => ({
  normalizeY: vi.fn((val) => 200 - val * 4)
}));

vi.mock('../utils/time.js', () => ({
  formatHour: vi.fn((h) => `${h}:00`)
}));

vi.mock('../utils/i18n.js', () => ({
  getLocale: vi.fn(() => 'es-ES')
}));

vi.mock('./MoonRenderer.js', () => ({
  drawMoon: vi.fn()
}));

vi.mock('./SunMarkers.js', () => ({
  drawSunMarkersOnCanvas: vi.fn()
}));

vi.mock('./CloudRenderer.js', () => ({
  drawClouds: vi.fn()
}));

vi.mock('./PrecipProbabilityRenderer.js', () => ({
  drawPrecipitationProbability: vi.fn()
}));

vi.mock('../services/AqiManager.js', () => ({
  getAggregatedPollenLevel: vi.fn(() => 0),
  getPollenColor: vi.fn(() => '#000')
}));

describe('AtmosphereRenderer', () => {
  let drawPrecipitation;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./AtmosphereRenderer.js');
    drawPrecipitation = mod.drawPrecipitation;
  });

  it('drawPrecipitation does not throw', () => {
    expect(() => drawPrecipitation(mockCtx, 0, 200, 200, {}, 60, 2)).not.toThrow();
  });

  it('re-exports drawClouds and drawPrecipitationProbability', async () => {
    const mod = await import('./AtmosphereRenderer.js');
    expect(mod.drawClouds).toBeInstanceOf(Function);
    expect(mod.drawPrecipitationProbability).toBeInstanceOf(Function);
  });
});

describe('CloudRenderer', () => {
  let drawClouds;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./CloudRenderer.js');
    drawClouds = mod.drawClouds;
  });

  it('drawClouds does not throw', () => {
    expect(() => drawClouds(mockCtx, 0, 200, 200, {}, 60)).not.toThrow();
  });
});

describe('MoonRenderer', () => {
  it('drawMoon does not throw', async () => {
    const { drawMoon } = await import('./MoonRenderer.js');
    expect(() => drawMoon(mockCtx, 100, 100, '#fff', '#90caf9')).not.toThrow();
  });
});

describe('PrecipProbabilityRenderer', () => {
  let drawPrecipitationProbability;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./PrecipProbabilityRenderer.js');
    drawPrecipitationProbability = mod.drawPrecipitationProbability;
  });

  it('does not throw', () => {
    expect(() => drawPrecipitationProbability(mockCtx, 0, 200, 200, {}, 60)).not.toThrow();
  });
});

describe('MetricsRenderer', () => {
  it('re-exports drawWind, drawTemperature', async () => {
    const mod = await import('./MetricsRenderer.js');
    expect(mod.drawWind).toBeInstanceOf(Function);
    expect(mod.drawTemperature).toBeInstanceOf(Function);
  });
});

describe('BackgroundRenderer', () => {
  let mod;

  beforeEach(async () => {
    vi.clearAllMocks();
    mod = await import('./BackgroundRenderer.js');
  });

  it('drawWeatherPhenomena does not throw', () => {
    expect(() => mod.drawWeatherPhenomena(mockCtx, 0, 200, 200, 60)).not.toThrow();
  });

  it('drawStarrySky does not throw', () => {
    expect(() => mod.drawStarrySky(mockCtx, 0, 200, 200, 60)).not.toThrow();
  });

  it('drawUVSegments does not throw', () => {
    expect(() => mod.drawUVSegments(mockCtx, 0, 200, 200, 60)).not.toThrow();
  });

  it('drawNightOverlay does not throw', () => {
    expect(() => mod.drawNightOverlay(mockCtx, 0, 200, 200, 60)).not.toThrow();
  });

  it('drawSunnyBackground does not throw', () => {
    expect(() => mod.drawSunnyBackground(mockCtx, 0, 200, 200, {}, false, 60)).not.toThrow();
  });

  it('drawNightShadow does not throw', () => {
    expect(() => mod.drawNightShadow(mockCtx, 0, 200, 200, 60)).not.toThrow();
  });

  it('re-exports drawSunMarkersOnCanvas', () => {
    expect(mod.drawSunMarkersOnCanvas).toBeInstanceOf(Function);
  });
});

describe('GridRenderer', () => {
  let mod;

  beforeEach(async () => {
    vi.clearAllMocks();
    mod = await import('./GridRenderer.js');
  });

  it('drawGrid does not throw', () => {
    expect(() => mod.drawGrid(mockCtx, 0, 200, 200)).not.toThrow();
  });

  it('drawDayNames does not throw', () => {
    expect(() => mod.drawDayNames(mockCtx, 0, 200, 200, {}, 60)).not.toThrow();
  });

  it('drawAxes does not throw', () => {
    expect(() => mod.drawAxes(mockCtx, 0, 200, 200, {}, 60, 200)).not.toThrow();
  });
});

describe('SunMarkers', () => {
  let drawSunMarkersOnCanvas;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./SunMarkers.js');
    drawSunMarkersOnCanvas = mod.drawSunMarkersOnCanvas;
  });

  it('does not throw', () => {
    expect(() => drawSunMarkersOnCanvas(mockCtx, 0, 200, 200, 60)).not.toThrow();
  });
});
