import { describe, it, expect } from 'vitest'
import { hexToRgb } from './color.js'

describe('hexToRgb', () => {
  it('converts full hex with #: #ff0000 to { r: 255, g: 0, b: 0 }', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('converts 3-digit shorthand: #f00 to { r: 255, g: 0, b: 0 }', () => {
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('works without # prefix: ff0000 to { r: 255, g: 0, b: 0 }', () => {
    expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('converts green: #00ff00 to { r: 0, g: 255, b: 0 }', () => {
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
  })

  it('converts blue: #0000ff to { r: 0, g: 0, b: 255 }', () => {
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
  })

  it('converts rgba string: rgba(100, 150, 200, 0.5)', () => {
    expect(hexToRgb('rgba(100, 150, 200, 0.5)')).toEqual({ r: 100, g: 150, b: 200 })
  })

  it('converts rgb string: rgb(100, 150, 200)', () => {
    expect(hexToRgb('rgb(100, 150, 200)')).toEqual({ r: 100, g: 150, b: 200 })
  })

  it('returns zeros for invalid string input', () => {
    expect(hexToRgb('not-a-color')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('returns zeros for non-string input (number)', () => {
    expect(hexToRgb(123)).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('returns zeros for null', () => {
    expect(hexToRgb(null)).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('returns zeros for empty string', () => {
    expect(hexToRgb('')).toEqual({ r: 0, g: 0, b: 0 })
  })
})
