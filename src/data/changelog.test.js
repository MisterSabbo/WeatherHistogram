import { describe, it, expect } from 'vitest';
import { changelogData } from './changelog.js';

describe('changelogData', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(changelogData)).toBe(true);
    expect(changelogData.length).toBeGreaterThan(0);
  });

  it('each entry has version (string) and changes (array)', () => {
    for (const entry of changelogData) {
      expect(typeof entry.version).toBe('string');
      expect(Array.isArray(entry.changes)).toBe(true);
    }
  });

  it('each change is a non-empty string', () => {
    for (const entry of changelogData) {
      for (const change of entry.changes) {
        expect(typeof change).toBe('string');
        expect(change.length).toBeGreaterThan(0);
      }
    }
  });

  it('is sorted newest first', () => {
    for (let i = 1; i < changelogData.length; i++) {
      expect(changelogData[i - 1].version.localeCompare(changelogData[i].version, undefined, { numeric: true })).toBeGreaterThanOrEqual(0);
    }
  });
});
