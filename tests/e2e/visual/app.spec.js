import { test, expect } from '@playwright/test'
import { generateMockForecast, generateMockAQI } from '../helpers/mock-data.js'

test.describe('App visual screenshots', () => {
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
    await page.waitForTimeout(2000)
  })

  test('full chart screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('full-chart.png', { fullPage: true })
  })

  test('minimap visible', async ({ page }) => {
    const minimap = page.locator('#minimap-container')
    await expect(minimap).toBeVisible()
    await expect(page).toHaveScreenshot('minimap.png', { fullPage: false })
  })

  test('daily cards visible', async ({ page }) => {
    const toggleBtn = page.locator('#toggle-nav-btn')
    await toggleBtn.click()
    await page.waitForFunction(() => {
      const el = document.getElementById('daily-cards-container')
      return el && el.style.display === 'flex' && el.querySelector('.daily-card')
    }, { timeout: 5000 })
    const cardsContainer = page.locator('#daily-cards-container')
    await expect(cardsContainer).toBeVisible()
    await expect(page).toHaveScreenshot('daily-cards.png', { fullPage: true })
  })
})
