import { describe, it, expect } from 'vitest';
import { generateMockData } from './MockData.js';

describe('generateMockData', () => {
  it('returns object with forecastData and aqiData', () => {
    const result = generateMockData(7, 7);
    expect(result).toHaveProperty('forecastData');
    expect(result).toHaveProperty('aqiData');
  });

  it('generates correct number of hours', () => {
    const result = generateMockData(7, 7);
    const totalHours = (7 + 7) * 24;
    expect(result.forecastData.hourly.time).toHaveLength(totalHours);
    expect(result.forecastData.hourly.temperature_2m).toHaveLength(totalHours);
    expect(result.aqiData.hourly.time).toHaveLength(totalHours);
  });

  it('generates correct number of daily entries', () => {
    const result = generateMockData(7, 7);
    expect(result.forecastData.daily.time).toHaveLength(14);
  });

  it('forecast hourly has required fields', () => {
    const result = generateMockData(3, 3);
    const hourly = result.forecastData.hourly;
    expect(hourly).toHaveProperty('temperature_2m');
    expect(hourly).toHaveProperty('apparent_temperature');
    expect(hourly).toHaveProperty('precipitation');
    expect(hourly).toHaveProperty('precipitation_probability');
    expect(hourly).toHaveProperty('cloudcover');
    expect(hourly).toHaveProperty('wind_speed_10m');
    expect(hourly).toHaveProperty('wind_gusts_10m');
    expect(hourly).toHaveProperty('wind_direction_10m');
    expect(hourly).toHaveProperty('weather_code');
    expect(hourly).toHaveProperty('relative_humidity_2m');
    expect(hourly).toHaveProperty('surface_pressure');
    expect(hourly).toHaveProperty('uv_index');
    expect(hourly).toHaveProperty('visibility');
  });

  it('aqi hourly has required fields', () => {
    const result = generateMockData(3, 3);
    const hourly = result.aqiData.hourly;
    expect(hourly).toHaveProperty('european_aqi');
    expect(hourly).toHaveProperty('pm10');
    expect(hourly).toHaveProperty('alder_pollen');
    expect(hourly).toHaveProperty('birch_pollen');
    expect(hourly).toHaveProperty('grass_pollen');
  });

  it('daily data contains sunrise and sunset', () => {
    const result = generateMockData(1, 1);
    const daily = result.forecastData.daily;
    expect(daily).toHaveProperty('sunrise');
    expect(daily).toHaveProperty('sunset');
    expect(daily.sunrise).toHaveLength(2);
    expect(daily.sunset).toHaveLength(2);
  });

  it('handles pastDays=0', () => {
    const result = generateMockData(0, 3);
    expect(result.forecastData.hourly.time).toHaveLength(72);
  });
});
