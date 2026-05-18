import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initSpfModal, openSpfSheet } from './SpfModal.js'

vi.mock('../store.js', () => ({
  state: { skinType: 2 }
}))

vi.mock('../utils/i18n.js', () => ({
  t: (key) => {
    const map = {
      'config.spfModalRiskLow': 'Low risk',
      'config.spfModalRiskMod': 'Moderate risk',
      'config.spfModalRiskHigh': 'High risk',
      'config.spfModalRiskVHigh': 'Very high risk',
      'config.spfModalRiskExt': 'Extreme risk',
      'config.spfModalTitleUVI': 'UV Index',
      'config.spfModalTimeNone': 'Without protection for Skin Type',
      'config.spfModalReapply': 'Reapply every 2 hours'
    }
    return map[key] || key
  }
}))

vi.mock('./BottomSheet.js', () => ({
  openBottomSheet: vi.fn(),
  closeBottomSheet: vi.fn(),
  onSheetClose: vi.fn()
}))

describe('SpfModal', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="spf-info-container" data-uv="7"></div>
      <div id="spf-modal">
        <div id="spf-modal-uvi-box"></div>
        <div id="spf-modal-uvi-title"></div>
        <div id="spf-modal-uvi-desc"></div>
        <div id="spf-modal-time-val"></div>
        <div id="spf-modal-time-desc"></div>
        <div id="spf-modal-rec-val"></div>
        <div id="spf-modal-rec-desc"></div>
      </div>
      <button id="spf-settings-btn"></button>
    `
  })

  it('initSpfModal sets up event listeners', () => {
    initSpfModal()
    expect(document.getElementById('spf-info-container')).toBeTruthy()
  })

  it('openSpfSheet calculates correct values for UV 7', () => {
    initSpfModal()
    openSpfSheet()

    expect(document.getElementById('spf-modal-uvi-box').innerText).toBe('7.0')
    expect(document.getElementById('spf-modal-rec-val').innerText).toBe('SPF 50')
    expect(document.getElementById('spf-modal-uvi-title').innerText).toContain('UV Index')
  })

  it('openSpfSheet handles UV 0 gracefully', () => {
    document.getElementById('spf-info-container').dataset.uv = '0'
    initSpfModal()
    openSpfSheet()

    expect(document.getElementById('spf-modal-uvi-box').innerText).toBe('0.0')
    expect(document.getElementById('spf-modal-time-val').innerText).toBe('--')
    expect(document.getElementById('spf-modal-rec-val').innerText).toBe('--')
  })
})
