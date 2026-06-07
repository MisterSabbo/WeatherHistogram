import { test, expect } from '@playwright/test'
import { generateMockForecast, generateMockAQI } from '../helpers/mock-data.js'

test.describe('Atmospheric palette selector', () => {
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

  test('palette selector opens and shows options', async ({ page }) => {
    await page.locator('#btn-info').click()
    await page.waitForTimeout(500)
    const trigger = page.locator('#atmo-palette-select-trigger')
    await expect(trigger).toBeVisible()
    await trigger.click({ force: true })
    await page.waitForTimeout(500)
    const sheet = page.locator('#atmo-palette-select-sheet')
    await expect(sheet).toBeVisible()
    const options = page.locator('#atmo-palette-options-container .theme-option')
    await expect(options).toHaveCount(4)
  })

  test('selecting a palette updates state and closes sheet', async ({ page }) => {
    await page.locator('#btn-info').click()
    await page.waitForTimeout(500)
    await page.locator('#atmo-palette-select-trigger').click({ force: true })
    await page.waitForTimeout(500)
    const warmOption = page.locator('#atmo-palette-options-container .theme-option[data-value="warm"]')
    await expect(warmOption).toBeVisible()
    await warmOption.click()
    await page.waitForTimeout(800)
    const sheet = page.locator('#atmo-palette-select-sheet')
    const hasOpenClass = await page.evaluate(() => {
      return document.getElementById('atmo-palette-select-sheet').classList.contains('open')
    })
    expect(hasOpenClass).toBe(false)
    const label = page.locator('#atmo-palette-current-label')
    await expect(label).toHaveText('Cálida')
  })

  test('palette persists across page reload', async ({ page }) => {
    await page.locator('#btn-info').click()
    await page.waitForTimeout(500)
    await page.locator('#atmo-palette-select-trigger').click({ force: true })
    await page.waitForTimeout(500)
    await page.locator('#atmo-palette-options-container .theme-option[data-value="cold"]').click()
    await page.waitForTimeout(800)
    await page.reload()
    await page.waitForFunction(() => {
      const wrapper = document.getElementById('app-wrapper')
      return wrapper && !wrapper.classList.contains('loading')
    }, { timeout: 30000 })
    await page.waitForTimeout(1500)
    const label = page.locator('#atmo-palette-current-label')
    await expect(label).toHaveText('Fría')
  })
})
