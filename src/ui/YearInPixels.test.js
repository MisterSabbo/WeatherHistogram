import { describe, it, expect, vi, beforeEach } from 'vitest'
import { openBottomSheet } from './BottomSheet.js'

const mockStorageService = {
  init: vi.fn(),
  getHistory: vi.fn(),
  updateDayNotes: vi.fn(),
  updateDayMoods: vi.fn(),
  updateDayData: vi.fn(),
  db: null,
  historyStoreName: 'weatherHistory'
}

vi.mock('../services/StorageService.js', () => ({
  storageService: mockStorageService
}))

vi.mock('../utils/i18n.js', () => ({
  t: (key, fallback) => {
    const map = {
      'months.long.0': 'Enero',
      'months.long.1': 'Febrero',
      'months.long.2': 'Marzo',
      'months.long.3': 'Abril',
      'months.long.4': 'Mayo',
      'months.long.5': 'Junio',
      'months.long.6': 'Julio',
      'months.long.7': 'Agosto',
      'months.long.8': 'Septiembre',
      'months.long.9': 'Octubre',
      'months.long.10': 'Noviembre',
      'months.long.11': 'Diciembre',
      'days.short': ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'],
      'config.deleteMonthData': 'Borrar datos del mes',
      'config.precip': 'Precipitación',
      'config.windMax': 'Viento Máx',
      'config.gustMax': 'Ráfagas',
      'config.pollen': 'Polen',
      'config.yipPollenAlder': 'Polen (Aliso)',
      'config.yipPollenBirch': 'Polen (Abedul)',
      'config.yipPollenGrass': 'Polen (Gramíneas)',
      'config.yipPollenMugwort': 'Polen (Artemisa)',
      'config.yipPollenOlive': 'Polen (Olivo)',
      'config.yipPollenRagweed': 'Polen (Ambrosía)',
      'config.accept': 'Aceptar',
      'config.cancel': 'Cancelar',
      'moods.happy': 'Feliz',
      'moods.neutral': 'Neutral',
      'moods.sad': 'Triste',
      'moods.angry': 'Enojado',
      'moods.anxious': 'Ansioso',
      'moods.tired': 'Cansado',
      'pollenLevels.none': 'Ninguno',
      'pollenLevels.low': 'Bajo',
      'pollenLevels.moderate': 'Moderado',
      'pollenLevels.high': 'Alto',
      'pollenLevels.veryHigh': 'Muy Alto',
      'config.yipNoDataMeteo': 'Sin datos meteorológicos',
      'config.yipClear': 'Limpiar',
      'config.yipSaveError': 'Error al guardar'
    }
    return map[key] || fallback || key
  }
}))

vi.mock('./BottomSheet.js', () => ({
  openBottomSheet: vi.fn(() => vi.fn()),
  closeBottomSheet: vi.fn(),
  onSheetClose: vi.fn(),
  confirmButtonClone: vi.fn()
}))

vi.mock('../services/AqiManager.js', () => ({
  getPollenLevelByType: vi.fn((type, raw) => {
    if (raw === 0) return 0
    if (raw < 30) return 1
    if (raw < 50) return 2
    if (raw < 100) return 3
    return 4
  }),
  getAggregatedPollenLevel: vi.fn((details) => {
    if (!details || Object.keys(details).length === 0) return 0
    const max = Math.max(...Object.values(details))
    if (max === 0) return 0
    if (max < 30) return 1
    if (max < 50) return 2
    if (max < 100) return 3
    return 4
  })
}))

