import { describe, it, expect, beforeEach, vi } from 'vitest'
import { updateMetricsOverlay } from './ScrollIndicator.js'

describe('updateMetricsOverlay', () => {
  let container, dots, topPanel

  beforeEach(() => {
    topPanel = { classList: { toggle: vi.fn() } }
    container = { classList: { toggle: () => {} }, closest: () => topPanel, scrollWidth: 0, clientWidth: 0, scrollLeft: 0 }
    dots = { innerHTML: '', style: { display: '' } }
  })

  it('shows right gradient + chevron when overflow and not at end', () => {
    container = { scrollWidth: 500, clientWidth: 400, scrollLeft: 0, classList: { toggle: () => {} }, closest: () => topPanel }
    const toggleSpy = vi.spyOn(topPanel.classList, 'toggle')

    updateMetricsOverlay(container, dots)

    expect(toggleSpy).toHaveBeenCalledWith('gradient-right-visible', true)
    expect(toggleSpy).toHaveBeenCalledWith('gradient-left-visible', false)
    expect(dots.innerHTML).toContain('chevron_right')
    expect(dots.innerHTML).not.toContain('chevron_left')
  })

  it('hides right gradient when at end', () => {
    container = { scrollWidth: 500, clientWidth: 400, scrollLeft: 100, classList: { toggle: () => {} }, closest: () => topPanel }
    const toggleSpy = vi.spyOn(topPanel.classList, 'toggle')

    updateMetricsOverlay(container, dots)

    expect(toggleSpy).toHaveBeenCalledWith('gradient-right-visible', false)
  })

  it('shows left gradient when overflow and not at start', () => {
    container = { scrollWidth: 1200, clientWidth: 400, scrollLeft: 400, classList: { toggle: () => {} }, closest: () => topPanel }
    const toggleSpy = vi.spyOn(topPanel.classList, 'toggle')

    updateMetricsOverlay(container, dots)

    expect(toggleSpy).toHaveBeenCalledWith('gradient-left-visible', true)
    expect(dots.innerHTML).toContain('chevron_left')
    expect(dots.innerHTML).toContain('chevron_right')
  })

  it('hides left gradient when at start', () => {
    container = { scrollWidth: 500, clientWidth: 400, scrollLeft: 0, classList: { toggle: () => {} }, closest: () => topPanel }
    const toggleSpy = vi.spyOn(topPanel.classList, 'toggle')

    updateMetricsOverlay(container, dots)

    expect(toggleSpy).toHaveBeenCalledWith('gradient-left-visible', false)
  })

  it('clears dots when no overflow', () => {
    container = { scrollWidth: 300, clientWidth: 400, scrollLeft: 0, classList: { toggle: () => {} }, closest: () => topPanel }

    updateMetricsOverlay(container, dots)

    expect(dots.innerHTML).toBe('')
    expect(dots.style.display).toBe('none')
  })

  it('does not crash when metricsDots is null', () => {
    container = { scrollWidth: 500, clientWidth: 400, scrollLeft: 0, classList: { toggle: () => {} }, closest: () => topPanel }

    expect(() => updateMetricsOverlay(container, null)).not.toThrow()
  })

  it('shows both chevrons when in middle page', () => {
    container = { scrollWidth: 1200, clientWidth: 400, scrollLeft: 400, classList: { toggle: () => {} }, closest: () => topPanel }

    updateMetricsOverlay(container, dots)

    expect(dots.innerHTML).toContain('chevron_left')
    expect(dots.innerHTML).toContain('chevron_right')
  })

  it('shows no chevrons when totalPages <= 1', () => {
    container = { scrollWidth: 300, clientWidth: 400, scrollLeft: 0, classList: { toggle: () => {} }, closest: () => topPanel }

    updateMetricsOverlay(container, dots)

    expect(dots.innerHTML).not.toContain('chevron')
  })

  it('shows page counter when totalPages > 1', () => {
    container = { scrollWidth: 800, clientWidth: 400, scrollLeft: 0, classList: { toggle: () => {} }, closest: () => topPanel }

    updateMetricsOverlay(container, dots)

    expect(dots.innerHTML).toContain('1/2')
  })
})
