import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from './StorageService.js';

const fakeDB = {
  transaction: vi.fn(),
  objectStoreNames: { contains: vi.fn(() => true) }
};

const mockIndexedDB = {
  open: vi.fn()
};

vi.stubGlobal('indexedDB', mockIndexedDB);

beforeEach(() => {
  vi.clearAllMocks();

  const openReq = {
    result: fakeDB,
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    target: { result: fakeDB }
  };

  mockIndexedDB.open.mockReturnValue(openReq);

  fakeDB.transaction.mockReturnValue({
    objectStore: vi.fn(() => ({
      get: vi.fn(() => {
        const req = { result: undefined, onerror: null, onsuccess: null, target: { result: undefined } };
        setTimeout(() => { if (req.onsuccess) req.onsuccess(req); }, 0);
        return req;
      }),
      put: vi.fn(() => {
        const req = { onerror: null, onsuccess: null };
        setTimeout(() => { if (req.onsuccess) req.onsuccess(req); }, 0);
        return req;
      })
    }))
  });

  setTimeout(() => {
    if (openReq.onsuccess) openReq.onsuccess(openReq);
  }, 0);
});

describe('StorageService', () => {
  it('init is idempotent', async () => {
    const service = new StorageService();
    await service.init();
    await service.init();
    expect(mockIndexedDB.open).toHaveBeenCalledTimes(1);
  });

  it('get returns default for non-existent key', async () => {
    const service = new StorageService();
    const val = await service.get('nonexistent', 'default');
    expect(val).toBe('default');
  });

  it('getHistory returns empty structure for missing location', async () => {
    const service = new StorageService();
    const result = await service.getHistory('unknown');
    expect(result).toEqual({ hourly: [], daily: [] });
  });

  it('has expected API', () => {
    const service = new StorageService();
    expect(service.init).toBeInstanceOf(Function);
    expect(service.get).toBeInstanceOf(Function);
    expect(service.set).toBeInstanceOf(Function);
    expect(service.getHistory).toBeInstanceOf(Function);
    expect(service.setHistory).toBeInstanceOf(Function);
  });
});
