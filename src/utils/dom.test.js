import { describe, it, expect, vi, afterEach } from 'vitest'
import { debounce } from './dom.js'

describe('debounce', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('calls the function once after the delay', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    debounced()
    debounced()

    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('passes arguments to the original function', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 50)

    debounced('a', 1)
    vi.advanceTimersByTime(50)

    expect(fn).toHaveBeenCalledWith('a', 1)
  })

  it('calls again after subsequent bursts', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 50)

    debounced()
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledTimes(1)

    debounced()
    vi.advanceTimersByTime(50)
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('uses default delay of 150ms', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn)

    debounced()
    vi.advanceTimersByTime(149)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
