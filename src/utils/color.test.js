import { describe, it, expect } from 'vitest'
import { hexToRgb } from './color.js'

describe('hexToRgb', () => {
  it('converts #ff0000 to { r: 255, g: 0, b: 0 }', () => {
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('converts shorthand #f00 to { r: 255, g: 0, b: 0 }', () => {
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('works without # prefix', () => {
    expect(hexToRgb('ff0000')).toEqual({ r: 255, g: 0, b: 0 })
  })

  it('converts rgba string', () => {
    const result = hexToRgb('rgba(100, 150, 200, 0.5)')
    expect(result.r).toBe(100)
    expect(result.g).toBe(150)
    expect(result.b).toBe(200)
  })

  it('returns zeros for invalid input', () => {
    expect(hexToRgb('not-a-color')).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('returns zeros for non-string input', () => {
    expect(hexToRgb(123)).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('returns zeros for null', () => {
    expect(hexToRgb(null)).toEqual({ r: 0, g: 0, b: 0 })
  })

  it('converts green correctly', () => {
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 })
  })

  it('converts blue correctly', () => {
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 })
  })
})
