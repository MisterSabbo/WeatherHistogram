import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./StorageService.js', () => ({
  storageService: {
    get: vi.fn().mockResolvedValue([]),
    set: vi.fn().mockResolvedValue()
  }
}));

import { storageService } from './StorageService.js';
import { FavoritesService } from './FavoritesService.js';

beforeEach(() => {
  vi.clearAllMocks();
  storageService.get.mockResolvedValue([]);
  storageService.set.mockResolvedValue();
});

describe('FavoritesService', () => {
  it('adds a new favorite and persists', async () => {
    const service = new FavoritesService();
    await service.add(40.4168, -3.7038, 'Madrid');

    expect(service.cache).toHaveLength(1);
    expect(service.cache[0].originName).toBe('Madrid');
    expect(storageService.set).toHaveBeenCalled();
  });

  it('does not add duplicate favorites (within 0.001 tolerance)', async () => {
    const service = new FavoritesService();
    await service.add(40.4168, -3.7038, 'Madrid');
    await service.add(40.4169, -3.7039, 'Madrid Centro');

    expect(service.cache).toHaveLength(1);
  });

  it('removes a favorite by index', async () => {
    const service = new FavoritesService();
    storageService.get.mockResolvedValue([
      { lat: 40.4168, lon: -3.7038, originName: 'Madrid', alias: 'Madrid' },
      { lat: 41.3851, lon: 2.1734, originName: 'Barcelona', alias: 'Barcelona' }
    ]);

    await service.remove(0);
    expect(service.cache).toHaveLength(1);
    expect(service.cache[0].originName).toBe('Barcelona');
    expect(storageService.set).toHaveBeenCalled();
  });

  it('reorders favorites', async () => {
    const service = new FavoritesService();
    storageService.get.mockResolvedValue([
      { lat: 40.4168, lon: -3.7038, originName: 'Madrid', alias: 'Madrid' },
      { lat: 41.3851, lon: 2.1734, originName: 'Barcelona', alias: 'Barcelona' }
    ]);

    await service.reorder(0, 1);
    expect(service.cache[0].originName).toBe('Barcelona');
    expect(service.cache[1].originName).toBe('Madrid');
  });

  it('reorder does nothing when newIndex is out of range', async () => {
    const service = new FavoritesService();
    storageService.get.mockResolvedValue([
      { lat: 40.4168, lon: -3.7038, originName: 'Madrid', alias: 'Madrid' }
    ]);

    await service.reorder(0, 5);
    expect(service.cache).toHaveLength(1);
  });

  it('clears all favorites', async () => {
    const service = new FavoritesService();
    storageService.get.mockResolvedValue([
      { lat: 40.4168, lon: -3.7038, originName: 'Madrid', alias: 'Madrid' }
    ]);

    await service.clear();
    expect(service.cache).toEqual([]);
  });

  it('updates alias', async () => {
    const service = new FavoritesService();
    storageService.get.mockResolvedValue([
      { lat: 40.4168, lon: -3.7038, originName: 'Madrid', alias: 'Madrid' }
    ]);

    await service.updateAlias(0, 'Mi Ciudad');
    expect(service.cache[0].alias).toBe('Mi Ciudad');
  });
});
