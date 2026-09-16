import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  // 0 locally: a real failure should surface immediately, not hide behind a
  // retry. 1 in CI: a container on a shared runner can hit a genuinely
  // transient network hiccup reaching Sanity/Turnstile - one retry absorbs
  // that without masking an actual, reproducible bug (which fails again).
  retries: process.env.CI ? 1 : 0,

  // the built-in default reporter is 'dot' outside a TTY (GH Actions'
  // pipe included) — one character per test, easy to lose to buffering
  // over a long run. 'line' streams a readable line per test as it
  // finishes; 'github' turns failures into inline Actions annotations;
  // 'html' is what actually produces the playwright-report/ directory the
  // workflow uploads as an artifact on failure.
  reporter: process.env.CI ? [['line'], ['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // start dev server automatically
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
