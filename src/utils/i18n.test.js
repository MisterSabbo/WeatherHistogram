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

  describe('config.dataUpdated', () => {
    it('returns "Datos actualizados" in Spanish', () => {
      expect(t('config.dataUpdated')).toBe('Datos actualizados');
    });

    it('returns "Data updated" in English', () => {
      setLanguage('en');
      expect(t('config.dataUpdated')).toBe('Data updated');
    });
  });

  describe('YIP notes keys', () => {
    it('returns yipNotesLabel in Spanish', () => {
      expect(t('config.yipNotesLabel')).toMatch(/Notas personales/);
    });

    it('returns yipNotesLabel in English after language change', () => {
      setLanguage('en');
      expect(t('config.yipNotesLabel')).toMatch(/Personal notes/);
    });

    it('returns yipNotesSave text', () => {
      expect(t('config.yipNotesSave')).toMatch(/Guardar/);
    });

    it('returns yipNotesPlaceholder text', () => {
      expect(t('config.yipNotesPlaceholder')).toMatch(/notas/);
    });

    it('returns yipNotesSaved text', () => {
      expect(t('config.yipNotesSaved')).toMatch(/guardada/);
    });

    it('returns yipNotesDelete text', () => {
      expect(t('config.yipNotesDelete')).toMatch(/Eliminar/);
    });

    it('returns yipNotesCancel text', () => {
      expect(t('config.yipNotesCancel')).toMatch(/Cancel/);
    });
  });

  describe('YIP mood keys', () => {
    it('returns mood.happy in Spanish', () => {
      expect(t('moods.happy')).toMatch(/Feliz/);
    });

    it('returns mood.happy in English after language change', () => {
      setLanguage('en');
      expect(t('moods.happy')).toMatch(/Happy/);
    });

    it('returns all mood labels in Spanish', () => {
      expect(t('moods.neutral')).toMatch(/Neutral/);
      expect(t('moods.sad')).toMatch(/Triste/);
      expect(t('moods.angry')).toMatch(/Enfadado/);
      expect(t('moods.anxious')).toMatch(/Ansioso/);
      expect(t('moods.tired')).toMatch(/Cansado/);
    });

    it('returns config.yipMoodsLabel text', () => {
      expect(t('config.yipMoodsLabel')).toMatch(/ánimo/);
    });

    it('returns config.yipMoodsSave text', () => {
      expect(t('config.yipMoodsSave')).toMatch(/Guardar/);
    });

    it('returns config.yipMoodsSaved text', () => {
      expect(t('config.yipMoodsSaved')).toMatch(/guardado/);
    });

    it('returns config.yipMoodsParam text', () => {
      expect(t('config.yipMoodsParam')).toMatch(/Ánimo/);
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
