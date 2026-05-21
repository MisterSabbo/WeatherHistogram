import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeoService } from './GeoService.js';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GeoService', () => {
  describe('searchLocation', () => {
    it('returns results array on success', async () => {
      const mockResults = [
        { name: 'Madrid', country: 'España', latitude: 40.4168, longitude: -3.7038 }
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ results: mockResults })
      });

      const service = new GeoService();
      const results = await service.searchLocation('Madrid', 5);
      expect(results).toEqual(mockResults);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('Madrid')
      );
    });

    it('throws on API error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
      const service = new GeoService();
      await expect(service.searchLocation('Madrid')).rejects.toThrow('Error fetching location data');
    });

    it('returns empty array when no results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });
      const service = new GeoService();
      const results = await service.searchLocation('Xyzabc');
      expect(results).toEqual([]);
    });
  });

  describe('reverseGeocode', () => {
    it('returns location name from address data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          address: {
            city: 'Madrid',
            county: 'Madrid',
            state: 'Comunidad de Madrid',
            country: 'España'
          }
        })
      });

      const service = new GeoService();
      const name = await service.reverseGeocode(40.4168, -3.7038);
      expect(name).toBe('Madrid, Madrid, Comunidad de Madrid, España');
    });

    it('returns "Ubicación actual" when no address data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      });

      const service = new GeoService();
      const name = await service.reverseGeocode(0, 0);
      expect(name).toBe('Ubicación actual');
    });

    it('rejects only the most recent queued request when spammed', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        address: { city: 'Barcelona', country: 'España' }
      })
    });

    const service = new GeoService();
    const p1 = service.reverseGeocode(40.4168, -3.7038);
    const p2 = service.reverseGeocode(41.3851, 2.1734);
    p2.catch(() => {});
    const p3 = service.reverseGeocode(42.3851, 3.1734);

    const name = await p3;
    expect(name).toContain('Barcelona');
    await expect(p2).rejects.toThrow('Cancelled');
    const n1 = await p1;
    expect(n1).toContain('Barcelona');
  }, 10000);

    it('rejects on fetch error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false });
      const service = new GeoService();
      await expect(service.reverseGeocode(0, 0)).rejects.toThrow('Error during reverse geocoding');
    });
  });
});
