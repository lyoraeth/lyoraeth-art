import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: 0,

  // the built-in default reporter is 'dot' outside a TTY (GH Actions'
  // pipe included) — one character per test, easy to lose to buffering
  // over a long run. 'line' streams a readable line per test as it
  // finishes; 'github' turns failures into inline Actions annotations.
  reporter: process.env.CI ? [['line'], ['github']] : 'list',

  use: {
    baseURL: 'http://localhost:3000',
    // retries is 0, so 'on-first-retry' (the usual default) would never
    // fire — there's no second attempt to trace. This is the CI run's only
    // shot at a trace, so capture it on the first (and only) failure.
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
