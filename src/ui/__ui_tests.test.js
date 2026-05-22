import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../store.js', () => ({
  state: { theme: 'light', hourlyData: [{ time: 1000, temp: 15, apparent: 13, wind: 10, windDir: 180, clouds: 50, precip: 0, precipProb: 0, aqi: 30, aqiDetails: null, pollen: 2, pollenDetails: null, weatherCode: 0, localHour: 12, isNight: false }], timezone: 'UTC' },
  CONFIG: {}
}));

vi.mock('../utils/i18n.js', () => ({
  t: vi.fn((k) => {
    const map = { 'pollen.alder': 'Aliso', 'pollen.birch': 'Abedul', 'pollen.grass': 'Gramíneas', 'pollen.mugwort': 'Artemisa', 'pollen.olive': 'Olivo', 'pollen.ragweed': 'Ambrosía', 'pollen.noData': 'S/D', 'aqi.title': 'Air Quality', 'topPanel.today': 'TODAY', 'map.noFavorites': 'No favorites', 'moods.happy': 'Feliz', 'moods.neutral': 'Neutral', 'moods.sad': 'Triste', 'moods.angry': 'Enfadado', 'moods.anxious': 'Ansioso', 'moods.tired': 'Cansado', 'config.yipMoodsSave': 'Guardar estado', 'config.yipMoodsSaved': '¡Estado guardado!' };
    return map[k] || k;
  }),
  getLocale: vi.fn(() => 'es-ES')
}));

vi.mock('../theme.js', () => ({
  getThemeIcon: vi.fn((key, fallback) => {
    const map = { 'dailyCards.clear': 'clear_day', 'dailyCards.cloudy': 'cloud', 'dailyCards.fog': 'foggy', 'dailyCards.rain': 'rainy', 'dailyCards.snow': 'ac_unit', 'dailyCards.thunderstorm': 'thunderstorm' };
    return map[key] || fallback || 'clear_day';
  })
}));

vi.mock('../utils/time.js', () => ({
  formatTooltipTime: vi.fn(() => ({ timeStr: '12:00', dateStr: '14/11', isToday: true }))
}));

vi.mock('../utils/weather.js', () => ({
  getWeatherDescription: vi.fn(() => 'Clear')
}));

vi.mock('../services/AqiManager.js', () => ({
  getAQIInfo: vi.fn(() => ({ text: 'Good', rec: '', val: 30 })),
  getPollenText: vi.fn(() => 'Low'),
  getAggregatedPollenLevel: vi.fn(() => 0),
  getPollenLevelByType: vi.fn(() => 0),
  getPollenColor: vi.fn(() => '#000')
}));

vi.mock('../utils/AlertEngine.js', () => ({
  generateAlerts: vi.fn(() => ({ alerts: [], alertLevel: 0 })),
  renderAlerts: vi.fn()
}));

vi.mock('./AqiRadar.js', () => ({
  drawAQIRadar: vi.fn()
}));

vi.mock('./PollenRadar.js', () => ({
  drawPollenRadar: vi.fn()
}));

describe('AqiRadar', () => {
  let drawAQIRadar;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./AqiRadar.js');
    drawAQIRadar = mod.drawAQIRadar;
  });

  it('does not throw when canvas does not exist', () => {
    expect(() => drawAQIRadar({ aqiDetails: { pm10: 10, pm2_5: 5, ozone: 50, nitrogen_dioxide: 20 } })).not.toThrow();
  });

  it('returns early when no aqiDetails', () => {
    expect(() => drawAQIRadar({})).not.toThrow();
  });

  it('returns early when canvas exists but no aqiDetails', () => {
    document.body.innerHTML = '<canvas id="aqi-radar" width="200" height="200"></canvas>';
    expect(() => drawAQIRadar({})).not.toThrow();
  });

  it('draws on canvas when elements exist', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'aqi-radar';
    canvas.width = 200;
    canvas.height = 200;
    document.body.appendChild(canvas);

    const ctx = {
      clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
      closePath: vi.fn(), stroke: vi.fn(), fill: vi.fn(), arc: vi.fn(),
      measureText: vi.fn(() => ({ width: 10 })),
      fillText: vi.fn(), save: vi.fn(), restore: vi.fn(),
      font: '', fillStyle: '', strokeStyle: '', lineWidth: 1,
      textAlign: 'start', textBaseline: 'alphabetic',
      shadowColor: '', shadowBlur: 0
    };
    canvas.getContext = vi.fn(() => ctx);

    expect(() => drawAQIRadar({
      aqiDetails: { pm10: 10, pm2_5: 5, ozone: 50, nitrogen_dioxide: 20 }
    })).not.toThrow();

    document.body.removeChild(canvas);
  });
});

