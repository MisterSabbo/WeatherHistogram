import { describe, it, expect, vi, beforeEach } from 'vitest';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; })
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

let setLanguage, getLanguage, t, getLocale, applyTranslations;

beforeEach(async () => {
  localStorageMock.clear();
  vi.resetModules();
  const mod = await import('./i18n.js');
  setLanguage = mod.setLanguage;
  getLanguage = mod.getLanguage;
  t = mod.t;
  getLocale = mod.getLocale;
  applyTranslations = mod.applyTranslations;
});

describe('i18n', () => {
  describe('t()', () => {
    it('returns translated string for a simple key', () => {
      expect(t('config.language')).toMatch(/Idioma/);
    });

    it('returns translated string for a nested key', () => {
      expect(t('days.short.0')).toBe('DOM');
    });

    it('returns fallback when key does not exist', () => {
      expect(t('nonexistent.key', 'fallback')).toBe('fallback');
    });

    it('returns the key itself when key does not exist and no fallback', () => {
      expect(t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('translates weatherCodes.0 correctly', () => {
      expect(t('weatherCodes.0')).toBe('Despejado');
    });
  });

  describe('getLanguage() / setLanguage()', () => {
    it('defaults to es', () => {
      expect(getLanguage()).toBe('es');
    });

    it('changes language and persists to localStorage', () => {
      setLanguage('en');
      expect(getLanguage()).toBe('en');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('weatherhist_language', 'en');
    });

    it('does not change language for unsupported lang', () => {
      setLanguage('fr');
      expect(getLanguage()).toBe('es');
    });

    it('updates translations after language change', () => {
      setLanguage('en');
      expect(t('config.language')).toMatch(/Language/);
    });
  });

  describe('getLocale()', () => {
    it('returns es-ES for Spanish', () => {
      expect(getLocale()).toBe('es-ES');
    });

    it('returns en-US for English', () => {
      setLanguage('en');
      expect(getLocale()).toBe('en-US');
    });
  });

  describe('applyTranslations()', () => {
    it('updates textContent for data-i18n elements', () => {
      setLanguage('es');
      document.body.innerHTML = '<span data-i18n="config.language"></span>';
      applyTranslations();
      expect(document.querySelector('[data-i18n]').textContent).toMatch(/Idioma/);
    });

    it('updates placeholder for data-i18n-placeholder elements', () => {
      setLanguage('es');
      document.body.innerHTML = '<input data-i18n-placeholder="search.placeholder" />';
      applyTranslations();
      expect(document.querySelector('[data-i18n-placeholder]').getAttribute('placeholder')).toMatch(/Buscar/);
    });

    it('updates title for data-i18n-title elements', () => {
      setLanguage('es');
      document.body.innerHTML = '<div data-i18n-title="config.loading"></div>';
      applyTranslations();
      expect(document.querySelector('[data-i18n-title]').getAttribute('title')).toMatch(/Cargando/);
    });
  });
});
