import { describe, it, expect, beforeEach } from 'vitest'
import { initTooltipManager, showTooltip, hideTooltip } from './TooltipManager.js'

describe('TooltipManager', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="data-value">
        <span class="info-icon">i</span>
        <div class="custom-tooltip">Tooltip text</div>
      </div>
      <div class="location-group">
        <span id="location-name">Location</span>
        <span id="weather-summary">Sunny</span>
        <div class="custom-tooltip">Location tooltip</div>
      </div>
    `
  })

  it('showTooltip shows the tooltip for info-icon', () => {
    const icon = document.querySelector('.info-icon')
    showTooltip(icon)
    const tt = document.querySelector('.custom-tooltip')
    expect(tt.style.display).toBe('block')
  })

  it('hideTooltip hides the tooltip', () => {
    const icon = document.querySelector('.info-icon')
    showTooltip(icon)
    hideTooltip(icon)
    const tt = document.querySelector('.custom-tooltip')
    expect(tt.style.display).toBe('')
  })

  it('initTooltipManager sets up event listeners without error', () => {
    expect(() => initTooltipManager()).not.toThrow()
  })

  it('does not crash when elements are missing', () => {
    document.body.innerHTML = ''
    expect(() => initTooltipManager()).not.toThrow()
    expect(() => showTooltip(document.body)).not.toThrow()
    expect(() => hideTooltip(document.body)).not.toThrow()
  })
})
