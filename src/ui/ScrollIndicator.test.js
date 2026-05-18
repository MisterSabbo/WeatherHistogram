import { describe, it, expect, beforeEach, vi } from 'vitest'
import { updateScrollIndicator } from './ScrollIndicator.js'

describe('updateScrollIndicator', () => {
  let container, left, right, dots

  beforeEach(() => {
    left = { classList: { add: () => {}, remove: () => {} } }
    right = { classList: { add: () => {}, remove: () => {} } }
    dots = { innerHTML: '', style: { display: '' } }
  })

  it('shows right indicator when overflow and not at end', () => {
    container = { scrollWidth: 500, clientWidth: 400, scrollLeft: 0 }
    const addSpy = vi.spyOn(right.classList, 'add')
    const removeSpy = vi.spyOn(right.classList, 'remove')

    updateScrollIndicator(container, left, right, dots)

    expect(addSpy).toHaveBeenCalledWith('visible')
    expect(removeSpy).not.toHaveBeenCalled()
  })

  it('hides right indicator when at end', () => {
    container = { scrollWidth: 500, clientWidth: 400, scrollLeft: 100 }
    const removeSpy = vi.spyOn(right.classList, 'remove')

    updateScrollIndicator(container, left, right, dots)

    expect(removeSpy).toHaveBeenCalledWith('visible')
  })

  it('shows left indicator when overflow and not at start', () => {
    container = { scrollWidth: 500, clientWidth: 400, scrollLeft: 50 }
    const addSpy = vi.spyOn(left.classList, 'add')
    const removeSpy = vi.spyOn(left.classList, 'remove')

    updateScrollIndicator(container, left, right, dots)

    expect(addSpy).toHaveBeenCalledWith('visible')
    expect(removeSpy).not.toHaveBeenCalled()
  })

  it('hides left indicator when at start', () => {
    container = { scrollWidth: 500, clientWidth: 400, scrollLeft: 0 }
    const removeSpy = vi.spyOn(left.classList, 'remove')

    updateScrollIndicator(container, left, right, dots)

    expect(removeSpy).toHaveBeenCalledWith('visible')
  })

  it('clears dots when no overflow', () => {
    container = { scrollWidth: 300, clientWidth: 400, scrollLeft: 0 }

    updateScrollIndicator(container, left, right, dots)

    expect(dots.innerHTML).toBe('')
    expect(dots.style.display).toBe('none')
  })

  it('does not crash when metricsDots is null', () => {
    container = { scrollWidth: 500, clientWidth: 400, scrollLeft: 0 }

    expect(() => updateScrollIndicator(container, left, right, null)).not.toThrow()
  })
})
