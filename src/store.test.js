import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('store', () => {
  let store;

  beforeEach(async () => {
    vi.resetModules();
    store = await import('./store.js');
  });

  describe('CONFIG', () => {
    it('is frozen', () => {
      expect(Object.isFrozen(store.CONFIG)).toBe(true);
    });

    it('has expected constants', () => {
      expect(store.CONFIG.CHART_HEIGHT).toBe(250);
      expect(store.CONFIG.MINIMAP_HEIGHT).toBe(80);
      expect(store.CONFIG.CACHE_DURATION).toBe(300000);
      expect(store.CONFIG.TILE_WIDTH).toBe(1440);
      expect(store.CONFIG.PIXELS_PER_MM).toBe(10);
    });

    it('has DEFAULT_COORDS with Madrid', () => {
      expect(store.CONFIG.DEFAULT_COORDS).toEqual({
        lat: 40.4167,
        lon: -3.70325,
        name: 'Madrid'
      });
    });
  });

  describe('getDPR', () => {
    it('returns devicePixelRatio capped at 2', () => {
      const dpr = store.getDPR();
      expect(dpr).toBeGreaterThanOrEqual(1);
      expect(dpr).toBeLessThanOrEqual(2);
    });
  });

  describe('state', () => {
    it('has default values', () => {
      expect(store.state.lat).toBeNull();
      expect(store.state.lon).toBeNull();
      expect(store.state.locationName).toBe('Cargando...');
      expect(store.state.hourlyData).toEqual([]);
      expect(store.state.dailyData).toEqual([]);
      expect(store.state.sunData).toEqual({});
      expect(store.state.hoverX).toBeNull();
      expect(store.state.isFetching).toBe(false);
      expect(store.state.isDragging).toBe(false);
      expect(store.state.theme).toBe('dark');
      expect(store.state.timezone).toBe('UTC');
      expect(store.state.activeChartTheme).toBe('default');
      expect(store.state.isDailyCardsView).toBe(false);
      expect(store.state.themeConfig).toBeNull();
      expect(store.state.skinType).toBe(2);
    });

    it('has stickman thresholds', () => {
      expect(store.state.stickmanThresholds).toEqual({
        cold: 10,
        hot: 30,
        wind: 45,
        clouds: 60
      });
    });
  });
});
