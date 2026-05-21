import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockState = {
  lat: 40.4168,
  lon: -3.7038,
  isFetching: false,
  rawForecast: null,
  rawAQI: null,
  locationName: 'Madrid'
};

const mockCONFIG = { CACHE_DURATION: 300000 };

vi.mock('../store.js', () => ({
  state: mockState,
  CONFIG: mockCONFIG
}));

const mockForecastData = { hourly: [{ time: '2024-01-01T00:00', temp: 15 }] };
const mockAqiData = { hourly: [{ time: '2024-01-01T00:00', aqi: 2 }] };

const mockWeatherService = {
  getWeatherData: vi.fn()
};

vi.mock('../services/WeatherService.js', () => ({
  weatherService: mockWeatherService
}));

const mockGenerateMockData = vi.fn(() => ({
  forecastData: { mock: true },
  aqiData: { mock: true }
}));

vi.mock('../services/MockData.js', () => ({
  generateMockData: mockGenerateMockData
}));

const mockProcessData = vi.fn();

vi.mock('../services/DataProcessor.js', () => ({
  processData: mockProcessData
}));

let clearWeatherCache, fetchWeatherData;

beforeEach(async () => {
  vi.clearAllMocks();
  mockState.isFetching = false;
  mockState.rawForecast = null;
  mockState.rawAQI = null;
  mockState.locationName = 'Madrid';
  mockState.lat = 40.4168;
  mockState.lon = -3.7038;
  const mod = await import('./WeatherFetcher.js');
  clearWeatherCache = mod.clearWeatherCache;
  fetchWeatherData = mod.fetchWeatherData;
});

afterEach(() => {
  clearWeatherCache();
});

const defaultCallbacks = {
  onProcessData: vi.fn(),
  onResize: vi.fn(),
  onUpdateLocationUI: vi.fn(),
  onCenterOnCurrentTime: vi.fn()
};

describe('WeatherFetcher', () => {
  describe('clearWeatherCache()', () => {
    it('clears the cache without error', () => {
      expect(() => clearWeatherCache()).not.toThrow();
    });
  });

  describe('fetchWeatherData()', () => {
    it('fetches data on cache miss and processes it', async () => {
      mockWeatherService.getWeatherData.mockResolvedValue({
        forecastData: mockForecastData,
        aqiData: mockAqiData
      });

      await fetchWeatherData(7, 7, defaultCallbacks);

      expect(mockWeatherService.getWeatherData).toHaveBeenCalledWith(
        40.4168, -3.7038, 7, 7, expect.any(AbortSignal)
      );
      expect(mockProcessData).toHaveBeenCalledWith(
        mockForecastData, mockAqiData, defaultCallbacks.onCenterOnCurrentTime
      );
      expect(defaultCallbacks.onResize).toHaveBeenCalled();
    });

    it('uses cache on second call', async () => {
      mockWeatherService.getWeatherData.mockResolvedValue({
        forecastData: mockForecastData,
        aqiData: mockAqiData
      });

      await fetchWeatherData(7, 7, defaultCallbacks);
      expect(mockWeatherService.getWeatherData).toHaveBeenCalledTimes(1);

      mockWeatherService.getWeatherData.mockClear();

      await fetchWeatherData(7, 7, defaultCallbacks);
      expect(mockWeatherService.getWeatherData).not.toHaveBeenCalled();
    });

    it('does not fetch when isFetching is true', async () => {
      mockState.isFetching = true;
      await fetchWeatherData(7, 7, defaultCallbacks);
      expect(mockWeatherService.getWeatherData).not.toHaveBeenCalled();
    });

    it('falls back to expired cache when API fails', async () => {
      mockWeatherService.getWeatherData.mockResolvedValue({
        forecastData: mockForecastData,
        aqiData: mockAqiData
      });
      await fetchWeatherData(7, 7, defaultCallbacks);

      mockWeatherService.getWeatherData.mockRejectedValue(new Error('Network error'));
      mockWeatherService.getWeatherData.mockClear();

      await fetchWeatherData(7, 7, defaultCallbacks);

      expect(mockProcessData).toHaveBeenCalled();
      expect(defaultCallbacks.onResize).toHaveBeenCalled();
    });

    it('generates mock data when API fails and no cache', async () => {
      mockWeatherService.getWeatherData.mockRejectedValue(new Error('Network error'));

      await fetchWeatherData(7, 7, defaultCallbacks);

      expect(mockGenerateMockData).toHaveBeenCalledWith(7, 7);
      expect(mockState.locationName).toBe('Ninguna');
      expect(mockProcessData).toHaveBeenCalled();
    });
  });
});
