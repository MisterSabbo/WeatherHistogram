import { describe, it, expect, vi, beforeEach } from 'vitest'
import { registerSW, handleInstallPrompt, showUpdateToast, checkAppVersion } from './pwa.js'

vi.mock('./i18n.js', () => ({
  t: (key) => {
    const map = {
      'config.installApp': 'Install App',
      'config.newVersionAvailable': 'New version available',
      'config.whatsNew': "What's New"
    }
    return map[key] || key
  }
}))

describe('registerSW', () => {
  it('returns handlers object with onUpdate', () => {
    const result = registerSW()
    expect(result).toHaveProperty('onUpdate')
    expect(result.onUpdate).toBeNull()
  })

  it('does not throw when serviceWorker unavailable', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      writable: true,
      configurable: true
    })
    expect(() => registerSW()).not.toThrow()
  })
})

describe('handleInstallPrompt', () => {
  it('sets up window event listeners', () => {
    const addListenerSpy = vi.spyOn(window, 'addEventListener')
    handleInstallPrompt()
    expect(addListenerSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
    expect(addListenerSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function))
    addListenerSpy.mockRestore()
  })
})

describe('showUpdateToast', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="update-toast" style="display:none">
        <span id="update-toast-text"></span>
        <button id="update-toast-btn"></button>
      </div>
      <div id="changelog-modal"></div>
    `
  })

  it('shows toast with correct text', () => {
    showUpdateToast()
    const toast = document.getElementById('update-toast')
    expect(toast.style.display).toBe('flex')
    expect(document.getElementById('update-toast-text').textContent).toBeTruthy()
  })

  it('does not show when changelog modal is open', () => {
    document.getElementById('changelog-modal').classList.add('open')
    showUpdateToast()
    expect(document.getElementById('update-toast').style.display).not.toBe('flex')
  })
})

describe('checkAppVersion', () => {
  beforeEach(() => {
    localStorage.removeItem('appVersion')
  })

  it('handles fetch failure gracefully', async () => {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error')))
    await expect(checkAppVersion()).resolves.not.toThrow()
  })

  it('handles non-ok response', async () => {
    globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false }))
    const callback = vi.fn()
    await checkAppVersion(callback)
    expect(callback).not.toHaveBeenCalled()
  })

  it('calls callback on version mismatch', async () => {
    localStorage.setItem('appVersion', '1.0.0')
    globalThis.fetch = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ version: '2.0.0' })
    }))
    const callback = vi.fn()
    await checkAppVersion(callback)
    expect(callback).toHaveBeenCalledWith('2.0.0')
    expect(localStorage.getItem('appVersion')).toBe('2.0.0')
  })
})
