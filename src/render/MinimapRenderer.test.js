import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MinimapRenderer } from './MinimapRenderer.js'

vi.mock('../utils/time.js', () => ({
  getSplitIndex: vi.fn(() => 12)
}))

vi.mock('../theme.js', () => ({
  getThemeColor: vi.fn((k, fallback) => fallback),
  getThemeFont: vi.fn(() => 'sans-serif')
}))

vi.mock('../utils/math.js', () => ({
  normalizeY: vi.fn(() => 100)
}))

if (typeof Path2D === 'undefined') {
  globalThis.Path2D = class {
    constructor() { this.commands = [] }
    moveTo() {}
    lineTo() {}
    closePath() {}
  };
}

const mockCreateElement = document.createElement.bind(document)
document.createElement = (tag, options) => {
  if (tag === 'canvas') {
    const mock = createMockCanvas()
    return mock.canvas
  }
  return mockCreateElement(tag, options)
}

function createMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    measureText: vi.fn(() => ({ width: 30 })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    resetTransform: vi.fn(),
    drawImage: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    getContext: vi.fn(() => null),
    shadowBlur: 0,
    shadowColor: '',
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 1,
    font: ''
  }
}

function createMockCanvas() {
  const ctx = createMockCtx()
  const canvas = {
    width: 0,
    height: 0,
    style: { width: '', height: '' },
    clientWidth: 800,
    clientHeight: 80,
    parentElement: { clientWidth: 800 },
    getContext: vi.fn(() => ctx),
    getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 800, height: 80, right: 800, bottom: 80 })),
    remove: vi.fn()
  }
  return { canvas, ctx }
}

function makeMockState(overrides = {}) {
  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    time: Date.now() - 86400000 + i * 3600000,
    temp: 15 + Math.sin(i) * 5,
    clouds: 30 + i * 2,
    precip: i % 3 === 0 ? 1 : 0,
    precipProb: 20 + i * 3,
    weatherCode: 0,
    isNight: i < 6 || i > 20,
    uv: i > 8 && i < 16 ? 5 : 0,
    localHour: (6 + i) % 24,
    localDayShort: 'Mon'
  }))
  return {
    hourlyData,
    dpr: 1,
    theme: 'dark',
    ...overrides
  }
}

describe('MinimapRenderer', () => {
  let canvas, ctx, viewportEl, scrollContainer, centerOnCurrentTime, updateNowButtonPosition, renderer

  beforeEach(() => {
    vi.useFakeTimers()
    const mock = createMockCanvas()
    canvas = mock.canvas
    ctx = mock.ctx
    document.body.innerHTML = `
      <div id="minimap-container">
        <div id="minimap-viewport"></div>
      </div>
    `
    viewportEl = document.getElementById('minimap-viewport')
    scrollContainer = { scrollLeft: 800, clientWidth: 800 }
    centerOnCurrentTime = vi.fn()
    updateNowButtonPosition = vi.fn()
    renderer = new MinimapRenderer({ canvas, ctx, viewportEl, scrollContainer, centerOnCurrentTime, updateNowButtonPosition, minimapHeight: 80 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('draw does not throw with empty data', () => {
    const state = makeMockState({ hourlyData: [] })
    expect(() => renderer.draw(state, { PIXELS_PER_HOUR: 60 })).not.toThrow()
  })

  it('draw does not throw with valid data', () => {
    const state = makeMockState()
    expect(() => renderer.draw(state, { PIXELS_PER_HOUR: 60 })).not.toThrow()
  })

  it('draw in past mode does not throw', () => {
    renderer.mode = 'past'
    const state = makeMockState()
    expect(() => renderer.draw(state, { PIXELS_PER_HOUR: 60 })).not.toThrow()
  })

  it('updateViewport returns early with no data', () => {
    const state = makeMockState({ hourlyData: [] })
    renderer.updateViewport(state, { PIXELS_PER_HOUR: 60 })
    expect(updateNowButtonPosition).not.toHaveBeenCalled()
  })

  it('updateViewport calls updateNowButtonPosition with data', () => {
    const state = makeMockState()
    renderer.updateViewport(state, { PIXELS_PER_HOUR: 60 })
    expect(updateNowButtonPosition).toHaveBeenCalled()
  })

  it('handleClick returns a number', () => {
    const state = makeMockState()
    const result = renderer.handleClick(100, state, { PIXELS_PER_HOUR: 60 })
    expect(typeof result).toBe('number')
  })

  it('setMode calls centerOnCurrentTime for future mode', () => {
    const state = makeMockState()
    renderer.setMode('future', true, state, { PIXELS_PER_HOUR: 60 })
    expect(centerOnCurrentTime).toHaveBeenCalled()
  })

  it('setMode scrolls to 0 for past mode', () => {
    const state = makeMockState()
    renderer.setMode('past', true, state, { PIXELS_PER_HOUR: 60 })
    expect(scrollContainer.scrollLeft).toBe(0)
  })

  it('invalidateCache resets cacheCanvas', () => {
    renderer.cacheCanvas = document.createElement('canvas')
    renderer.invalidateCache()
    expect(renderer.cacheCanvas).toBeNull()
  })

  it('setCanvasSize sets canvas dimensions', () => {
    const state = makeMockState()
    renderer.setCanvasSize(state)
    expect(canvas.height).toBe(80)
    expect(canvas.style.height).toBe('80px')
  })
})
