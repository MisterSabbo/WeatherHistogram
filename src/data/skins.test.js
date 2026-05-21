import { describe, it, expect } from 'vitest';
import { SKIN_TYPES, DEFAULT_SKIN_TYPE, getSkinType, needsSunProtection } from './skins.js';

describe('skins', () => {
  describe('SKIN_TYPES', () => {
    it('has 6 types', () => {
      expect(SKIN_TYPES).toHaveLength(6);
    });

    it('each type has id, labelKey, uvThreshold', () => {
      for (const skin of SKIN_TYPES) {
        expect(skin).toHaveProperty('id');
        expect(skin).toHaveProperty('labelKey');
        expect(skin).toHaveProperty('uvThreshold');
      }
    });

    it('has thresholds 1 through 6', () => {
      for (let i = 0; i < 6; i++) {
        expect(SKIN_TYPES[i].uvThreshold).toBe(i + 1);
      }
    });
  });

  describe('DEFAULT_SKIN_TYPE', () => {
    it('is 2', () => {
      expect(DEFAULT_SKIN_TYPE).toBe(2);
    });
  });

  describe('getSkinType()', () => {
    it('returns type I for id 1', () => {
      const skin = getSkinType(1);
      expect(skin.id).toBe(1);
      expect(skin.uvThreshold).toBe(1);
    });

    it('returns type II as fallback for non-existent id 0', () => {
      const skin = getSkinType(0);
      expect(skin.id).toBe(2);
    });

    it('returns type II as fallback for out-of-range id 7', () => {
      const skin = getSkinType(7);
      expect(skin.id).toBe(2);
    });
  });

  describe('needsSunProtection()', () => {
    it('returns true when uvIndex meets threshold (skin II, UV 2)', () => {
      expect(needsSunProtection(2, 2)).toBe(true);
    });

    it('returns true when uvIndex exceeds threshold (skin II, UV 3)', () => {
      expect(needsSunProtection(2, 3)).toBe(true);
    });

    it('returns false when uvIndex is below threshold (skin II, UV 1)', () => {
      expect(needsSunProtection(2, 1)).toBe(false);
    });

    it('returns false when uvIndex is 0', () => {
      expect(needsSunProtection(1, 0)).toBe(false);
      expect(needsSunProtection(2, 0)).toBe(false);
      expect(needsSunProtection(6, 0)).toBe(false);
    });

    it('skin I needs protection at UV 1', () => {
      expect(needsSunProtection(1, 1)).toBe(true);
    });

    it('skin VI needs protection at UV ≥6', () => {
      expect(needsSunProtection(6, 5)).toBe(false);
      expect(needsSunProtection(6, 6)).toBe(true);
    });
  });
});
