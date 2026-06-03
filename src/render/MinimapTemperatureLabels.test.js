import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MinimapTemperatureLabels } from './MinimapTemperatureLabels.js'

const mockNormalizeY = vi.fn()
vi.mock('../utils/math.js', () => ({
  normalizeY: (...args) => mockNormalizeY(...args)
}))

vi.mock('../theme.js', () => ({
  getThemeColor: vi.fn((k, fallback) => fallback),
  getThemeFont: vi.fn(() => 'sans-serif')
}))

function createMockCtx() {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    fillText: vi.fn(),
    font: '',
    fillStyle: '',
    textAlign: '',
    textBaseline: '',
    shadowColor: '',
    shadowBlur: 0
  }
}

function makeData(temps) {
  return temps.map(t => ({ temp: t }))
}

describe('MinimapTemperatureLabels', () => {
  let renderer, ctx

  beforeEach(() => {
    vi.clearAllMocks()
    renderer = new MinimapTemperatureLabels()
    ctx = createMockCtx()
    mockNormalizeY.mockImplementation((val, min, max, height) => {
      return height - ((val - min) / (max - min)) * height
    })
  })

  it('draws labels at significant peaks and valleys', () => {
    const data = makeData([10, 15, 10, 20, 10])
    renderer.draw(ctx, data, 800, 80, 160)
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, '10°', 0, 45)
    expect(ctx.fillText).toHaveBeenNthCalledWith(2, '15°', 160, expect.closeTo(29.3, 1))
    expect(ctx.fillText).toHaveBeenNthCalledWith(3, '10°', 320, 45)
    expect(ctx.fillText).toHaveBeenNthCalledWith(4, '20°', 480, expect.closeTo(22.7, 1))
    expect(ctx.fillText).toHaveBeenNthCalledWith(5, '10°', 640, 45)
    expect(ctx.fillText).toHaveBeenCalledTimes(5)
  })

  it('skips insignificant fluctuations', () => {
    const data = makeData([10, 11, 12, 11, 10, 20, 10])
    renderer.draw(ctx, data, 800, 80, 114)
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, '10°', 0, 45)
    expect(ctx.fillText).toHaveBeenNthCalledWith(2, '20°', 570, expect.closeTo(22.7, 1))
    expect(ctx.fillText).toHaveBeenNthCalledWith(3, '10°', 684, 45)
    expect(ctx.fillText).toHaveBeenCalledTimes(3)
  })

  it('draws nothing on flat data', () => {
    const data = makeData([20, 20, 20, 20])
    renderer.draw(ctx, data, 800, 80, 200)
    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('draws nothing when data length < 3', () => {
    const data = makeData([15, 16])
    renderer.draw(ctx, data, 800, 80, 400)
    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('detects peak at first point of plateau', () => {
    const data = makeData([10, 15, 15, 15, 10])
    renderer.draw(ctx, data, 800, 80, 160)
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, '10°', 0, 45)
    expect(ctx.fillText).toHaveBeenNthCalledWith(2, '15°', 160, expect.closeTo(29.3, 1))
    expect(ctx.fillText).toHaveBeenNthCalledWith(3, '10°', 640, 45)
    expect(ctx.fillText).toHaveBeenCalledTimes(3)
  })

  it('draws alternating labels without collision (per-type)', () => {
    const data = makeData([10, 30, 10, 30, 10, 30, 10])
    renderer.draw(ctx, data, 200, 80, 200 / 7)
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, '10°', 0, 45)
    expect(ctx.fillText).toHaveBeenNthCalledWith(2, '30°', expect.closeTo(28.6, 1), expect.closeTo(9.3, 1))
    expect(ctx.fillText).toHaveBeenNthCalledWith(3, '10°', expect.closeTo(57.1, 1), 45)
    expect(ctx.fillText).toHaveBeenNthCalledWith(4, '30°', expect.closeTo(85.7, 1), expect.closeTo(9.3, 1))
    expect(ctx.fillText).toHaveBeenNthCalledWith(5, '10°', expect.closeTo(114.3, 1), 45)
    expect(ctx.fillText).toHaveBeenNthCalledWith(6, '30°', expect.closeTo(142.9, 1), expect.closeTo(9.3, 1))
    expect(ctx.fillText).toHaveBeenNthCalledWith(7, '10°', expect.closeTo(171.4, 1), 45)
    expect(ctx.fillText).toHaveBeenCalledTimes(7)
  })

  it('flips peak label below point when near top edge', () => {
    mockNormalizeY.mockReturnValue(2)
    const data = makeData([35, 30, 35])
    renderer.draw(ctx, data, 800, 80, 266.67)
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, '35°', 0, 6)
    expect(ctx.textBaseline).toBe('top')
  })

  it('draws labels at edge extrema', () => {
    const data = makeData([20, 15, 10])
    renderer.draw(ctx, data, 800, 80, 266.67)
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, '20°', 0, expect.closeTo(22.7, 1))
    expect(ctx.fillText).toHaveBeenNthCalledWith(2, '10°', expect.closeTo(533.3, 1), 45)
    expect(ctx.fillText).toHaveBeenCalledTimes(2)
  })

  it('flips valley label above point when near bottom edge', () => {
    mockNormalizeY.mockReturnValue(78)
    const data = makeData([-15, -10, -15])
    renderer.draw(ctx, data, 800, 80, 266.67)
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, '-15°', 0, 74)
    expect(ctx.textBaseline).toBe('bottom')
  })

  it('draws nothing and does not throw with empty data', () => {
    const data = makeData([])
    expect(() => renderer.draw(ctx, data, 800, 80, 100)).not.toThrow()
    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('draws labels for two significant extrema', () => {
    const data = makeData([10, 20, 10])
    renderer.draw(ctx, data, 800, 80, 266.67)
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, '10°', 0, 45)
    expect(ctx.fillText).toHaveBeenNthCalledWith(2, '20°', expect.closeTo(266.7, 1), expect.closeTo(22.7, 1))
    expect(ctx.fillText).toHaveBeenNthCalledWith(3, '10°', expect.closeTo(533.3, 1), 45)
    expect(ctx.fillText).toHaveBeenCalledTimes(3)
  })

  it('draws "0°" label for zero-degree peak', () => {
    mockNormalizeY.mockReturnValue(40)
    const data = makeData([-10, 0, -10])
    renderer.draw(ctx, data, 800, 80, 266.67)
    expect(ctx.fillText).toHaveBeenCalledWith('0°', expect.closeTo(266.7, 1), 36)
  })

  it('draws "-5°" label for negative temperature valley', () => {
    mockNormalizeY.mockReturnValue(50)
    const data = makeData([0, -5, 0])
    renderer.draw(ctx, data, 800, 80, 266.67)
    expect(ctx.fillText).toHaveBeenCalledWith('-5°', expect.closeTo(266.7, 1), 55)
  })

  it('returns silently when ctx is null', () => {
    const data = makeData([10, 15, 10])
    expect(() => renderer.draw(null, data, 800, 80, 266.67)).not.toThrow()
    expect(ctx.fillText).not.toHaveBeenCalled()
  })

  it('drops intermediate max when rising without valley', () => {
    const data = makeData([9, 10, 13, 14, 16, 17, 17, 17, 18, 19, 20])
    renderer.draw(ctx, data, 800, 80, 800 / 11)
    expect(ctx.fillText).toHaveBeenNthCalledWith(1, '9°', 0, expect.closeTo(46.3, 1))
    expect(ctx.fillText).toHaveBeenNthCalledWith(2, '20°', expect.closeTo(727.3, 1), expect.closeTo(22.7, 1))
    expect(ctx.fillText).toHaveBeenCalledTimes(2)
  })

  it('saves and restores context state', () => {
    const data = makeData([10, 15, 10, 20, 10])
    renderer.draw(ctx, data, 800, 80, 160)
    expect(ctx.save).toHaveBeenCalled()
    expect(ctx.restore).toHaveBeenCalled()
  })
})
