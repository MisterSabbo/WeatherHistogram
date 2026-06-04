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
  it('throws when forecastData has no hourly', async () => {
    await expect(processData({}, { hourly: { time: [] } }, vi.fn())).rejects.toThrow('Datos de API incompletos');
    await expect(processData(null, { hourly: { time: [] } }, vi.fn())).rejects.toThrow('Datos de API incompletos');
  });

  it('throws when aqiData has no hourly', async () => {
    const forecast = { hourly: { time: [1000] }, daily: { time: [1000] } };
    await expect(processData(forecast, {}, vi.fn())).rejects.toThrow('Datos de API incompletos');
  });

  it('processes valid data and populates hourlyData', async () => {
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
    await processData(forecastData, aqiData, centerOnCurrentTime);

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

  it('falls back to UTC for invalid timezone', async () => {
    const now = Math.floor(Date.now() / 1000);
    const forecastData = {
      timezone: 'Invalid/Timezone',
      hourly: { time: [now], temperature_2m: [20], apparent_temperature: [18], precipitation: [0], precipitation_probability: [0], cloudcover: [50], wind_speed_10m: [10], wind_gusts_10m: [15], wind_direction_10m: [180], weather_code: [0], relative_humidity_2m: [50], surface_pressure: [1013], uv_index: [5], visibility: [10000], is_day: [1] },
      daily: undefined
    };
    const aqiData = { hourly: { time: [now], us_aqi: [30], european_aqi: [25], pm10: [5], pm2_5: [2], nitrogen_dioxide: [10], ozone: [50], alder_pollen: [0], birch_pollen: [0], grass_pollen: [0], mugwort_pollen: [0], olive_pollen: [0], ragweed_pollen: [0] } };

    await processData(forecastData, aqiData, vi.fn());
    expect(state.timezone).toBe('UTC');
  });

  it('handles missing daily data gracefully', async () => {
    const now = Math.floor(Date.now() / 1000);
    const forecastData = {
      timezone: 'UTC',
      hourly: { time: [now], temperature_2m: [20], apparent_temperature: [18], precipitation: [0], precipitation_probability: [0], cloudcover: [50], wind_speed_10m: [10], wind_gusts_10m: [15], wind_direction_10m: [180], weather_code: [0], relative_humidity_2m: [50], surface_pressure: [1013], uv_index: [5], visibility: [10000], is_day: [1] },
    };
    const aqiData = { hourly: { time: [now], us_aqi: [30], european_aqi: [25], pm10: [5], pm2_5: [2], nitrogen_dioxide: [10], ozone: [50], alder_pollen: [0], birch_pollen: [0], grass_pollen: [0], mugwort_pollen: [0], olive_pollen: [0], ragweed_pollen: [0] } };

    await processData(forecastData, aqiData, vi.fn());
    expect(state.hourlyData).toHaveLength(1);
    expect(state.dailyData).toBeDefined();
  });

  it('preserves notes field across saveHistoryData merge', async () => {
    const todayMidnight = Math.floor(Date.now() / 86400000) * 86400000;
    const yesterdayMidnight = todayMidnight - 86400000;
    const pastDaySec = yesterdayMidnight / 1000;
    const futureHourSec = pastDaySec + 90000;
    const pastHourMs = yesterdayMidnight + 3600000;
    const pastHourSec = pastHourMs / 1000;

    mockStorage.getHistory.mockResolvedValue({
      hourly: [],
      daily: [{ time: yesterdayMidnight, tempMax: 20, notes: 'my note' }]
    });

    const forecastData = {
      timezone: 'UTC',
      hourly: {
        time: [pastHourSec, futureHourSec],
        temperature_2m: [20, 21],
        apparent_temperature: [18, 18],
        precipitation: [0, 0],
        precipitation_probability: [0, 0],
        cloudcover: [50, 50],
        wind_speed_10m: [10, 10],
        wind_gusts_10m: [15, 15],
        wind_direction_10m: [180, 180],
        weather_code: [0, 0],
        relative_humidity_2m: [50, 50],
        surface_pressure: [1013, 1013],
        uv_index: [5, 5],
        visibility: [10000, 10000],
        is_day: [1, 1]
      },
      daily: {
        time: [pastDaySec],
        sunrise: [pastDaySec + 3600],
        sunset: [pastDaySec + 3600 * 12],
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
        time: [pastHourSec, futureHourSec],
        us_aqi: [30, 30],
        european_aqi: [25, 25],
        pm10: [5, 5],
        pm2_5: [2, 2],
        nitrogen_dioxide: [10, 10],
        ozone: [50, 50],
        alder_pollen: [0, 0],
        birch_pollen: [0, 0],
        grass_pollen: [0, 0],
        mugwort_pollen: [0, 0],
        olive_pollen: [0, 0],
        ragweed_pollen: [0, 0]
      }
    };

    await processData(forecastData, aqiData, vi.fn());

    await vi.waitFor(() => {
      expect(mockStorage.setHistory).toHaveBeenCalled();
    });
    const savedData = mockStorage.setHistory.mock.calls[0][1];
    const savedDay = savedData.daily.find(d => d.time === yesterdayMidnight);
    expect(savedDay).toBeDefined();
    expect(savedDay.notes).toBe('my note');
  });

  it('calls generateDailyCards', async () => {
    const now = Math.floor(Date.now() / 1000);
    const forecastData = {
      timezone: 'UTC',
      hourly: { time: [now], temperature_2m: [20], apparent_temperature: [18], precipitation: [0], precipitation_probability: [0], cloudcover: [50], wind_speed_10m: [10], wind_gusts_10m: [15], wind_direction_10m: [180], weather_code: [0], relative_humidity_2m: [50], surface_pressure: [1013], uv_index: [5], visibility: [10000], is_day: [1] },
    };
    const aqiData = { hourly: { time: [now], us_aqi: [30], european_aqi: [25], pm10: [5], pm2_5: [2], nitrogen_dioxide: [10], ozone: [50], alder_pollen: [0], birch_pollen: [0], grass_pollen: [0], mugwort_pollen: [0], olive_pollen: [0], ragweed_pollen: [0] } };

    await processData(forecastData, aqiData, vi.fn());
    expect(mockGenerateDailyCards).toHaveBeenCalled();
  });
});
