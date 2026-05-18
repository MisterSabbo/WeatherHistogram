import { describe, it, expect } from 'vitest'
import { dateToX, getCurrentTimeX, formatHour, formatDay, getSplitIndex, formatTooltipTime } from './time.js'

describe('dateToX', () => {
  it('returns 0 when time equals startTime', () => {
    const startTime = 1000000
    expect(dateToX(startTime, startTime, 60)).toBe(0)
  })

  it('returns correct x for 1 hour later at 60px per hour', () => {
    const startTime = 0
    const oneHourLater = 3600000
    expect(dateToX(oneHourLater, startTime, 60)).toBe(60)
  })

  it('returns correct x for 2.5 hours later', () => {
    const startTime = 0
    const later = 3600000 * 2.5
    expect(dateToX(later, startTime, 50)).toBe(125)
  })

  it('works with different pixelsPerHour values', () => {
    const startTime = 0
    const oneHourLater = 3600000
    expect(dateToX(oneHourLater, startTime, 120)).toBe(120)
  })
})

describe('getCurrentTimeX', () => {
  it('returns a positive number for past startTime', () => {
    const past = Date.now() - 3600000
    const x = getCurrentTimeX(past, 60)
    expect(x).toBeGreaterThan(0)
  })

  it('returns 0 for future startTime', () => {
    const future = Date.now() + 3600000 * 24
    const x = getCurrentTimeX(future, 60)
    expect(x).toBeLessThanOrEqual(0)
  })
})

describe('formatHour', () => {
  it('formats single digit hour with leading zero', () => {
    expect(formatHour(3)).toBe('03')
  })

  it('keeps double digit hour as is', () => {
    expect(formatHour(14)).toBe('14')
  })

  it('handles midnight', () => {
    expect(formatHour(0)).toBe('00')
  })
})

describe('formatDay', () => {
  it('returns formatted string', () => {
    const date = new Date(2024, 0, 15)
    const result = formatDay(date, 'en')
    expect(result).toContain('15')
    expect(result).toContain('JAN')
  })

  it('works with spanish locale', () => {
    const date = new Date(2024, 0, 15)
    const result = formatDay(date, 'es')
    expect(result).toContain('15')
    expect(result).toContain('ENE')
  })
})

describe('getSplitIndex', () => {
  it('returns 0 when startTime is not provided', () => {
    expect(getSplitIndex(null)).toBe(0)
    expect(getSplitIndex(undefined)).toBe(0)
  })

  it('returns a positive number for past startTime', () => {
    const past = Date.now() - 3600000 * 10
    const index = getSplitIndex(past)
    expect(index).toBeGreaterThanOrEqual(9)
    expect(index).toBeLessThanOrEqual(11)
  })
})

describe('formatTooltipTime', () => {
  it('returns formatted time and date', () => {
    const date = new Date(2024, 5, 15, 14, 30)
    const result = formatTooltipTime(date, 'en', 'UTC')
    expect(result.timeStr).toBeDefined()
    expect(result.dateStr).toBeDefined()
    expect(result.isToday).toBe(false)
  })
})