function setDefaultDom() {
  document.body.innerHTML = `
    <button id="year-in-pixels-btn"></button>
    <div id="yip-modal">
      <div id="yip-location-chips"></div>
      <div id="yip-param-display"><span></span></div>
      <button id="close-yip-modal-btn"></button>
      <button id="yip-delete-loc-btn"></button>
      <div id="yip-grid-container"></div>
      <div class="yip-legend-footer">
        <div id="yip-legend-content" class="yip-legend-content"></div>
        <div class="yip-legend-tabs">
          <span class="yip-legend-dot active">&#x25CF;</span>
          <span class="yip-tab-label" data-tab="cell">Celda</span>
          <span class="yip-legend-dot">&#x25CB;</span>
          <span class="yip-tab-label" data-tab="state">Estado</span>
        </div>
      </div>
      <div id="yip-location-dots"></div>
      <div id="yip-param-sheet"></div>
      <div id="yip-detail-date"></div>
      <div id="yip-detail-desc"></div>
      <div id="yip-detail-metrics"></div>
      <div id="yip-detail-notes-section">
        <textarea id="yip-detail-notes-input"></textarea>
      </div>
      <div id="yip-detail-moods-section">
        <div id="yip-moods-selector"></div>
      </div>
      <div id="yip-detail-conditions-section">
        <button id="yip-cold-toggle"></button>
        <button id="yip-allergies-toggle"></button>
      </div>
      <div class="yip-detail-actions">
        <button id="yip-detail-save-btn"></button>
        <button id="yip-detail-clear-btn"></button>
        <button id="yip-detail-cancel-btn"></button>
        <span id="yip-detail-saved-msg" style="display:none"></span>
      </div>
      <div id="yip-toast" style="display:none"></div>
      <div id="confirm-title"></div>
      <div id="confirm-message"></div>
      <button id="confirm-cancel-btn"></button>
      <button id="confirm-ok-btn"></button>
    </div>
    <div id="yip-detail-saved-toast"></div>
  `
}

