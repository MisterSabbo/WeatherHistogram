import { test, expect } from '@playwright/test'
import { generateMockForecast, generateMockAQI } from '../helpers/mock-data.js'

test.describe('Theme screenshots', () => {
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

  test('dark theme screenshot', async ({ page }) => {
    const isDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    if (isDark !== 'dark') {
      await page.locator('#theme-toggle').click()
      await page.waitForTimeout(500)
    }
    await expect(page).toHaveScreenshot('theme-dark.png', { fullPage: true })
  })

  test('light theme screenshot', async ({ page }) => {
    const isDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    if (isDark === 'dark') {
      await page.locator('#theme-toggle').click()
      await page.waitForTimeout(500)
    }
    await expect(page).toHaveScreenshot('theme-light.png', { fullPage: true })
  })

  test('chart themes can be selected', async ({ page }) => {
    await page.locator('#btn-info').click()
    await page.waitForTimeout(500)
    const themeSelect = page.locator('#theme-select-trigger')
    await expect(themeSelect).toBeVisible()
    await themeSelect.click()
    await page.waitForTimeout(500)
    const themeSheet = page.locator('#theme-select-sheet')
    await expect(themeSheet).toBeVisible()
    await expect(page).toHaveScreenshot('theme-selector-open.png')
  })
})
