import { test, expect } from '@playwright/test'
import { generateMockForecast, generateMockAQI } from '../helpers/mock-data.js'

test.describe('YIP Cold & Allergy Tracking', () => {
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

    // Detect actual location name from the app
    const locationName = await page.evaluate(() => {
      const el = document.getElementById('location-name')
      return el ? el.textContent.trim() : 'Madrid, España'
    })

    // Seed IndexedDB with enriched history (add cold/allergies/notes/moods)
    await page.evaluate((loc) => {
      return new Promise((resolve, reject) => {
        const openReq = indexedDB.open('WeatherHistDB', 2)
        openReq.onupgradeneeded = (e) => {
          const db = e.target.result
          if (!db.objectStoreNames.contains('historyData')) {
            db.createObjectStore('historyData')
          }
        }
        openReq.onsuccess = (e) => {
          const db = e.target.result
          const tx = db.transaction('historyData', 'readwrite')
          const store = tx.objectStore('historyData')

          const now = new Date()
          const daily = []
          for (let i = 30; i >= 0; i--) {
            const day = new Date(now)
            day.setDate(day.getDate() - i)
            day.setHours(0, 0, 0, 0)
            const entry = {
              time: day.getTime(),
              tempMax: 25 + Math.sin(i * 0.3) * 5,
              tempMin: 15 + Math.sin(i * 0.3) * 3,
              precipTotal: i % 4 === 0 ? 0 : Math.random() * 8
            }
            if (i === 5) entry.notes = 'Test note'
            if (i === 3) entry.moods = ['happy']
            if (i === 10) entry.cold = true
            if (i === 7) entry.allergies = true
            if (i === 2) { entry.notes = 'Multi'; entry.moods = ['happy', 'sad']; entry.cold = true; entry.allergies = true }
            daily.push(entry)
          }

          store.put({ daily, hourly: [] }, loc)
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onerror = () => reject(tx.error)
        }
        openReq.onerror = () => reject(openReq.error)
      })
    }, locationName)
  })

  test('opens YIP modal and renders grid with day cells', async ({ page }) => {
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)
    const cells = page.locator('.yip-day-cell')
    await expect(cells.first()).toBeVisible({ timeout: 5000 })
    const count = await cells.count()
    expect(count).toBeGreaterThan(0)
  })

  test('cold toggle persists after save and reopen', async ({ page }) => {
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)
    const cells = page.locator('.yip-day-cell.completed')
    await expect(cells.first()).toBeVisible({ timeout: 5000 })
    await cells.first().click()
    await page.waitForTimeout(500)

    const coldToggle = page.locator('#yip-cold-toggle')
    await expect(coldToggle).toBeVisible()
    await coldToggle.click()

    await page.locator('#yip-detail-save-btn').click()
    await page.waitForTimeout(500)
    const savedMsg = page.locator('#yip-detail-saved-msg')
    await expect(savedMsg).toBeVisible({ timeout: 3000 })

    // Close detail sheet via backdrop
    await page.evaluate(() => {
      const backdrop = document.getElementById('yip-sheet-backdrop')
      if (backdrop) backdrop.click()
    })
    await page.waitForTimeout(500)

    // Reopen same cell
    await cells.first().click()
    await page.waitForTimeout(500)
    await expect(coldToggle).toHaveClass(/active/)
  })

  test('allergies toggle persists after save and reopen', async ({ page }) => {
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)
    const cells = page.locator('.yip-day-cell.completed')
    await expect(cells.first()).toBeVisible({ timeout: 5000 })
    await cells.first().click()
    await page.waitForTimeout(500)

    const allergiesToggle = page.locator('#yip-allergies-toggle')
    await expect(allergiesToggle).toBeVisible()
    await allergiesToggle.click()

    await page.locator('#yip-detail-save-btn').click()
    await page.waitForTimeout(500)
    const savedMsg = page.locator('#yip-detail-saved-msg')
    await expect(savedMsg).toBeVisible({ timeout: 3000 })

    await page.evaluate(() => {
      const backdrop = document.getElementById('yip-sheet-backdrop')
      if (backdrop) backdrop.click()
    })
    await page.waitForTimeout(500)

    await cells.first().click()
    await page.waitForTimeout(500)
    await expect(allergiesToggle).toHaveClass(/active/)
  })

  test('both cold and allergies toggles work simultaneously', async ({ page }) => {
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)
    const cells = page.locator('.yip-day-cell.completed')
    await expect(cells.first()).toBeVisible({ timeout: 5000 })
    await cells.first().click()
    await page.waitForTimeout(500)

    const coldToggle = page.locator('#yip-cold-toggle')
    const allergiesToggle = page.locator('#yip-allergies-toggle')
    await coldToggle.click()
    await allergiesToggle.click()

    await page.locator('#yip-detail-save-btn').click()
    await page.waitForTimeout(500)
    const savedMsg = page.locator('#yip-detail-saved-msg')
    await expect(savedMsg).toBeVisible({ timeout: 3000 })

    await page.evaluate(() => {
      const backdrop = document.getElementById('yip-sheet-backdrop')
      if (backdrop) backdrop.click()
    })
    await page.waitForTimeout(500)

    await cells.first().click()
    await page.waitForTimeout(500)
    await expect(coldToggle).toHaveClass(/active/)
    await expect(allergiesToggle).toHaveClass(/active/)
  })

  test('cancel discards cold toggle changes', async ({ page }) => {
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)
    const cells = page.locator('.yip-day-cell.completed')
    await expect(cells.first()).toBeVisible({ timeout: 5000 })
    await cells.first().click()
    await page.waitForTimeout(500)

    const coldToggle = page.locator('#yip-cold-toggle')
    await coldToggle.click()

    await page.locator('#yip-detail-cancel-btn').click()
    await page.waitForTimeout(500)

    await cells.first().click()
    await page.waitForTimeout(500)
    await expect(coldToggle).not.toHaveClass(/active/)
  })

  test('health category appears in param sheet', async ({ page }) => {
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)

    await page.locator('#yip-param-display').click()
    await page.waitForTimeout(500)

    const coldOption = page.locator('.yip-param-item[data-value="cold"]')
    const allergiesOption = page.locator('.yip-param-item[data-value="allergies"]')
    await expect(coldOption).toBeVisible()
    await expect(allergiesOption).toBeVisible()
  })

  test('cold param renders yellow cells for cold days', async ({ page }) => {
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)

    // Switch to cold param
    await page.locator('#yip-param-display').click()
    await page.waitForTimeout(500)
    await page.locator('.yip-param-item[data-value="cold"]').click()
    await page.waitForTimeout(500)

    // Day index 10 has cold=true — check at least one cell is yellow
    const hasYellow = await page.evaluate(() => {
      const cells = document.querySelectorAll('.yip-day-cell')
      for (const c of cells) {
        if (c.style.backgroundColor === 'rgb(234, 179, 8)' || c.style.backgroundColor === '#eab308') return true
      }
      return false
    })
    expect(hasYellow).toBe(true)
  })

  test('dot indicators visible in grid cells with states', async ({ page }) => {
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)

    const dotContainers = page.locator('.yip-dot-container')
    await expect(dotContainers.first()).toBeVisible({ timeout: 5000 })
    const count = await dotContainers.count()
    expect(count).toBeGreaterThan(0)
  })

  test('cells with 4 states show 3 dots + ellipsis', async ({ page }) => {
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)

    const hasEllipsis = await page.evaluate(() => {
      const containers = document.querySelectorAll('.yip-dot-container')
      for (const c of containers) {
        const dots = c.querySelectorAll('.yip-condition-dot')
        const ellipsis = c.querySelector('.yip-dot-ellipsis')
        if (dots.length >= 3 && ellipsis) return true
      }
      return false
    })
    expect(hasEllipsis).toBe(true)
  })

  test('dots remain visible after switching parameter', async ({ page }) => {
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)

    const getCount = () => page.evaluate(() => document.querySelectorAll('.yip-dot-container').length)

    const before = await getCount()
    expect(before).toBeGreaterThan(0)

    await page.locator('#yip-param-display').click()
    await page.waitForTimeout(500)
    await page.locator('.yip-param-item[data-value="maxTemp"]').click()
    await page.waitForTimeout(500)

    const after = await getCount()
    expect(after).toBe(before)
  })

  test('conditions section visible in day detail sheet', async ({ page }) => {
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)
    const cells = page.locator('.yip-day-cell.completed')
    await expect(cells.first()).toBeVisible({ timeout: 5000 })
    await cells.first().click()
    await page.waitForTimeout(500)

    await expect(page.locator('#yip-detail-conditions-section')).toBeVisible()
    await expect(page.locator('#yip-cold-toggle')).toBeVisible()
    await expect(page.locator('#yip-allergies-toggle')).toBeVisible()
  })

  test('saved cold state persists after page reload', async ({ page }) => {
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)
    const cells = page.locator('.yip-day-cell.completed')
    await expect(cells.first()).toBeVisible({ timeout: 5000 })

    // Get the cell's timestamp to find it again after reload
    const cellTs = await page.evaluate(() => {
      const cell = document.querySelector('.yip-day-cell.completed')
      return cell ? cell.dataset.ts || '' : ''
    })

    await cells.first().click()
    await page.waitForTimeout(500)
    await page.locator('#yip-cold-toggle').click()
    await page.locator('#yip-detail-save-btn').click()
    await page.waitForTimeout(500)
    await expect(page.locator('#yip-detail-saved-msg')).toBeVisible({ timeout: 3000 })

    // Close sheet
    await page.evaluate(() => {
      const backdrop = document.getElementById('yip-sheet-backdrop')
      if (backdrop) backdrop.click()
    })
    await page.waitForTimeout(500)

    // Reload
    await page.reload()
    await page.waitForFunction(() => {
      const wrapper = document.getElementById('app-wrapper')
      return wrapper && !wrapper.classList.contains('loading')
    }, { timeout: 30000 })
    await page.waitForTimeout(1500)

    // Reopen YIP
    await page.locator('#year-in-pixels-btn').click()
    await page.waitForTimeout(1000)
    const cellsAfter = page.locator('.yip-day-cell.completed')
    await expect(cellsAfter.first()).toBeVisible({ timeout: 5000 })
    await cellsAfter.first().click()
    await page.waitForTimeout(500)

    await expect(page.locator('#yip-cold-toggle')).toHaveClass(/active/)
  })
})
