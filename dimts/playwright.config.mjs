// Playwright test configuration for the Savanna Accessible Onboarding Module.
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off' // tracing makes each test ~4x slower on Windows; use --trace=on when debugging
  },
  webServer: {
    command: 'node tests/static-server.mjs',
    url: `http://localhost:${PORT}/dimts/index.html`,
    reuseExistingServer: true,
    env: { PORT: String(PORT) }
  },
  projects: [
    // Small Android phone (most learners), and a desktop for judges / partner staff.
    { name: 'mobile', use: { ...devices['Pixel 5'], browserName: 'chromium' } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } }
  ]
});
