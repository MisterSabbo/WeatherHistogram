import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  snapshotPathTemplate: '{testFileDir}/{testFileName}-snapshots/{arg}{ext}',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.07,
    },
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
  fullyParallel: false,
  workers: 1,
})