describe('PollenRadar', () => {
  let drawPollenRadar;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./PollenRadar.js');
    drawPollenRadar = mod.drawPollenRadar;
  });

  it('does not throw when canvas does not exist', () => {
    expect(() => drawPollenRadar({ pollenDetails: { alder: 10, birch: 5, grass: 15, mugwort: 3, olive: 8, ragweed: 2 } })).not.toThrow();
  });

  it('returns early when no pollenDetails', () => {
    expect(() => drawPollenRadar({})).not.toThrow();
  });

  it('draws on canvas when elements exist', () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'pollen-radar';
    canvas.width = 200;
    canvas.height = 200;
    document.body.appendChild(canvas);

    const ctx = {
      clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
      closePath: vi.fn(), stroke: vi.fn(), fill: vi.fn(), arc: vi.fn(),
      measureText: vi.fn(() => ({ width: 10 })),
      fillText: vi.fn(), save: vi.fn(), restore: vi.fn(),
      font: '', fillStyle: '', strokeStyle: '', lineWidth: 1,
      textAlign: 'start', textBaseline: 'alphabetic',
      shadowColor: '', shadowBlur: 0
    };
    canvas.getContext = vi.fn(() => ctx);

    expect(() => drawPollenRadar({
      pollenDetails: { alder: 10, birch: 5, grass: 15, mugwort: 3, olive: 8, ragweed: 2 }
    })).not.toThrow();

    document.body.removeChild(canvas);
  });
});

describe('TopPanel', () => {
  let updateTopPanel;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('./TopPanel.js');
    updateTopPanel = mod.updateTopPanel;
  });

  it('does not throw with mock data and scrollContainer', () => {
    const origGetElementById = document.getElementById.bind(document);
    const origQuerySelector = document.querySelector.bind(document);
    try {
      const scrollContainer = { scrollLeft: 0 };
      const elements = {};
      ['val-temp', 'val-apparent', 'weather-summary', 'current-time-display', 'tt-location', 'tt-summary',
       'val-wind', 'wind-arrow', 'wind-compass', 'val-aqi', 'header-aqi-icon', 'aqi-header-info',
       'aqi-modal-header-info', 'aqi-radar', 'aqi-modal-radar', 'val-pollen', 'header-pollen-icon',
       'pollen-radar', 'pollen-modal-radar', 'val-precip', 'val-precip-prob', 'val-clouds',
       'updateScrollIndicator'
      ].forEach(id => {
        elements[id] = { innerHTML: '', innerText: '', style: {}, querySelector: vi.fn(() => ({ innerText: '' })), dataset: {}, firstElementChild: { style: {} } };
      });
      document.getElementById = vi.fn((id) => elements[id] || null);
      document.querySelector = vi.fn(() => ({ innerText: '' }));
      window.updateScrollIndicator = vi.fn();
      expect(() => updateTopPanel({ scrollContainer, PIXELS_PER_HOUR: 60 })).not.toThrow();
    } finally {
      document.getElementById = origGetElementById;
      document.querySelector = origQuerySelector;
    }
  });
});

describe('FavoritesModal', () => {
  let initFavoritesModal;

  beforeEach(async () => {
    vi.clearAllMocks();
    document.body.innerHTML = '<div id="favorites-modal"><button id="close-favorites-btn">X</button><div id="favorites-list"></div></div>';
    const mod = await import('./FavoritesModal.js');
    initFavoritesModal = mod.initFavoritesModal;
  });

  it('does not throw when DOM elements are missing', () => {
    expect(() => initFavoritesModal(vi.fn())).not.toThrow();
  });
});

