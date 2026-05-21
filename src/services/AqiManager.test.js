import { describe, it, expect, vi } from 'vitest';
import { getAQIInfo, getPollenLevelByType, getAggregatedPollenLevel, getPollenColor, getPollenText } from './AqiManager.js';

vi.mock('../utils/i18n.js', () => ({
  t: vi.fn((key) => {
    if (key === 'aqiLevel.1.t') return 'Buena';
    if (key === 'aqiLevel.1.r') return 'Calidad del aire satisfactoria.';
    if (key === 'aqiLevel.6.t') return 'Peligrosa';
    if (key === 'aqiLevel.6.r') return 'Emergencia sanitaria.';
    if (key === 'pollenLevels.none') return 'Nulo';
    if (key === 'pollenLevels.low') return 'Bajo';
    if (key === 'pollenLevels.moderate') return 'Moderado';
    if (key === 'pollenLevels.high') return 'Alto';
    if (key === 'pollenLevels.veryHigh') return 'Muy Alto';
    if (key === 'weatherCodes.unknown') return 'Desconocido';
    return key;
  })
}));

describe('AqiManager', () => {
  describe('getAQIInfo', () => {
    it('returns level 1 for good AQI (≤50)', () => {
      const result = getAQIInfo(30);
      expect(result.text).toBe('Buena');
      expect(result.val).toBe(30);
    });

    it('returns level 6 for hazardous AQI (>300)', () => {
      const result = getAQIInfo(350);
      expect(result.text).toBe('Peligrosa');
      expect(result.val).toBe(350);
    });

    it('returns fallback text for null AQI', () => {
      const result = getAQIInfo(null);
      expect(result.text).toBe('--');
      expect(result.rec).toBe('');
    });
  });

  describe('getPollenLevelByType', () => {
    it('returns 0 for null/undefined/negative raw', () => {
      expect(getPollenLevelByType('alder', null)).toBe(0);
      expect(getPollenLevelByType('alder', undefined)).toBe(0);
      expect(getPollenLevelByType('alder', -1)).toBe(0);
    });

    it('returns level based on alder thresholds', () => {
      expect(getPollenLevelByType('alder', 10)).toBe(1);
      expect(getPollenLevelByType('alder', 50)).toBe(2);
      expect(getPollenLevelByType('alder', 100)).toBe(3);
      expect(getPollenLevelByType('alder', 300)).toBe(4);
    });

    it('handles unknown type with raw > 0', () => {
      expect(getPollenLevelByType('unknown_type', 10)).toBe(1);
    });
  });

  describe('getAggregatedPollenLevel', () => {
    it('returns max level among pollen types', () => {
      const details = { alder: 10, birch: 5, grass: 80, mugwort: 5, olive: 5, ragweed: 5 };
      const result = getAggregatedPollenLevel(details);
      expect(result).toBe(3);
    });

    it('returns 0 for null/undefined details', () => {
      expect(getAggregatedPollenLevel(null)).toBe(0);
      expect(getAggregatedPollenLevel(undefined)).toBe(0);
    });
  });

  describe('getPollenColor', () => {
    it('returns secondary color for level 0', () => {
      expect(getPollenColor(0)).toBe('var(--text-secondary)');
    });

    it('returns green for level 1', () => {
      expect(getPollenColor(1)).toBe('#a3e635');
    });

    it('returns yellow for level 2', () => {
      expect(getPollenColor(2)).toBe('#fbbf24');
    });

    it('returns red for level 3+', () => {
      expect(getPollenColor(3)).toBe('#ef4444');
      expect(getPollenColor(4)).toBe('#ef4444');
    });
  });

  describe('getPollenText', () => {
    it('returns text based on aggregated level when pollenDetails provided', () => {
      expect(getPollenText(null, { alder: 300, birch: 5, grass: 5, mugwort: 5, olive: 5, ragweed: 5 })).toBe('Muy Alto');
      expect(getPollenText(null, { alder: 100, birch: 5, grass: 5, mugwort: 5, olive: 5, ragweed: 5 })).toBe('Alto');
      expect(getPollenText(null, { alder: 50, birch: 5, grass: 5, mugwort: 5, olive: 5, ragweed: 5 })).toBe('Moderado');
      expect(getPollenText(null, { alder: 10, birch: 5, grass: 5, mugwort: 5, olive: 5, ragweed: 5 })).toBe('Bajo');
      expect(getPollenText(null, { alder: 0, birch: 0, grass: 0, mugwort: 0, olive: 0, ragweed: 0 })).toBe('Nulo');
    });

    it('returns text based on val when no pollenDetails', () => {
      expect(getPollenText(0)).toBe('Nulo');
      expect(getPollenText(5)).toBe('Bajo');
      expect(getPollenText(30)).toBe('Moderado');
      expect(getPollenText(75)).toBe('Alto');
      expect(getPollenText(200)).toBe('Muy Alto');
    });

    it('returns "--" for null/undefined val without details', () => {
      expect(getPollenText(null)).toBe('--');
      expect(getPollenText(undefined)).toBe('--');
    });
  });
});
