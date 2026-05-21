import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockState = {
  timezone: null,
  sunData: {},
  dailyData: [],
  hourlyData: [],
  locationName: 'TestCity'
};

vi.mock('../store.js', () => ({
  state: mockState
}));

vi.mock('../utils/i18n.js', () => ({
  getLocale: vi.fn(() => 'es-ES')
}));

const mockGenerateDailyCards = vi.fn();
vi.mock('../ui/DailyCards.js', () => ({
  generateDailyCards: mockGenerateDailyCards
}));

const mockStorage = {
  getHistory: vi.fn(),
  setHistory: vi.fn()
};
vi.mock('./StorageService.js', () => ({
  storageService: mockStorage
}));

let processData; let state;

beforeEach(async () => {
  vi.clearAllMocks();
  mockState.timezone = null;
  mockState.sunData = {};
  mockState.dailyData = [];
  mockState.hourlyData = [];
  mockStorage.getHistory.mockResolvedValue({ hourly: [], daily: [] });
  mockStorage.setHistory.mockResolvedValue();
  const mod = await import('./DataProcessor.js');
  processData = mod.processData;
  const storeMod = await import('../store.js');
  state = storeMod.state;
});

describe('DataProcessor', () => {
  it('throws when forecastData has no hourly', () => {
    expect(() => processData({}, { hourly: { time: [] } }, vi.fn())).toThrow('Datos de API incompletos');
    expect(() => processData(null, { hourly: { time: [] } }, vi.fn())).toThrow('Datos de API incompletos');
  });

  it('throws when aqiData has no hourly', () => {
    const forecast = { hourly: { time: [1000] }, daily: { time: [1000] } };
    expect(() => processData(forecast, {}, vi.fn())).toThrow('Datos de API incompletos');
  });

  it('processes valid data and populates hourlyData', () => {
    const now = Math.floor(Date.now() / 1000);
    const forecastData = {
      timezone: 'Europe/Madrid',
      hourly: {
        time: [now, now + 3600],
        temperature_2m: [15, 20],
        apparent_temperature: [13, 18],
        precipitation: [0, 0.5],
        precipitation_probability: [0, 30],
        cloudcover: [20, 60],
        wind_speed_10m: [5, 10],
        wind_gusts_10m: [8, 15],
        wind_direction_10m: [90, 180],
        weather_code: [0, 1],
        relative_humidity_2m: [60, 70],
        surface_pressure: [1015, 1013],
        uv_index: [3, 5],
        visibility: [10000, 8000],
        is_day: [1, 1]
      },
      daily: {
        time: [Math.floor(now / 86400) * 86400],
        sunrise: [now - 3600],
        sunset: [now + 3600 * 10],
        weather_code: [0],
        temperature_2m_max: [20],
        temperature_2m_min: [15],
        precipitation_sum: [0.5],
        wind_speed_10m_max: [10],
        wind_gusts_10m_max: [15],
        apparent_temperature_max: [18]
      }
    };
    const aqiData = {
      hourly: {
        time: [now, now + 3600],
        us_aqi: [30, 45],
        european_aqi: [25, 40],
        pm10: [5, 10],
        pm2_5: [2, 5],
        nitrogen_dioxide: [10, 15],
        ozone: [50, 55],
        alder_pollen: [5, 10],
        birch_pollen: [3, 7],
        grass_pollen: [15, 25],
        mugwort_pollen: [2, 4],
        olive_pollen: [10, 15],
        ragweed_pollen: [1, 3]
      }
    };

    const centerOnCurrentTime = vi.fn();
    processData(forecastData, aqiData, centerOnCurrentTime);

    expect(state.hourlyData).toBeDefined();
    expect(state.hourlyData.length).toBe(2);
    expect(state.hourlyData[0]).toHaveProperty('temp');
    expect(state.hourlyData[0]).toHaveProperty('aqi');
    expect(state.hourlyData[0]).toHaveProperty('pollen');
    expect(state.hourlyData[0]).toHaveProperty('pollenDetails');
    expect(state.hourlyData[0]).toHaveProperty('isNight');
    expect(state.hourlyData[0].temp).toBe(15);
    expect(state.hourlyData[0].aqi).toBe(30);
    expect(state.hourlyData[0].pollen).toBeGreaterThan(0);
  });

  it('falls back to UTC for invalid timezone', () => {
    const now = Math.floor(Date.now() / 1000);
    const forecastData = {
      timezone: 'Invalid/Timezone',
      hourly: { time: [now], temperature_2m: [20], apparent_temperature: [18], precipitation: [0], precipitation_probability: [0], cloudcover: [50], wind_speed_10m: [10], wind_gusts_10m: [15], wind_direction_10m: [180], weather_code: [0], relative_humidity_2m: [50], surface_pressure: [1013], uv_index: [5], visibility: [10000], is_day: [1] },
      daily: undefined
    };
    const aqiData = { hourly: { time: [now], us_aqi: [30], european_aqi: [25], pm10: [5], pm2_5: [2], nitrogen_dioxide: [10], ozone: [50], alder_pollen: [0], birch_pollen: [0], grass_pollen: [0], mugwort_pollen: [0], olive_pollen: [0], ragweed_pollen: [0] } };

    processData(forecastData, aqiData, vi.fn());
    expect(state.timezone).toBe('UTC');
  });

  it('handles missing daily data gracefully', () => {
    const now = Math.floor(Date.now() / 1000);
    const forecastData = {
      timezone: 'UTC',
      hourly: { time: [now], temperature_2m: [20], apparent_temperature: [18], precipitation: [0], precipitation_probability: [0], cloudcover: [50], wind_speed_10m: [10], wind_gusts_10m: [15], wind_direction_10m: [180], weather_code: [0], relative_humidity_2m: [50], surface_pressure: [1013], uv_index: [5], visibility: [10000], is_day: [1] },
    };
    const aqiData = { hourly: { time: [now], us_aqi: [30], european_aqi: [25], pm10: [5], pm2_5: [2], nitrogen_dioxide: [10], ozone: [50], alder_pollen: [0], birch_pollen: [0], grass_pollen: [0], mugwort_pollen: [0], olive_pollen: [0], ragweed_pollen: [0] } };

    processData(forecastData, aqiData, vi.fn());
    expect(state.hourlyData).toHaveLength(1);
    expect(state.dailyData).toBeDefined();
  });

  it('calls generateDailyCards', () => {
    const now = Math.floor(Date.now() / 1000);
    const forecastData = {
      timezone: 'UTC',
      hourly: { time: [now], temperature_2m: [20], apparent_temperature: [18], precipitation: [0], precipitation_probability: [0], cloudcover: [50], wind_speed_10m: [10], wind_gusts_10m: [15], wind_direction_10m: [180], weather_code: [0], relative_humidity_2m: [50], surface_pressure: [1013], uv_index: [5], visibility: [10000], is_day: [1] },
    };
    const aqiData = { hourly: { time: [now], us_aqi: [30], european_aqi: [25], pm10: [5], pm2_5: [2], nitrogen_dioxide: [10], ozone: [50], alder_pollen: [0], birch_pollen: [0], grass_pollen: [0], mugwort_pollen: [0], olive_pollen: [0], ragweed_pollen: [0] } };

    processData(forecastData, aqiData, vi.fn());
    expect(mockGenerateDailyCards).toHaveBeenCalled();
  });
});