describe('YearInPixels', () => {
  let initYearInPixels, saveDayNote, saveDayMoods, openYIPDetail, renderYIPGrid;

  beforeEach(async () => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
    const mod = await import('./YearInPixels.js');
    initYearInPixels = mod.initYearInPixels;
    saveDayNote = mod.saveDayNote;
    saveDayMoods = mod.saveDayMoods;
    openYIPDetail = mod.openYIPDetail;
    renderYIPGrid = mod.renderYIPGrid;
  });

  it('does not throw when DOM elements are missing', () => {
    expect(() => initYearInPixels()).not.toThrow();
  });

  it('openYIPDetail populates textarea when data has notes', () => {
    document.body.innerHTML = `
      <div id="yip-detail-date"></div>
      <div id="yip-detail-desc"></div>
      <div id="yip-detail-metrics"></div>
      <div id="yip-detail-notes-section" style="display:none">
        <label>Personal notes</label>
        <textarea id="yip-detail-notes-input"></textarea>
        <div class="yip-notes-actions">
          <button id="yip-notes-save-btn">Save</button>
          <button id="yip-notes-cancel-btn">Cancel</button>
        </div>
        <span id="yip-notes-saved-msg" style="display:none">Saved</span>
      </div>
    `;
    const data = { time: 1000, tempMax: 25, notes: 'my personal note' };
    openYIPDetail(data, '1 Jan 2026', 'TestCity');
    const textarea = document.getElementById('yip-detail-notes-input');
    const section = document.getElementById('yip-detail-notes-section');
    expect(section.style.display).not.toBe('none');
    expect(textarea.value).toBe('my personal note');
  });

  it('openYIPDetail shows empty textarea when data has no notes', () => {
    document.body.innerHTML = `
      <div id="yip-detail-date"></div>
      <div id="yip-detail-desc"></div>
      <div id="yip-detail-metrics"></div>
      <div id="yip-detail-notes-section" style="display:none">
        <label>Personal notes</label>
        <textarea id="yip-detail-notes-input"></textarea>
        <div class="yip-notes-actions">
          <button id="yip-notes-save-btn">Save</button>
          <button id="yip-notes-cancel-btn">Cancel</button>
        </div>
        <span id="yip-notes-saved-msg" style="display:none">Saved</span>
      </div>
    `;
    const data = { time: 1000, tempMax: 25 };
    openYIPDetail(data, '1 Jan 2026', 'TestCity');
    const textarea = document.getElementById('yip-detail-notes-input');
    expect(textarea.value).toBe('');
  });

  it('saveDayNote calls storageService.updateDayNotes with text', async () => {
    document.body.innerHTML = `
      <textarea id="yip-detail-notes-input"></textarea>
      <span id="yip-notes-saved-msg" style="display:none"></span>
      <button id="yip-notes-cancel-btn">Cancel</button>
    `;
    const mockUpdate = vi.fn(async () => true);
    const storageMod = await import('../services/StorageService.js');
    storageMod.storageService.updateDayNotes = mockUpdate;

    const data = { time: 1000, notes: undefined };
    document.getElementById('yip-detail-notes-input').value = 'hello';
    await saveDayNote(data, 'TestCity');
    expect(mockUpdate).toHaveBeenCalledWith('TestCity', 1000, 'hello');
    expect(data.notes).toBe('hello');
  });

  it('saveDayNote with empty text clears notes field', async () => {
    document.body.innerHTML = `
      <textarea id="yip-detail-notes-input"></textarea>
      <span id="yip-notes-saved-msg" style="display:none"></span>
      <button id="yip-notes-cancel-btn">Cancel</button>
    `;
    const mockUpdate = vi.fn(async () => true);
    const storageMod = await import('../services/StorageService.js');
    storageMod.storageService.updateDayNotes = mockUpdate;

    const data = { time: 1000, notes: 'old note' };
    document.getElementById('yip-detail-notes-input').value = '';
    await saveDayNote(data, 'TestCity');
    expect(mockUpdate).toHaveBeenCalledWith('TestCity', 1000, '');
    expect(data.notes).toBeUndefined();
  });

  it('renderYIPGrid adds has-notes class and icon when day has notes', () => {
    document.body.innerHTML = '<div id="yip-grid-container"></div><div id="yip-legend"></div>';
    const currentYear = new Date().getFullYear();
    const jan1 = new Date(currentYear, 0, 1).getTime();
    const history = {
      daily: [{ time: jan1, tempMax: 20, notes: 'my note' }]
    };
    renderYIPGrid(history, 'maxTemp');
    const cell = document.querySelector('.yip-day-cell');
    expect(cell).not.toBeNull();
    expect(cell.classList.contains('has-notes')).toBe(true);
    expect(cell.innerHTML).toContain('sticky_note_2');
  });

  it('renderYIPGrid does not add notes icon when day has no notes', () => {
    document.body.innerHTML = '<div id="yip-grid-container"></div><div id="yip-legend"></div>';
    const currentYear = new Date().getFullYear();
    const jan1 = new Date(currentYear, 0, 1).getTime();
    const history = {
      daily: [{ time: jan1, tempMax: 20 }]
    };
    renderYIPGrid(history, 'maxTemp');
    const cell = document.querySelector('.yip-day-cell');
    expect(cell).not.toBeNull();
    expect(cell.classList.contains('has-notes')).toBe(false);
    expect(cell.innerHTML).not.toContain('sticky_note_2');
  });

  it('renderYIPGrid with param=mood colors cell by first mood', () => {
    document.body.innerHTML = '<div id="yip-grid-container"></div><div id="yip-legend"></div>';
    const currentYear = new Date().getFullYear();
    const jan1 = new Date(currentYear, 0, 1).getTime();
    const history = {
      daily: [{ time: jan1, tempMax: 20, moods: ['happy', 'tired'] }]
    };
    renderYIPGrid(history, 'mood');
    const cell = document.querySelector('.yip-day-cell');
    expect(cell).not.toBeNull();
    expect(cell.classList.contains('completed')).toBe(true);
    expect(cell.style.backgroundColor).toBeTruthy();
  });

  it('renderYIPGrid with param=mood shows empty cell when no moods', () => {
    document.body.innerHTML = '<div id="yip-grid-container"></div><div id="yip-legend"></div>';
    const currentYear = new Date().getFullYear();
    const jan1 = new Date(currentYear, 0, 1).getTime();
    const history = {
      daily: [{ time: jan1, tempMax: 20 }]
    };
    renderYIPGrid(history, 'mood');
    const cell = document.querySelector('.yip-day-cell');
    expect(cell).not.toBeNull();
    expect(cell.classList.contains('completed')).toBe(false);
  });

  it('renderYIPGrid shows mood emoji icon when day has moods', () => {
    document.body.innerHTML = '<div id="yip-grid-container"></div><div id="yip-legend"></div>';
    const currentYear = new Date().getFullYear();
    const jan1 = new Date(currentYear, 0, 1).getTime();
    const history = {
      daily: [{ time: jan1, tempMax: 20, moods: ['happy'] }]
    };
    renderYIPGrid(history, 'maxTemp');
    const cell = document.querySelector('.yip-day-cell');
    expect(cell).not.toBeNull();
    expect(cell.classList.contains('has-mood')).toBe(true);
    expect(cell.innerHTML).toContain('yip-mood-icon');
  });

  it('renderYIPGrid shows both mood icon and notes icon when both exist', () => {
    document.body.innerHTML = '<div id="yip-grid-container"></div><div id="yip-legend"></div>';
    const currentYear = new Date().getFullYear();
    const jan1 = new Date(currentYear, 0, 1).getTime();
    const history = {
      daily: [{ time: jan1, tempMax: 20, moods: ['happy'], notes: 'my note' }]
    };
    renderYIPGrid(history, 'maxTemp');
    const cell = document.querySelector('.yip-day-cell');
    expect(cell).not.toBeNull();
    expect(cell.classList.contains('has-mood')).toBe(true);
    expect(cell.classList.contains('has-notes')).toBe(true);
    expect(cell.innerHTML).toContain('yip-mood-icon');
    expect(cell.innerHTML).toContain('sticky_note_2');
  });

  it('openYIPDetail shows mood toggles when data has moods', () => {
    document.body.innerHTML = `
      <div id="yip-detail-date"></div>
      <div id="yip-detail-desc"></div>
      <div id="yip-detail-metrics"></div>
      <div id="yip-detail-notes-section" style="display:none"><label>Notes</label><textarea id="yip-detail-notes-input"></textarea></div>
      <div id="yip-detail-moods-section" style="display:none"><label>Mood</label><div id="yip-moods-selector"></div><div class="yip-moods-actions"><button id="yip-moods-save-btn">Save</button><button id="yip-moods-cancel-btn">Cancel</button></div><span id="yip-moods-saved-msg" style="display:none">Saved</span></div>
    `;
    const data = { time: 1000, tempMax: 25, moods: ['happy', 'tired'] };
    openYIPDetail(data, '1 Jan 2026', 'TestCity');
    const moodBtns = document.querySelectorAll('.yip-mood-btn');
    expect(moodBtns.length).toBe(6);
    const activeBtns = document.querySelectorAll('.yip-mood-btn.active');
    expect(activeBtns.length).toBe(2);
  });

  it('openYIPDetail shows no active mood toggles when data has no moods', () => {
    document.body.innerHTML = `
      <div id="yip-detail-date"></div>
      <div id="yip-detail-desc"></div>
      <div id="yip-detail-metrics"></div>
      <div id="yip-detail-notes-section" style="display:none"><label>Notes</label><textarea id="yip-detail-notes-input"></textarea></div>
      <div id="yip-detail-moods-section" style="display:none"><label>Mood</label><div id="yip-moods-selector"></div><div class="yip-moods-actions"><button id="yip-moods-save-btn">Save</button><button id="yip-moods-cancel-btn">Cancel</button></div><span id="yip-moods-saved-msg" style="display:none">Saved</span></div>
    `;
    const data = { time: 1000, tempMax: 25 };
    openYIPDetail(data, '1 Jan 2026', 'TestCity');
    const activeBtns = document.querySelectorAll('.yip-mood-btn.active');
    expect(activeBtns.length).toBe(0);
  });

  it('saveDayMoods calls storageService.updateDayMoods with selected moods', async () => {
    document.body.innerHTML = `
      <div id="yip-moods-selector">
        <button class="yip-mood-btn active" data-mood="happy">😊 Feliz</button>
        <button class="yip-mood-btn active" data-mood="tired">😴 Cansado</button>
        <button class="yip-mood-btn" data-mood="sad">😢 Triste</button>
      </div>
      <span id="yip-moods-saved-msg" style="display:none"></span>
    `;
    const mockUpdate = vi.fn(async () => true);
    const storageMod = await import('../services/StorageService.js');
    storageMod.storageService.updateDayMoods = mockUpdate;

    const data = { time: 1000 };
    await saveDayMoods(data, 'TestCity');
    expect(mockUpdate).toHaveBeenCalledWith('TestCity', 1000, ['happy', 'tired']);
    expect(data.moods).toEqual(['happy', 'tired']);
  });

  describe('updateYipScrollUI', () => {
    let updateYipScrollUI;

    beforeEach(async () => {
      const mod = await import('./YearInPixels.js');
      updateYipScrollUI = mod.updateYipScrollUI;
    });

    function setupChips(count) {
      document.body.innerHTML = `
        <div id="yip-location-chips" style="display:flex;gap:6px;overflow-x:auto;width:200px;">
          ${Array.from({ length: count }, (_, i) => `<div class="yip-chip" data-value="loc${i}">Location ${i}</div>`).join('')}
        </div>
        <div id="yip-location-dots" class="yip-dots-container"></div>
      `;
    }

    it('clears dots when there are no chips', () => {
      setupChips(0);
      updateYipScrollUI();
      const dots = document.getElementById('yip-location-dots');
      expect(dots.innerHTML).toBe('');
    });

    it('renders exactly one dot per chip', () => {
      setupChips(3);
      updateYipScrollUI();
      const dots = document.querySelectorAll('.yip-dot');
      expect(dots.length).toBe(3);
    });

    it('marks first dot as active by default', () => {
      setupChips(4);
      updateYipScrollUI();
      const dots = document.querySelectorAll('.yip-dot');
      expect(dots[0].classList.contains('active')).toBe(true);
      expect(dots[1].classList.contains('active')).toBe(false);
    });

    it('renders dots even without overflow (no scroll needed)', () => {
      setupChips(2);
      updateYipScrollUI();
      const dots = document.querySelectorAll('.yip-dot');
      expect(dots.length).toBe(2);
    });

    it('updates active dot based on scroll position', () => {
      setupChips(5);
      const container = document.getElementById('yip-location-chips');
      const chips = container.querySelectorAll('.yip-chip');

      // Mock getBoundingClientRect so chips are at known positions
      // Container is at left=0, chips at left=0,60,120,180,240
      const chipRects = [
        { left: 0, right: 50, width: 50 },
        { left: 60, right: 110, width: 50 },
        { left: 120, right: 170, width: 50 },
        { left: 180, right: 230, width: 50 },
        { left: 240, right: 290, width: 50 }
      ];
      chips.forEach((chip, i) => {
        chip.getBoundingClientRect = vi.fn(() => ({
          top: 0, bottom: 30, height: 30,
          left: chipRects[i].left,
          right: chipRects[i].right,
          width: chipRects[i].width,
          x: chipRects[i].left, y: 0,
          toJSON() { return this; }
        }));
      });

      // Container getBoundingClientRect at left=0
      container.getBoundingClientRect = vi.fn(() => ({
        top: 0, bottom: 30, height: 30,
        left: 0, right: 200, width: 200,
        x: 0, y: 0,
        toJSON() { return this; }
      }));

      // Scroll so center is ~100 → between chip 1 (center at 25) and chip 2 (center at 85)
      // Chip 1 center: 60+25=85, Chip 2 center: 120+25=145
      // Container center: 0+200/2=100
      // chip0: |0-100|=100, chip1: |85-100|=15, chip2: |145-100|=45
      // chip1 (index 1) should be active
      container.scrollLeft = 0;
      updateYipScrollUI();
      const dots = document.querySelectorAll('.yip-dot');
      expect(dots[1].classList.contains('active')).toBe(true);
      expect(dots[0].classList.contains('active')).toBe(false);
      expect(dots[2].classList.contains('active')).toBe(false);
    });
  });

  it('saveDayMoods with no moods selected clears moods', async () => {
    document.body.innerHTML = `
      <div id="yip-moods-selector">
        <button class="yip-mood-btn" data-mood="happy">😊 Feliz</button>
        <button class="yip-mood-btn" data-mood="tired">😴 Cansado</button>
      </div>
      <span id="yip-moods-saved-msg" style="display:none"></span>
    `;
    const mockUpdate = vi.fn(async () => true);
    const storageMod = await import('../services/StorageService.js');
    storageMod.storageService.updateDayMoods = mockUpdate;

    const data = { time: 1000, moods: ['happy'] };
    await saveDayMoods(data, 'TestCity');
    expect(mockUpdate).toHaveBeenCalledWith('TestCity', 1000, []);
    expect(data.moods).toBeUndefined();
  });
});

