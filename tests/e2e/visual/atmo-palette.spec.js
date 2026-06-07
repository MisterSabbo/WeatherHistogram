import { test, expect } from '@playwright/test'
import { generateMockForecast, generateMockAQI } from '../helpers/mock-data.js'

test.describe('Atmospheric palette visual', () => {
  test.beforeEach(async ({ page }) => {
    const forecast = generateMockForecast()
    const aqi = generateMockAQI()

    await page.route('**/api.open-meteo.com/v1/forecast**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(forecast) })
    })
    await page.route('**/air-quality-api.open-meteo.com/v1/air-quality**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(aqi) })
    })

    await page.goto('/')
    await page.waitForFunction(() => {
      const wrapper = document.getElementById('app-wrapper')
      return wrapper && !wrapper.classList.contains('loading')
    }, { timeout: 30000 })
    await page.waitForTimeout(1500)
  })

  test('warm palette screenshot', async ({ page }) => {
    await page.locator('#btn-info').click()
    await page.waitForTimeout(500)
    await page.locator('#atmo-palette-select-trigger').click({ force: true })
    await page.waitForTimeout(500)
    await page.locator('#atmo-palette-options-container .theme-option[data-value="warm"]').click()
    await page.waitForTimeout(1500)
    await expect(page).toHaveScreenshot('atmo-palette-warm.png', { fullPage: true })
  })

  test('cold palette screenshot', async ({ page }) => {
    await page.locator('#btn-info').click()
    await page.waitForTimeout(500)
    await page.locator('#atmo-palette-select-trigger').click({ force: true })
    await page.waitForTimeout(500)
    await page.locator('#atmo-palette-options-container .theme-option[data-value="cold"]').click()
    await page.waitForTimeout(1500)
    await expect(page).toHaveScreenshot('atmo-palette-cold.png', { fullPage: true })
  })

  test('palette selector open screenshot', async ({ page }) => {
    await page.locator('#btn-info').click()
    await page.waitForTimeout(500)
    await page.locator('#atmo-palette-select-trigger').click({ force: true })
    await page.waitForTimeout(500)
    await expect(page).toHaveScreenshot('atmo-palette-selector-open.png')
  })
})
