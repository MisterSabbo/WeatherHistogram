import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../store.js', () => ({
  state: { theme: 'light', hourlyData: [{ time: 1000, temp: 15, apparent: 13, wind: 10, windDir: 180, clouds: 50, precip: 0, precipProb: 0, aqi: 30, aqiDetails: null, pollen: 2, pollenDetails: null, weatherCode: 0, localHour: 12, isNight: false }], timezone: 'UTC' },
  CONFIG: {}
}));

vi.mock('../utils/i18n.js', () => ({
  t: vi.fn((k) => {
    const map = { 'pollen.alder': 'Aliso', 'pollen.birch': 'Abedul', 'pollen.grass': 'Gramíneas', 'pollen.mugwort': 'Artemisa', 'pollen.olive': 'Olivo', 'pollen.ragweed': 'Ambrosía', 'pollen.noData': 'S/D', 'aqi.title': 'Air Quality', 'topPanel.today': 'TODAY', 'map.noFavorites': 'No favorites' };
    return map[k] || k;
  }),
  getLocale: vi.fn(() => 'es-ES')
}));

vi.mock('../theme.js', () => ({
  getThemeIcon: vi.fn((key, fallback) => {
    const map = { 'dailyCards.clear': 'clear_day', 'dailyCards.cloudy': 'cloud', 'dailyCards.fog': 'foggy', 'dailyCards.rain': 'rainy', 'dailyCards.snow': 'ac_unit', 'dailyCards.thunderstorm': 'thunderstorm' };
    return map[key] || fallback || 'clear_day';
  })
}));

vi.mock('../utils/time.js', () => ({
  formatTooltipTime: vi.fn(() => ({ timeStr: '12:00', dateStr: '14/11', isToday: true }))
}));

vi.mock('../utils/weather.js', () => ({
  getWeatherDescription: vi.fn(() => 'Clear')
}));

vi.mock('../services/AqiManager.js', () => ({
  getAQIInfo: vi.fn(() => ({ text: 'Good', rec: '', val: 30 })),
  getPollenText: vi.fn(() => 'Low'),
  getAggregatedPollenLevel: vi.fn(() => 0),
  getPollenColor: vi.fn(() => '#000')
}));

vi.mock('../utils/AlertEngine.js', () => ({
  generateAlerts: vi.fn(() => ({ alerts: [], alertLevel: 0 })),
  renderAlerts: vi.fn()
}));

vi.mock('./AqiRadar.js', () => ({
  drawAQIRadar: vi.fn()
}));

vi.mock('./PollenRadar.js', () => ({
  drawPollenRadar: vi.fn()
}));

describe('AqiRadar', () => {
  let drawAQIRadar;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./AqiRadar.js');
    drawAQIRadar = mod.drawAQIRadar;
  });

  it('does not throw when canvas does not exist', () => {
    expect(() => drawAQIRadar({ aqiDetails: { pm10: 10, pm2_5: 5, ozone: 50, nitrogen_dioxide: 20 } })).not.toThrow();
  });

  it('returns early when no aqiDetails', () => {
    expect(() => drawAQIRadar({})).not.toThrow();
  });

  it('returns early when canvas exists but no aqiDetails', () => {
    document.body.innerHTML = '<canvas id="aqi-radar" width="200" height="200"></canvas>';
    expect(() => drawAQIRadar({})).not.toThrow();
  });

  it('draws on canvas when elements exist', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'aqi-radar';
    canvas.width = 200;
    canvas.height = 200;
    document.body.appendChild(canvas);

    const ctx = {
      clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
      closePath: vi.fn(), stroke: vi.fn(), fill: vi.fn(), arc: vi.fn(),
      measureText: vi.fn(() => ({ width: 10 })),
      fillText: vi.fn(), save: vi.fn(), restore: vi.fn(),
      font: '', fillStyle: '', strokeStyle: '', lineWidth: 1,
      textAlign: 'start', textBaseline: 'alphabetic',
      shadowColor: '', shadowBlur: 0
    };
    canvas.getContext = vi.fn(() => ctx);

    expect(() => drawAQIRadar({
      aqiDetails: { pm10: 10, pm2_5: 5, ozone: 50, nitrogen_dioxide: 20 }
    })).not.toThrow();

    document.body.removeChild(canvas);
  });
});

