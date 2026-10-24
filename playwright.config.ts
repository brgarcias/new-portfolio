import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  // Screenshots only match the Linux container where CI runs, so they live
  // in one folder per device instead of one per operating system.
  snapshotPathTemplate: '{testDir}/snapshots/{projectName}/{arg}{ext}',
  // A missing screenshot is written to tests/snapshots and the test passes.
  // CI fails when that happens and publishes the new files for review.
  updateSnapshots: 'missing',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    // The site follows the system's theme. Tests use the dark one, the
    // original look, unless they ask for the light one.
    colorScheme: 'dark',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13'],
        defaultBrowserType: 'chromium',
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: {
    command: 'pnpm start --hostname 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
