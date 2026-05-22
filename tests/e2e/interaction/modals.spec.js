import { test, expect } from '@playwright/test'
import { generateMockForecast, generateMockAQI } from '../helpers/mock-data.js'

test.describe('Modal interactions', () => {
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

  test('open and close info/settings modal', async ({ page }) => {
    const infoBtn = page.locator('#btn-info')
    await infoBtn.click()
    await page.waitForTimeout(500)
    const infoModal = page.locator('#info-modal')
    await expect(infoModal).toBeVisible()
    await expect(page).toHaveScreenshot('info-modal-open.png', { maxDiffPixelRatio: 0.02 })

    await page.evaluate(() => {
      const backdrop = document.getElementById('info-sheet-backdrop')
      if (backdrop) backdrop.click()
    })
    await page.waitForTimeout(800)
    const hasOpenClass = await page.evaluate(() => {
      const modal = document.getElementById('info-modal')
      return modal.classList.contains('open')
    })
    expect(hasOpenClass).toBe(false)
  })

  test('open changelog from settings', async ({ page }) => {
    await page.locator('#btn-info').click()
    await page.waitForTimeout(500)
    const changelogLink = page.locator('#open-changelog-link')
    await changelogLink.click({ force: true })
    await page.waitForTimeout(500)
    const changelogModal = page.locator('#changelog-modal')
    await expect(changelogModal).toBeVisible()
  })

  test('theme toggle interaction', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle')
    await themeToggle.click()
    await page.waitForTimeout(500)
    const isDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme'))
    expect(['dark', 'light']).toContain(isDark)
  })

  test('language switch opens correctly', async ({ page }) => {
    await page.locator('#btn-info').click()
    await page.waitForTimeout(500)
    const langEn = page.locator('.lang-card[data-value="en"]')
    await langEn.click()
    await page.waitForTimeout(500)
    const locationName = page.locator('#location-name')
    await expect(locationName).toBeVisible()
  })

  test('location button exists and is clickable', async ({ page }) => {
    const locBtn = page.locator('#open-location-modal-btn')
    await expect(locBtn).toBeVisible()
    await locBtn.click()
    await page.waitForTimeout(500)
    const mapModal = page.locator('#map-location-modal')
    await expect(mapModal).toBeVisible()
  })
})