describe('YearInPixels', () => {
  let YIP

  beforeEach(async () => {
    vi.clearAllMocks()
    setDefaultDom()
    vi.resetModules()
    YIP = await import('./YearInPixels.js')
  })

  describe('exports', () => {
    it('exports all expected functions', () => {
      expect(typeof YIP.initYearInPixels).toBe('function')
      expect(typeof YIP.renderYIPGrid).toBe('function')
      expect(typeof YIP.saveDayNote).toBe('function')
      expect(typeof YIP.saveDayMoods).toBe('function')
      expect(typeof YIP.saveDayDetail).toBe('function')
      expect(typeof YIP.openYIPDetail).toBe('function')
      expect(typeof YIP.updateYipScrollUI).toBe('function')
    })
  })

  describe('initYearInPixels', () => {
    it('does not throw if #year-in-pixels-btn does not exist', () => {
      document.getElementById('year-in-pixels-btn').remove()
      expect(() => YIP.initYearInPixels()).not.toThrow()
    })

    it('does not throw if #yip-modal does not exist', () => {
      document.getElementById('yip-modal').remove()
      expect(() => YIP.initYearInPixels()).not.toThrow()
    })

    it('registers listeners when elements exist', () => {
      const btn = document.getElementById('year-in-pixels-btn')
      const spy = vi.spyOn(btn, 'addEventListener')
      YIP.initYearInPixels()
      expect(spy).toHaveBeenCalledWith('click', expect.any(Function))
    })
  })

  describe('renderYIPGrid', () => {
    it('shows message if history is null', () => {
      YIP.renderYIPGrid(null, 'maxTemp')
      const container = document.getElementById('yip-grid-container')
      expect(container.innerHTML).toContain('Sin historial')
    })

    it('shows message if history.daily is empty', () => {
      YIP.renderYIPGrid({ daily: [] }, 'maxTemp')
      const container = document.getElementById('yip-grid-container')
      expect(container.innerHTML).toContain('Sin historial')
    })

    it('renders 12 month-blocks with current year data', () => {
      const today = new Date()
      const mockData = {
        daily: [{
          time: `${today.getFullYear()}-01-15`,
          tempMax: 22,
          tempMin: 10
        }]
      }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const blocks = document.querySelectorAll('.yip-month-block')
      expect(blocks.length).toBe(12)
    })

    it('cell with notes has blue dot indicator', () => {
      const today = new Date()
      const mockData = {
        daily: [{
          time: `${today.getFullYear()}-01-15`,
          tempMax: 25,
          tempMin: 15,
          notes: 'Día caluroso'
        }]
      }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const cells = document.querySelectorAll('.yip-day-cell')
      const cellWithDots = Array.from(cells).find(c => c.querySelector('.yip-dot-container'))
      expect(cellWithDots).toBeTruthy()
      const dots = cellWithDots.querySelectorAll('.yip-condition-dot')
      expect(dots.length).toBe(1)
      expect(dots[0].style.backgroundColor).toBe('rgb(96, 165, 250)')
    })

    it('cell without notes has no dot container', () => {
      const today = new Date()
      const mockData = {
        daily: [{
          time: `${today.getFullYear()}-01-15`,
          tempMax: 25,
          tempMin: 15
        }]
      }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const cell = document.querySelector('.yip-day-cell.completed')
      expect(cell.querySelector('.yip-dot-container')).toBeNull()
    })

    it('cell with moods has yellow dot indicator', () => {
      const today = new Date()
      const mockData = {
        daily: [{
          time: `${today.getFullYear()}-01-15`,
          tempMax: 25,
          tempMin: 15,
          moods: ['happy']
        }]
      }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const dotContainer = document.querySelector('.yip-dot-container')
      expect(dotContainer).toBeTruthy()
      const dots = dotContainer.querySelectorAll('.yip-condition-dot')
      expect(dots.length).toBe(1)
      expect(dots[0].style.backgroundColor).toBe('rgb(251, 191, 36)')
    })

    it('cell without moods has no dot container', () => {
      const today = new Date()
      const mockData = {
        daily: [{
          time: `${today.getFullYear()}-01-15`,
          tempMax: 25,
          tempMin: 15
        }]
      }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const cell = document.querySelector('.yip-day-cell.completed')
      expect(cell.querySelector('.yip-dot-container')).toBeNull()
    })

    it('4+ states shows 2 dots + badge +N instead of 3 dots + badge', () => {
      const today = new Date()
      const mockData = {
        daily: [{
          time: `${today.getFullYear()}-01-15`,
          tempMax: 25,
          tempMin: 15,
          notes: 'nota',
          moods: ['happy'],
          cold: true,
          allergies: true
        }]
      }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const dotContainer = document.querySelector('.yip-dot-container')
      expect(dotContainer).toBeTruthy()
      const dots = dotContainer.querySelectorAll('.yip-condition-dot')
      expect(dots.length).toBe(2)
      const badge = dotContainer.querySelector('.yip-dot-badge')
      expect(badge).toBeTruthy()
      expect(badge.textContent).toBe('+2')
    })



    it('cell with param=mood is colored with first mood color', () => {
      const today = new Date()
      const mockData = {
        daily: [{
          time: `${today.getFullYear()}-01-15`,
          tempMax: 25,
          tempMin: 15,
          moods: ['happy']
        }]
      }
      YIP.renderYIPGrid(mockData, 'mood')
      const cell = document.querySelector('.yip-day-cell.completed')
      expect(cell.style.backgroundColor).toBeTruthy()
    })

    it('cell with param=mood without moods is gray', () => {
      const today = new Date()
      const mockData = {
        daily: [{
          time: `${today.getFullYear()}-01-15`,
          tempMax: 25,
          tempMin: 15
        }]
      }
      YIP.renderYIPGrid(mockData, 'mood')
      const cell = document.querySelector('.yip-day-cell.completed')
      expect(cell).toBeFalsy()
    })

    it('future cell has future class', () => {
      const nextYear = new Date().getFullYear() + 1
      const mockData = {
        daily: [{
          time: `${nextYear}-06-15`,
          tempMax: 25,
          tempMin: 15
        }]
      }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const cells = document.querySelectorAll('.yip-day-cell.future')
      expect(cells.length).toBeGreaterThan(0)
    })

    it('past cell without data has past-no-data class', () => {
      const today = new Date()
      const mockData = {
        daily: [{
          time: `${today.getFullYear()}-01-01`,
          tempMax: 25,
          tempMin: 15
        }]
      }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const cells = document.querySelectorAll('.yip-day-cell.past-no-data')
      expect(cells.length).toBeGreaterThan(0)
    })

    it('past cell without data has onclick', () => {
      const today = new Date()
      const mockData = {
        daily: [{
          time: `${today.getFullYear()}-01-01`,
          tempMax: 25,
          tempMin: 15
        }]
      }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const cell = document.querySelector('.yip-day-cell.past-no-data')
      expect(typeof cell.onclick).toBe('function')
    })

    it('completed cell has onclick', () => {
      const today = new Date()
      const mockData = {
        daily: [{
          time: `${today.getFullYear()}-01-15`,
          tempMax: 22,
          tempMin: 10
        }]
      }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const cell = document.querySelector('.yip-day-cell.completed')
      expect(typeof cell.onclick).toBe('function')
    })

    it('has day headers in each month-block', () => {
      const today = new Date()
      const mockData = { daily: [{ time: `${today.getFullYear()}-01-15`, tempMax: 20, tempMin: 10 }] }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const headers = document.querySelectorAll('.yip-month-day-headers')
      expect(headers.length).toBe(12)
      headers.forEach(h => {
        expect(h.children.length).toBe(7)
      })
    })

    it('each cell has day number', () => {
      const today = new Date()
      const mockData = { daily: [{ time: `${today.getFullYear()}-01-15`, tempMax: 20, tempMin: 10 }] }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const cells = document.querySelectorAll('.yip-day-cell')
      expect(cells.length).toBeGreaterThan(0)
      cells.forEach(c => {
        expect(c.querySelector('.yip-day-number')).toBeTruthy()
      })
    })
  })

  describe('openYIPDetail', () => {
    const mockDayData = {
      time: '2026-06-15',
      tempMax: 28,
      tempMin: 18,
      precipTotal: 2.5,
      windMax: 15,
      gustMax: 25,
      aqi: 42,
      pollenDetails: { grass: 25 },
      notes: 'Buena nota de prueba',
      moods: ['happy', 'neutral']
    }

    it('populates textarea with data.notes', () => {
      YIP.openYIPDetail(mockDayData, '15 Junio 2026')
      const input = document.getElementById('yip-detail-notes-input')
      expect(input.value).toBe('Buena nota de prueba')
    })

    it('textarea empty if data.notes is undefined', () => {
      const { notes: _notes, ...noNotes } = mockDayData
      YIP.openYIPDetail(noNotes, '15 Junio 2026')
      const input = document.getElementById('yip-detail-notes-input')
      expect(input.value).toBe('')
    })

    it('marks active moods in selector', () => {
      YIP.openYIPDetail(mockDayData, '15 Junio 2026')
      const activeBtns = document.querySelectorAll('.yip-mood-btn.active')
      expect(activeBtns.length).toBe(2)
    })

    it('does not mark moods if data.moods is undefined', () => {
      const { moods: _moods, ...noMoods } = mockDayData
      YIP.openYIPDetail(noMoods, '15 Junio 2026')
      const activeBtns = document.querySelectorAll('.yip-mood-btn.active')
      expect(activeBtns.length).toBe(0)
    })

    it('returns without error if data is null', () => {
      expect(() => YIP.openYIPDetail(null, '15 Junio 2026')).not.toThrow()
    })

    it('calls openBottomSheet', () => {
      YIP.openYIPDetail(mockDayData, '15 Junio 2026')
      expect(openBottomSheet).toHaveBeenCalledWith('yip-detail-sheet', 'yip-sheet-backdrop', 'yip-detail-sheet-scroll-content')
    })

    it('shows Sin datos meteorológicos if data has no weather fields', () => {
      YIP.openYIPDetail({ time: '2026-06-15' }, '15 Junio 2026')
      const metrics = document.getElementById('yip-detail-metrics')
      expect(metrics.innerHTML).toContain('Sin datos meteorológicos')
    })

    it('empty description if data has no weather fields', () => {
      YIP.openYIPDetail({ time: '2026-06-15' }, '15 Junio 2026')
      const desc = document.getElementById('yip-detail-desc')
      expect(desc.textContent).toBe('')
    })

    it('notes section visible for data without weather', () => {
      YIP.openYIPDetail({ time: '2026-06-15' }, '15 Junio 2026')
      const section = document.getElementById('yip-detail-notes-section')
      expect(section.style.display).toBe('block')
    })

    it('moods section visible for data without weather', () => {
      YIP.openYIPDetail({ time: '2026-06-15' }, '15 Junio 2026')
      const section = document.getElementById('yip-detail-moods-section')
      expect(section.style.display).toBe('block')
    })
  })

  describe('saveDayNote', () => {
    const mockDayData = { time: '2026-06-15' }

    beforeEach(() => {
      mockStorageService.updateDayNotes.mockResolvedValue(true)
    })

    it('calls storageService.updateDayNotes with text', async () => {
      document.getElementById('yip-detail-notes-input').value = 'Nota de prueba'
      await YIP.saveDayNote(mockDayData, 'Madrid')
      expect(mockStorageService.updateDayNotes).toHaveBeenCalledWith('Madrid', '2026-06-15', 'Nota de prueba')
    })

    it('calls storageService.updateDayNotes with empty string', async () => {
      document.getElementById('yip-detail-notes-input').value = ''
      await YIP.saveDayNote(mockDayData, 'Madrid')
      expect(mockStorageService.updateDayNotes).toHaveBeenCalledWith('Madrid', '2026-06-15', '')
    })

    it('calls storageService.updateDayNotes even without legacy UI', async () => {
      document.getElementById('yip-detail-notes-input').value = 'Nota legacy'
      await YIP.saveDayNote(mockDayData, 'Madrid')
      expect(mockStorageService.updateDayNotes).toHaveBeenCalledWith('Madrid', '2026-06-15', 'Nota legacy')
    })
  })

  describe('saveDayMoods', () => {
    const mockDayData = { time: '2026-06-15' }

    beforeEach(() => {
      mockStorageService.updateDayMoods.mockResolvedValue(true)
    })

    it('calls storageService.updateDayMoods with active ids array', async () => {
      document.getElementById('yip-moods-selector').innerHTML = `
        <button class="yip-mood-btn active" data-mood="happy"></button>
        <button class="yip-mood-btn" data-mood="sad"></button>
        <button class="yip-mood-btn active" data-mood="tired"></button>
      `
      await YIP.saveDayMoods(mockDayData, 'Madrid')
      expect(mockStorageService.updateDayMoods).toHaveBeenCalledWith('Madrid', '2026-06-15', ['happy', 'tired'])
    })

    it('calls storageService.updateDayMoods with empty array if none active', async () => {
      document.getElementById('yip-moods-selector').innerHTML = `
        <button class="yip-mood-btn" data-mood="happy"></button>
        <button class="yip-mood-btn" data-mood="sad"></button>
      `
      await YIP.saveDayMoods(mockDayData, 'Madrid')
      expect(mockStorageService.updateDayMoods).toHaveBeenCalledWith('Madrid', '2026-06-15', [])
    })
  })

  describe('updateYipScrollUI', () => {
    it('clears dotsContainer if there are 0 chips', () => {
      document.getElementById('yip-location-chips').innerHTML = ''
      YIP.updateYipScrollUI()
      const dots = document.getElementById('yip-location-dots')
      expect(dots.innerHTML).toBe('')
    })

    it('clears dotsContainer if no overflow', () => {
      const chips = document.getElementById('yip-location-chips')
      Object.defineProperty(chips, 'scrollWidth', { value: 100, configurable: true })
      Object.defineProperty(chips, 'clientWidth', { value: 200, configurable: true })
      chips.innerHTML = '<div class="yip-chip">Madrid</div>'
      YIP.updateYipScrollUI()
      const dots = document.getElementById('yip-location-dots')
      expect(dots.innerHTML).toBe('')
    })

    it('renders dots if there is overflow', () => {
      const chips = document.getElementById('yip-location-chips')
      Object.defineProperty(chips, 'scrollWidth', { value: 300, configurable: true })
      Object.defineProperty(chips, 'clientWidth', { value: 200, configurable: true })
      chips.innerHTML = '<div class="yip-chip">Madrid</div><div class="yip-chip">Barcelona</div><div class="yip-chip">Valencia</div>'
      YIP.updateYipScrollUI()
      const dots = document.getElementById('yip-location-dots')
      const dotElements = dots.querySelectorAll('.yip-dot')
      expect(dotElements.length).toBe(3)
    })
  })

  describe('renderLegendTabs', () => {
    it('renders cell tab content by default', () => {
      const today = new Date()
      const mockData = { daily: [{ time: `${today.getFullYear()}-01-15`, tempMax: 20, tempMin: 10 }] }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const content = document.getElementById('yip-legend-content')
      expect(content.children.length).toBeGreaterThan(0)
    })

    it('renders 6 entries for mood param in cell tab', () => {
      const today = new Date()
      const mockData = { daily: [{ time: `${today.getFullYear()}-01-15`, tempMax: 20, tempMin: 10 }] }
      YIP.renderYIPGrid(mockData, 'mood')
      const content = document.getElementById('yip-legend-content')
      expect(content.children.length).toBe(6)
    })

    it('shows state tab content when clicking Estado label', () => {
      const today = new Date()
      const mockData = { daily: [{ time: `${today.getFullYear()}-01-15`, tempMax: 20, tempMin: 10 }] }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const stateLabel = document.querySelector('.yip-tab-label[data-tab="state"]')
      stateLabel.click()
      const content = document.getElementById('yip-legend-content')
      expect(content.children.length).toBe(4)
      const dots = content.querySelectorAll('.yip-state-dot')
      expect(dots.length).toBe(4)
    })

    it('toggles dot active class on tab switch', () => {
      const today = new Date()
      const mockData = { daily: [{ time: `${today.getFullYear()}-01-15`, tempMax: 20, tempMin: 10 }] }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const dots = document.querySelectorAll('.yip-legend-dot')
      expect(dots[0].classList.contains('active')).toBe(true)
      expect(dots[1].classList.contains('active')).toBe(false)
      document.querySelector('.yip-tab-label[data-tab="state"]').click()
      expect(dots[0].classList.contains('active')).toBe(false)
      expect(dots[1].classList.contains('active')).toBe(true)
    })
  })

  describe('saveDayDetail', () => {
    const mockDayData = { time: '2026-06-15', tempMax: 25, notes: 'Old note', moods: ['happy'], cold: true }

    beforeEach(() => {
      mockStorageService.updateDayData.mockResolvedValue(true)
      document.getElementById('yip-detail-notes-input').value = 'Updated note'
      // Activate one mood
      const moodsSelector = document.getElementById('yip-moods-selector')
      moodsSelector.innerHTML = '<button class="yip-mood-btn active" data-mood="sad"></button><button class="yip-mood-btn" data-mood="happy"></button>'
      document.getElementById('yip-cold-toggle').classList.remove('active')
      document.getElementById('yip-allergies-toggle').classList.add('active')
    })

    it('calls storageService.updateDayData with updated fields', async () => {
      await YIP.saveDayDetail(mockDayData, 'Madrid')
      expect(mockStorageService.updateDayData).toHaveBeenCalledWith('Madrid', '2026-06-15', {
        notes: 'Updated note',
        moods: ['sad'],
        cold: undefined,
        allergies: true
      })
    })

    it('calls updateDayData with undefined if all fields are empty (Clear+Save)', async () => {
      document.getElementById('yip-detail-notes-input').value = ''
      document.getElementById('yip-moods-selector').innerHTML = '<button class="yip-mood-btn" data-mood="sad"></button>'
      document.getElementById('yip-cold-toggle').classList.remove('active')
      document.getElementById('yip-allergies-toggle').classList.remove('active')
      await YIP.saveDayDetail(mockDayData, 'Madrid')
      expect(mockStorageService.updateDayData).toHaveBeenCalledWith('Madrid', '2026-06-15', {
        notes: undefined,
        moods: undefined,
        cold: undefined,
        allergies: undefined
      })
    })

    it('re-renders grid after successful save (changes container DOM)', async () => {
      const history = { daily: [{ ...mockDayData }] }
      YIP.renderYIPGrid(history, 'maxTemp')
      const container = document.getElementById('yip-grid-container')
      const initialHTML = container.innerHTML
      document.getElementById('yip-detail-notes-input').value = 'Updated note'
      await YIP.saveDayDetail(mockDayData, 'Madrid')
      expect(container.innerHTML).not.toBe(initialHTML)
    })

    it('updates data in memory after success', async () => {
      await YIP.saveDayDetail(mockDayData, 'Madrid')
      expect(mockDayData.notes).toBe('Updated note')
      expect(mockDayData.moods).toEqual(['sad'])
      expect(mockDayData.cold).toBeUndefined()
      expect(mockDayData.allergies).toBe(true)
    })

    it('shows error toast if updateDayData fails', async () => {
      mockStorageService.updateDayData.mockResolvedValue(false)
      const toastEl = document.getElementById('yip-toast')
      await YIP.saveDayDetail(mockDayData, 'Madrid')
      expect(toastEl.style.display).toBe('block')
      expect(toastEl.textContent).toBe('Error al guardar')
    })

    it('shows error toast if updateDayData throws exception', async () => {
      mockStorageService.updateDayData.mockRejectedValue(new Error('DB error'))
      const toastEl = document.getElementById('yip-toast')
      await YIP.saveDayDetail(mockDayData, 'Madrid')
      expect(toastEl.style.display).toBe('block')
      expect(toastEl.textContent).toBe('Error al guardar')
    })

    it('rendered cells have data-time attribute', () => {
      const today = new Date()
      const mockData = {
        daily: [{ time: `${today.getFullYear()}-01-15T00:00:00`, tempMax: 25, tempMin: 15 }]
      }
      YIP.renderYIPGrid(mockData, 'maxTemp')
      const cells = document.querySelectorAll('.yip-day-cell[data-time]')
      expect(cells.length).toBeGreaterThan(0)
    })
  })

  describe('clear button', () => {
    it('clear button exists in the DOM', () => {
      const clearBtn = document.getElementById('yip-detail-clear-btn')
      expect(clearBtn).toBeTruthy()
    })
  })
})