describe('DailyCards', () => {
  let mod;

  beforeEach(async () => {
    vi.clearAllMocks();
    mod = await import('./DailyCards.js');
  });

  describe('getWeatherIconSVG', () => {
    it('returns clear_day for code 0', () => {
      const svg = mod.getWeatherIconSVG(0);
      expect(svg).toContain('clear_day');
    });

    it('returns cloud for codes 1-3', () => {
      expect(mod.getWeatherIconSVG(1)).toContain('cloud');
      expect(mod.getWeatherIconSVG(3)).toContain('cloud');
    });

    it('returns foggy for codes 45/48', () => {
      expect(mod.getWeatherIconSVG(45)).toContain('foggy');
    });

    it('returns rainy for rain codes', () => {
      expect(mod.getWeatherIconSVG(61)).toContain('rainy');
    });

    it('returns ac_unit for snow codes', () => {
      expect(mod.getWeatherIconSVG(71)).toContain('ac_unit');
    });

    it('returns thunderstorm for codes >=95', () => {
      expect(mod.getWeatherIconSVG(95)).toContain('thunderstorm');
    });
  });

  describe('generateDailyCards', () => {
    it('does not throw when container is missing', () => {
      expect(() => mod.generateDailyCards(vi.fn())).not.toThrow();
    });
  });

  describe('updateActiveDailyCard', () => {
    it('does not throw when containers are missing', () => {
      expect(() => mod.updateActiveDailyCard()).not.toThrow();
    });
  });
});
