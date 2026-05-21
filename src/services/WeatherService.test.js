import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WeatherService } from './WeatherService.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('WeatherService', () => {
  it('constructs URLs and fetches forecast + AQI in parallel', async () => {
    const forecastData = { hourly: { time: [1000] }, daily: { time: [1000] } };
    const aqiData = { hourly: { time: [1000] } };

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(forecastData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(aqiData)
      });

    const service = new WeatherService();
    const result = await service.getWeatherData(40.4168, -3.7038, 7, 7, new AbortController().signal);

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.forecastData).toEqual(forecastData);
    expect(result.aqiData).toEqual(aqiData);
  });

  it('throws on forecast API error', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) });

    const service = new WeatherService();
    await expect(
      service.getWeatherData(40.4168, -3.7038, 7, 7, new AbortController().signal)
    ).rejects.toThrow('API Response Error');
  });

  it('throws on internal API error (forecastData.error)', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: true, reason: 'Rate limit exceeded' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ hourly: { time: [] } })
      });

    const service = new WeatherService();
    await expect(
      service.getWeatherData(40.4168, -3.7038, 7, 7, new AbortController().signal)
    ).rejects.toThrow('Rate limit exceeded');
  });

  it('URL contains lat/lon/past_days/forecast_days', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hourly: { time: [] }, daily: { time: [] } }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ hourly: { time: [] } }) });

    const service = new WeatherService();
    await service.getWeatherData(40.4168, -3.7038, 7, 7, new AbortController().signal);

    const forecastUrl = mockFetch.mock.calls[0][0];
    expect(forecastUrl).toContain('latitude=40.4168');
    expect(forecastUrl).toContain('longitude=-3.7038');
    expect(forecastUrl).toContain('past_days=7');
    expect(forecastUrl).toContain('forecast_days=7');
    expect(forecastUrl).toContain('temperature_2m');
    expect(forecastUrl).toContain('precipitation_probability');

    const aqiUrl = mockFetch.mock.calls[1][0];
    expect(aqiUrl).toContain('alder_pollen');
    expect(aqiUrl).toContain('us_aqi');
  });

  it('is a singleton', async () => {
    const { weatherService } = await import('./WeatherService.js');
    const { weatherService: ws2 } = await import('./WeatherService.js');
    expect(weatherService).toBe(ws2);
  });
});
