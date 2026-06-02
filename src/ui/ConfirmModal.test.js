import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockOpenBottomSheet = vi.fn(() => vi.fn())

vi.mock('./BottomSheet.js', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    openBottomSheet: mockOpenBottomSheet
  }
})

vi.mock('../utils/i18n.js', () => ({
  t: (key) => {
    const map = {
      'config.accept': 'Accept',
      'config.cancel': 'Cancel'
    }
    return map[key] || key
  }
}))

const { showConfirm } = await import('./ConfirmModal.js')

describe('ConfirmModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = `
      <div id="confirm-title"></div>
      <div id="confirm-message"></div>
      <button id="confirm-ok-btn"></button>
      <button id="confirm-cancel-btn"></button>
      <div id="confirm-modal"></div>
      <div id="confirm-sheet-backdrop"></div>
      <div id="confirm-sheet-scroll-content"></div>
    `
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('calls openBottomSheet with correct arguments', async () => {
    const promise = showConfirm('Test Title', 'Test Message')
    expect(mockOpenBottomSheet).toHaveBeenCalledWith('confirm-modal', 'confirm-sheet-backdrop', 'confirm-sheet-scroll-content')
    document.getElementById('confirm-ok-btn').click()
    await promise
  })

  it('resolves true when OK is clicked', async () => {
    const promise = showConfirm('Test', 'Msg')
    document.getElementById('confirm-ok-btn').click()
    await expect(promise).resolves.toBe(true)
  })

  it('resolves false when Cancel is clicked', async () => {
    const promise = showConfirm('Test', 'Msg')
    document.getElementById('confirm-cancel-btn').click()
    await expect(promise).resolves.toBe(false)
  })

  it('sets title and message text', async () => {
    const promise = showConfirm('My Title', 'My Message')
    expect(document.getElementById('confirm-title').textContent).toBe('My Title')
    expect(document.getElementById('confirm-message').textContent).toBe('My Message')
    document.getElementById('confirm-cancel-btn').click()
    await promise
  })

  it('sets button text from i18n', async () => {
    const promise = showConfirm('T', 'M')
    expect(document.getElementById('confirm-ok-btn').textContent).toBe('Accept')
    expect(document.getElementById('confirm-cancel-btn').textContent).toBe('Cancel')
    document.getElementById('confirm-cancel-btn').click()
    await promise
  })

  it('replaces buttons with clones', async () => {
    const okBefore = document.getElementById('confirm-ok-btn')
    const promise = showConfirm('T', 'M')
    const okAfter = document.getElementById('confirm-ok-btn')
    expect(okAfter).not.toBe(okBefore)
    okAfter.click()
    await promise
  })

  it('does not throw if DOM elements are missing', () => {
    document.body.innerHTML = ''
    expect(() => showConfirm('T', 'M')).not.toThrow()
  })

  it('does not resolve twice on double click', async () => {
    const resolveSpy = vi.fn()
    const promise = showConfirm('T', 'M')
    promise.then(resolveSpy)
    document.getElementById('confirm-ok-btn').click()
    document.getElementById('confirm-ok-btn').click()
    await vi.waitFor(() => expect(resolveSpy).toHaveBeenCalledTimes(1))
    expect(resolveSpy).toHaveBeenCalledWith(true)
  })

  it('calls closeFn before resolving', async () => {
    const closeFn = vi.fn()
    mockOpenBottomSheet.mockReturnValue(closeFn)
    const promise = showConfirm('T', 'M')
    document.getElementById('confirm-ok-btn').click()
    await promise
    expect(closeFn).toHaveBeenCalled()
  })
})
