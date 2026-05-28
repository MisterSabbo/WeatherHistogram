import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService, storageService } from './StorageService.js';

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

function setupHistoryMock(historyData) {
  const storeData = { result: historyData };
  const getReq = { result: storeData.result, onerror: null, onsuccess: null, target: storeData };
  const putReq = { onerror: null, onsuccess: null };

  fakeDB.transaction.mockReturnValue({
    objectStore: vi.fn(() => ({
      get: vi.fn(() => {
        setTimeout(() => { if (getReq.onsuccess) getReq.onsuccess(getReq); }, 0);
        return getReq;
      }),
      put: vi.fn((data) => {
        storeData.result = data;
        setTimeout(() => { if (putReq.onsuccess) putReq.onsuccess(putReq); }, 0);
        return putReq;
      })
    }))
  });

  return storeData;
}

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

  it('getHistory returns saved data', async () => {
    const service = new StorageService();
    const saved = { hourly: [], daily: [{ time: 1000, tempMax: 25 }] };
    setupHistoryMock(saved);
    const result = await service.getHistory('testLoc');
    expect(result.daily).toHaveLength(1);
    expect(result.daily[0].tempMax).toBe(25);
  });

  it('falls back to localStorage when IndexedDB fails', async () => {
    const service = new StorageService();
    mockIndexedDB.open.mockImplementation(() => { throw new Error('IndexedDB unavailable'); });
    const val = await service.get('test', 'default');
    expect(val).toBe('default');
  });

  it('exposes singleton instance', () => {
    expect(storageService).toBeInstanceOf(StorageService);
  });

  it('has expected API', () => {
    const service = new StorageService();
    expect(service.init).toBeInstanceOf(Function);
    expect(service.get).toBeInstanceOf(Function);
    expect(service.set).toBeInstanceOf(Function);
    expect(service.getHistory).toBeInstanceOf(Function);
    expect(service.setHistory).toBeInstanceOf(Function);
    expect(service.updateDayNotes).toBeInstanceOf(Function);
    expect(service.updateDayMoods).toBeInstanceOf(Function);
  });

  it('updateDayNotes creates entry for non-existing day', async () => {
    const service = new StorageService();
    await service.init();
    const storeData = setupHistoryMock({ hourly: [], daily: [] });
    const result = await service.updateDayNotes('testLoc', 999999, 'test note');
    expect(result).toBe(true);
    expect(storeData.result.daily).toHaveLength(1);
    expect(storeData.result.daily[0].time).toBe(999999);
    expect(storeData.result.daily[0].notes).toBe('test note');
  });

  it('updateDayNotes updates notes and persists', async () => {
    const service = new StorageService();
    await service.init();

    const storeData = setupHistoryMock({ hourly: [], daily: [{ time: 1000, tempMax: 25 }] });

    const result = await service.updateDayNotes('testLoc', 1000, 'my note');
    expect(result).toBe(true);
    expect(storeData.result.daily[0].notes).toBe('my note');
  });

  it('updateDayNotes clears notes key when empty string', async () => {
    const service = new StorageService();
    await service.init();

    const storeData = setupHistoryMock({ hourly: [], daily: [{ time: 1000, tempMax: 25, notes: 'old note' }] });

    const result = await service.updateDayNotes('testLoc', 1000, '');
    expect(result).toBe(true);
    expect(storeData.result.daily[0].notes).toBeUndefined();
  });

  it('updateDayMoods creates entry for non-existing day', async () => {
    const service = new StorageService();
    await service.init();
    const storeData = setupHistoryMock({ hourly: [], daily: [] });
    const result = await service.updateDayMoods('testLoc', 999999, ['happy']);
    expect(result).toBe(true);
    expect(storeData.result.daily).toHaveLength(1);
    expect(storeData.result.daily[0].time).toBe(999999);
    expect(storeData.result.daily[0].moods).toEqual(['happy']);
  });

  it('updateDayMoods updates moods and persists', async () => {
    const service = new StorageService();
    await service.init();

    const storeData = setupHistoryMock({ hourly: [], daily: [{ time: 1000, tempMax: 25 }] });

    const result = await service.updateDayMoods('testLoc', 1000, ['happy', 'tired']);
    expect(result).toBe(true);
    expect(storeData.result.daily[0].moods).toEqual(['happy', 'tired']);
  });

  it('updateDayMoods clears moods key when empty array', async () => {
    const service = new StorageService();
    await service.init();

    const storeData = setupHistoryMock({ hourly: [], daily: [{ time: 1000, tempMax: 25, moods: ['happy'] }] });

    const result = await service.updateDayMoods('testLoc', 1000, []);
    expect(result).toBe(true);
    expect(storeData.result.daily[0].moods).toBeUndefined();
  });

  it('updateDayMoods clears moods key when null/undefined', async () => {
    const service = new StorageService();
    await service.init();

    const storeData = setupHistoryMock({ hourly: [], daily: [{ time: 1000, tempMax: 25, moods: ['happy'] }] });

    const result = await service.updateDayMoods('testLoc', 1000, null);
    expect(result).toBe(true);
    expect(storeData.result.daily[0].moods).toBeUndefined();
  });
});
