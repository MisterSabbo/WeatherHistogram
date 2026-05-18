import { describe, it, expect, beforeEach, vi } from 'vitest'
import { openBottomSheet, closeBottomSheet, initBottomSheets, onSheetClose } from './BottomSheet.js'

describe('BottomSheet', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="test-sheet" class="sheet"></div>
      <div id="test-backdrop" class="backdrop"></div>
      <div id="other-sheet" class="sheet"></div>
      <div id="other-backdrop" class="backdrop"></div>
    `
    initBottomSheets()
  })

  it('openBottomSheet adds open class to sheet and backdrop', () => {
    const sheet = document.getElementById('test-sheet')
    const backdrop = document.getElementById('test-backdrop')

    openBottomSheet('test-sheet', 'test-backdrop')

    expect(sheet.classList.contains('open')).toBe(true)
    expect(backdrop.classList.contains('open')).toBe(true)
  })

  it('closeBottomSheet removes open class from sheet and backdrop', () => {
    openBottomSheet('test-sheet', 'test-backdrop')

    closeBottomSheet('test-sheet', 'test-backdrop')

    const sheet = document.getElementById('test-sheet')
    const backdrop = document.getElementById('test-backdrop')
    expect(sheet.classList.contains('open')).toBe(false)
    expect(backdrop.classList.contains('open')).toBe(false)
  })

  it('supports multiple sheets open simultaneously', () => {
    openBottomSheet('test-sheet', 'test-backdrop')
    openBottomSheet('other-sheet', 'other-backdrop')

    const sheet1 = document.getElementById('test-sheet')
    const sheet2 = document.getElementById('other-sheet')
    expect(sheet1.classList.contains('open')).toBe(true)
    expect(sheet2.classList.contains('open')).toBe(true)

    closeBottomSheet('test-sheet', 'test-backdrop')
    expect(sheet1.classList.contains('open')).toBe(false)
    expect(sheet2.classList.contains('open')).toBe(true)
  })

  it('onSheetClose callback fires when sheet is closed', () => {
    const callback = vi.fn()
    onSheetClose('test-sheet', callback)

    openBottomSheet('test-sheet', 'test-backdrop')
    expect(callback).not.toHaveBeenCalled()

    closeBottomSheet('test-sheet', 'test-backdrop')
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('returns a no-op function when elements do not exist', () => {
    const fn = openBottomSheet('nonexistent', 'nope')
    expect(fn).toBeInstanceOf(Function)
  })

  it('openBottomSheet uses default backdropId', () => {
    document.body.innerHTML += '<div id="pill-sheet-backdrop" class="backdrop"></div>'
    const sheet = document.getElementById('test-sheet')
    const backdrop = document.getElementById('pill-sheet-backdrop')

    openBottomSheet('test-sheet')

    expect(sheet.classList.contains('open')).toBe(true)
    expect(backdrop.classList.contains('open')).toBe(true)
  })
})
