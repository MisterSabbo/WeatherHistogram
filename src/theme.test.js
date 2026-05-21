import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('theme', () => {
  let theme;

  beforeEach(async () => {
    vi.resetModules();
    const store = await import('./store.js');

    store.state.themeConfig = {
      font: 'Inter, sans-serif',
      icons: {
        header: { aqi: 'air', precip: 'rainy' },
        scrubber: { temp: 'device_thermostat' }
      },
      colors: {
        tempLine: '#d32f2f',
        humidityLine: 'rgba(0, 172, 193, 0.4)',
        uvLevels: { low: '#4caf50', high: '#f57c00' },
        wind: { normalLight: '#64748b', cold: '#3b82f6' }
      }
    };

    theme = await import('./theme.js');
  });

  describe('getThemeColor', () => {
    it('returns color from path', () => {
      expect(theme.getThemeColor('tempLine')).toBe('#d32f2f');
      expect(theme.getThemeColor('uvLevels.low')).toBe('#4caf50');
      expect(theme.getThemeColor('wind.cold')).toBe('#3b82f6');
    });

    it('returns fallback when themeConfig is missing', async () => {
      vi.resetModules();
      const s = await import('./store.js');
      s.state.themeConfig = null;
      const t2 = await import('./theme.js');
      expect(t2.getThemeColor('tempLine', '#000')).toBe('#000');
    });

    it('returns fallback for invalid path', () => {
      expect(theme.getThemeColor('nonexistent.path', 'red')).toBe('red');
      expect(theme.getThemeColor('tempLine.missing', 'blue')).toBe('blue');
    });

    it('returns fallback when val is not a string', () => {
      expect(theme.getThemeColor('uvLevels', 'fallback')).toBe('fallback');
    });
  });

  describe('getThemeIcon', () => {
    it('returns icon from path', () => {
      expect(theme.getThemeIcon('header.aqi')).toBe('air');
      expect(theme.getThemeIcon('scrubber.temp')).toBe('device_thermostat');
    });

    it('returns fallback when no config', async () => {
      vi.resetModules();
      const s = await import('./store.js');
      s.state.themeConfig = null;
      const t2 = await import('./theme.js');
      expect(t2.getThemeIcon('header.aqi', 'eco')).toBe('eco');
    });

    it('returns fallback for invalid path', () => {
      expect(theme.getThemeIcon('missing.path', 'fallback')).toBe('fallback');
    });
  });

  describe('getThemeFont', () => {
    it('returns font from config', () => {
      expect(theme.getThemeFont()).toBe('Inter, sans-serif');
    });

    it('returns font with size', () => {
      expect(theme.getThemeFont('14px')).toBe('14px Inter, sans-serif');
    });

    it('returns default font when no config', async () => {
      vi.resetModules();
      const s = await import('./store.js');
      s.state.themeConfig = null;
      const t2 = await import('./theme.js');
      expect(t2.getThemeFont()).toBe('Inter, sans-serif');
    });
  });

  describe('applyThemeDOM', () => {
    it('does not throw when DOM elements missing', () => {
      expect(() => theme.applyThemeDOM()).not.toThrow();
    });
  });
});
