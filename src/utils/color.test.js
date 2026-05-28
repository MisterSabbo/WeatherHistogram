import { describe, it, expect } from 'vitest'
import { hexToRgb, getTextColorForBg } from './color.js'

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

describe('getTextColorForBg', () => {
  it('returns dark text (#1a1a1a) for light background #ffffff', () => {
    expect(getTextColorForBg('#ffffff')).toBe('#1a1a1a')
  })

  it('returns dark text for light background #fde047 (yellow)', () => {
    expect(getTextColorForBg('#fde047')).toBe('#1a1a1a')
  })

  it('returns dark text for light background #bfdbfe (light blue)', () => {
    expect(getTextColorForBg('#bfdbfe')).toBe('#1a1a1a')
  })

  it('returns white text for dark background #1d4ed8 (dark blue)', () => {
    expect(getTextColorForBg('#1d4ed8')).toBe('#ffffff')
  })

  it('returns white text for dark background #dc2626 (dark red)', () => {
    expect(getTextColorForBg('#dc2626')).toBe('#ffffff')
  })

  it('returns white text for dark background #1E1F22 (near-black)', () => {
    expect(getTextColorForBg('#1E1F22')).toBe('#ffffff')
  })

  it('handles rgb() format', () => {
    expect(getTextColorForBg('rgb(255, 255, 255)')).toBe('#1a1a1a')
    expect(getTextColorForBg('rgb(0, 0, 0)')).toBe('#ffffff')
  })

  it('handles rgba() format', () => {
    expect(getTextColorForBg('rgba(255, 255, 255, 0.5)')).toBe('#1a1a1a')
  })

  it('handles hex without # prefix', () => {
    expect(getTextColorForBg('ffffff')).toBe('#1a1a1a')
  })
})
