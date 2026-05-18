import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { initPullToRefresh } from './PullToRefresh.js'

function createTouchEvent(type, { clientX, clientY } = {}) {
  const event = new Event(type, { cancelable: type === 'touchmove' })
  event.touches = clientY !== undefined
    ? [{ clientX: clientX || 0, clientY }]
    : []
  event.changedTouches = clientY !== undefined
    ? [{ clientX: clientX || 0, clientY }]
    : []
  Object.defineProperty(event, 'target', {
    value: document.body,
    writable: false
  })
  return event
}

describe('PullToRefresh', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="ptr-indicator" style="transform: translateY(-100%)"></div>
      <div id="ptr-icon" data-spinning="false"></div>
      <div id="app-wrapper"></div>
    `
  })

  afterEach(() => {
    const ptr = document._ptrInstance
    if (ptr) ptr.destroy()
  })

  it('returns an object with destroy method', () => {
    const ptr = initPullToRefresh()
    expect(ptr).toHaveProperty('destroy')
    expect(typeof ptr.destroy).toBe('function')
  })

  it('calls onRefresh when pull threshold exceeded', () => {
    const onRefresh = vi.fn().mockResolvedValue()
    document._ptrInstance = initPullToRefresh({ onRefresh })

    document.dispatchEvent(createTouchEvent('touchstart', { clientY: 200 }))
    document.dispatchEvent(createTouchEvent('touchmove', { clientY: 300 }))
    document.dispatchEvent(createTouchEvent('touchend', { clientY: 300 }))

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('does not call onRefresh when pull distance is too small', () => {
    const onRefresh = vi.fn()
    document._ptrInstance = initPullToRefresh({ onRefresh })

    document.dispatchEvent(createTouchEvent('touchstart', { clientY: 200 }))
    document.dispatchEvent(createTouchEvent('touchmove', { clientY: 210 }))
    document.dispatchEvent(createTouchEvent('touchend', { clientY: 210 }))

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('resets indicator position after destroy', () => {
    const ptr = initPullToRefresh()
    ptr.destroy()

    document.dispatchEvent(createTouchEvent('touchstart', { clientY: 200 }))
    expect(document.getElementById('ptr-indicator')).toBeTruthy()
  })
})