describe('PollenRadar', () => {
  let drawPollenRadar;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./PollenRadar.js');
    drawPollenRadar = mod.drawPollenRadar;
  });

  it('does not throw when canvas does not exist', () => {
    expect(() => drawPollenRadar({ pollenDetails: { alder: 10, birch: 5, grass: 15, mugwort: 3, olive: 8, ragweed: 2 } })).not.toThrow();
  });

  it('returns early when no pollenDetails', () => {
    expect(() => drawPollenRadar({})).not.toThrow();
  });

  it('draws on canvas when elements exist', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'pollen-radar';
    canvas.width = 200;
    canvas.height = 200;
    document.body.appendChild(canvas);

    const ctx = {
      clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
      closePath: vi.fn(), stroke: vi.fn(), fill: vi.fn(), arc: vi.fn(),
      measureText: vi.fn(() => ({ width: 10 })),
      fillText: vi.fn(), save: vi.fn(), restore: vi.fn(),
      font: '', fillStyle: '', strokeStyle: '', lineWidth: 1,
      textAlign: 'start', textBaseline: 'alphabetic',
      shadowColor: '', shadowBlur: 0
    };
    canvas.getContext = vi.fn(() => ctx);

    expect(() => drawPollenRadar({
      pollenDetails: { alder: 10, birch: 5, grass: 15, mugwort: 3, olive: 8, ragweed: 2 }
    })).not.toThrow();

    document.body.removeChild(canvas);
  });
});

describe('TopPanel', () => {
  let updateTopPanel;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./TopPanel.js');
    updateTopPanel = mod.updateTopPanel;
  });

  it('does not throw with mock data and scrollContainer', () => {
    const origGetElementById = document.getElementById.bind(document);
    const origQuerySelector = document.querySelector.bind(document);
    try {
      const scrollContainer = { scrollLeft: 0 };
      const elements = {};
      ['val-temp', 'val-apparent', 'weather-summary', 'current-time-display', 'tt-location', 'tt-summary',
       'val-wind', 'wind-arrow', 'wind-compass', 'val-aqi', 'header-aqi-icon', 'aqi-header-info',
       'aqi-modal-header-info', 'aqi-radar', 'aqi-modal-radar', 'val-pollen', 'header-pollen-icon',
       'pollen-radar', 'pollen-modal-radar', 'val-precip', 'val-precip-prob', 'val-clouds',
       'updateScrollIndicator'
      ].forEach(id => {
        elements[id] = { innerHTML: '', innerText: '', style: {}, querySelector: vi.fn(() => ({ innerText: '' })), dataset: {}, firstElementChild: { style: {} } };
      });
      document.getElementById = vi.fn((id) => elements[id] || null);
      document.querySelector = vi.fn(() => ({ innerText: '' }));
      window.updateScrollIndicator = vi.fn();
      expect(() => updateTopPanel({ scrollContainer, PIXELS_PER_HOUR: 60 })).not.toThrow();
    } finally {
      document.getElementById = origGetElementById;
      document.querySelector = origQuerySelector;
    }
  });
});

describe('FavoritesModal', () => {
  let initFavoritesModal;

  beforeEach(async () => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="favorites-modal"><button id="close-favorites-btn">X</button><div id="favorites-list"></div></div>';
    const mod = await import('./FavoritesModal.js');
    initFavoritesModal = mod.initFavoritesModal;
  });

  it('does not throw when DOM elements are missing', () => {
    expect(() => initFavoritesModal(vi.fn())).not.toThrow();
  });
});

describe('YearInPixels', () => {
  let initYearInPixels;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./YearInPixels.js');
    initYearInPixels = mod.initYearInPixels;
  });

  it('does not throw when DOM elements are missing', () => {
    expect(() => initYearInPixels()).not.toThrow();
  });
});

describe('DailyCards', () => {
  let mod;

  beforeEach(async () => {
    vi.clearAllMocks();
    mod = await import('./DailyCards.js');
  });

  describe('getWeatherIconSVG', () => {
    it('returns clear_day for code 0', () => {
      const svg = mod.getWeatherIconSVG(0);
      expect(svg).toContain('clear_day');
    });

    it('returns cloud for codes 1-3', () => {
      expect(mod.getWeatherIconSVG(1)).toContain('cloud');
      expect(mod.getWeatherIconSVG(3)).toContain('cloud');
    });

    it('returns foggy for codes 45/48', () => {
      expect(mod.getWeatherIconSVG(45)).toContain('foggy');
    });

    it('returns rainy for rain codes', () => {
      expect(mod.getWeatherIconSVG(61)).toContain('rainy');
    });

    it('returns ac_unit for snow codes', () => {
      expect(mod.getWeatherIconSVG(71)).toContain('ac_unit');
    });

    it('returns thunderstorm for codes >=95', () => {
      expect(mod.getWeatherIconSVG(95)).toContain('thunderstorm');
    });
  });

  describe('generateDailyCards', () => {
    it('does not throw when container is missing', () => {
      expect(() => mod.generateDailyCards(vi.fn())).not.toThrow();
    });
  });

  describe('updateActiveDailyCard', () => {
    it('does not throw when containers are missing', () => {
      expect(() => mod.updateActiveDailyCard()).not.toThrow();
    });
  });
});
