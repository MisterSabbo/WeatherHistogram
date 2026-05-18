import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateAlerts, renderAlerts } from './AlertEngine.js'

vi.mock('./i18n.js', () => ({
  t: (key) => key === 'topPanel.activeAlerts' ? 'Active Alerts' : key
}))

describe('generateAlerts', () => {
  it('returns empty alerts for normal conditions', () => {
    const hourlyData = Array(24).fill(null).map(() => ({
      temp: 20,
      gusts: 20,
      precip: 0,
      uv: 3,
      weatherCode: 0
    }))
    const result = generateAlerts(hourlyData, 0)
    expect(result.alerts).toHaveLength(0)
    expect(result.alertLevel).toBe(0)
  })

  it('generates temp alert for extreme heat (>38°C)', () => {
    const hourlyData = Array(24).fill(null).map((_, i) => ({
      temp: i === 5 ? 40 : 20,
      gusts: 20,
      precip: 0,
      uv: 3,
      weatherCode: 0
    }))
    const result = generateAlerts(hourlyData, 0)
    expect(result.alerts.length).toBeGreaterThanOrEqual(1)
    expect(result.alerts.some(a => a.type === 'temp')).toBe(true)
    expect(result.alertLevel).toBe(3)
  })

  it('generates wind alert for hurricane winds (>90km/h)', () => {
    const hourlyData = Array(24).fill(null).map((_, i) => ({
      temp: 20,
      gusts: i === 3 ? 100 : 20,
      precip: 0,
      uv: 3,
      weatherCode: 0
    }))
    const result = generateAlerts(hourlyData, 0)
    expect(result.alerts.length).toBeGreaterThanOrEqual(1)
    expect(result.alerts.some(a => a.type === 'wind')).toBe(true)
    expect(result.alertLevel).toBe(3)
  })

  it('only scans next 12 hours from index', () => {
    const hourlyData = Array(24).fill(null).map((_, i) => ({
      temp: i >= 15 ? 40 : 20,
      gusts: 20,
      precip: 0,
      uv: 3,
      weatherCode: 0
    }))
    const result = generateAlerts(hourlyData, 10)
    // Index 10, so it scans 10-21 (12 hours). Hour 15+ has temp 40, which is within range
    expect(result.alerts.length).toBeGreaterThanOrEqual(1)
  })
})

describe('renderAlerts', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="alerts-container">
        <span class="material-symbols-outlined"></span>
      </div>
      <div id="alerts-tooltip"></div>
    `
  })

  it('shows alerts container when alerts are present', () => {
    renderAlerts([{ type: 'temp', level: 2, msg: 'High temp' }], 2)
    const container = document.getElementById('alerts-container')
    expect(container.style.display).toBe('flex')
  })

  it('hides alerts container when no alerts', () => {
    renderAlerts([], 0)
    const container = document.getElementById('alerts-container')
    expect(container.style.display).toBe('none')
  })

  it('renders alert HTML into tooltip', () => {
    renderAlerts([{ type: 'temp', level: 2, msg: 'High temp' }], 2)
    const tooltip = document.getElementById('alerts-tooltip')
    expect(tooltip.innerHTML).toContain('High temp')
    expect(tooltip.innerHTML).toContain('Active Alerts')
  })
})
