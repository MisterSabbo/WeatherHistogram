import { describe, it, expect, vi } from 'vitest';
import { getWeatherDescription } from './weather.js';
import * as i18n from './i18n.js';

// BUG IN SOURCE: getWeatherDescription uses `||` to fallback, but t() always returns
// a truthy string (the key itself if not found), so `|| t('weatherCodes.unknown')`
// never triggers. The function always returns the raw key for unknown codes.
vi.mock('./i18n.js', () => ({
  t: vi.fn((key) => {
    if (key === 'weatherCodes.0') return 'Despejado';
    if (key === 'weatherCodes.unknown') return 'Desconocido';
    return key;
  })
}));

describe('getWeatherDescription', () => {
  it('returns translated description for a known WMO code', () => {
    const result = getWeatherDescription(0);
    expect(result).toBe('Despejado');
    expect(i18n.t).toHaveBeenCalledWith('weatherCodes.0');
  });

  it('returns the key itself for an unknown WMO code (bug: || short-circuits)', () => {
    const result = getWeatherDescription(999);
    expect(result).toBe('weatherCodes.999');
    expect(i18n.t).toHaveBeenCalledWith('weatherCodes.999');
  });

  it('calls t with the code string', () => {
    getWeatherDescription(null);
    expect(i18n.t).toHaveBeenCalledWith('weatherCodes.null');
  });
});
