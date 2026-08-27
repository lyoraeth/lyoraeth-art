import { test, expect } from '@playwright/test'

// ── Console error / warning collector ────────────────────────────────────────

test.describe('runtime errors', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(errors, `Console errors:\n${errors.join('\n')}`).toHaveLength(0)
  })

  test('no hydration mismatch warnings', async ({ page }) => {
    const hydrationWarnings: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().toLowerCase().includes('hydrat')) {
        hydrationWarnings.push(msg.text())
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    expect(hydrationWarnings, `Hydration warnings:\n${hydrationWarnings.join('\n')}`).toHaveLength(0)
  })
})

// ── Sections render ───────────────────────────────────────────────────────────

test.describe('header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  // scoped to the bar: the phone menu lives inside <header> and carries its own nav
  const bar = '.header-bar'

  test('brand, navigation and search are rendered', async ({ page }) => {
    await expect(page.locator(`${bar} img`)).toBeVisible()
    await expect(page.locator(`${bar} nav a`)).toHaveCount(4)
    await expect(page.locator('#site-search')).toBeAttached()
  })

  test('anchors clear the sticky header', async ({ page }) => {
    const padding = await page.evaluate(() =>
      getComputedStyle(document.documentElement).scrollPaddingTop
    )
    // the bar, not the whole header: the 1px bottom border is deliberate slack
    const height = (await page.locator(bar).boundingBox())!.height
    expect(parseFloat(padding)).toBeCloseTo(height, 0)
  })
})

test.describe('hero', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('name, portrait and the latest post are rendered', async ({ page }) => {
    await expect(page.locator('#hero-title')).toBeVisible()

    const img = page.locator('.hero-portrait img')
    await expect(img).toBeVisible()
    // the browser picked a source and decoded it, rather than falling back to alt
    expect(await img.evaluate((el: HTMLImageElement) => el.naturalWidth)).toBeGreaterThan(0)

    await expect(page.locator('.hero-meta a')).toHaveAttribute('href', /\/writing\//)
  })
})

test.describe('work', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('header counts every work, the grid shows the first four', async ({ page }) => {
    const cards = page.locator('.work-card')
    await expect(cards).toHaveCount(4)

    const count = await page.locator('#work .section-header__count').textContent()
    const total = Number(count!.match(/\d+/)![0])
    expect(total).toBeGreaterThanOrEqual(4)

    await expect(cards.first().locator('a')).toHaveAttribute('href', /\/work\//)
  })

  test('hover swaps the teaser for the excerpt', async ({ page }) => {
    const card = page.locator('.work-card').first()
    await card.scrollIntoViewIfNeeded()

    await expect(card.locator('.work-card__state--full')).toBeHidden()
    await card.hover()
    // both states share one grid cell, so the swap must not resize the card
    const before = (await card.boundingBox())!.height
    await expect(card.locator('.work-card__state--full')).toBeVisible()
    await expect(card.locator('.work-card__state--short')).toBeHidden()
    expect((await card.boundingBox())!.height).toBe(before)
  })
})

test.describe('writing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('three cards, each linking to its post', async ({ page }) => {
    const cards = page.locator('.post-card')
    await expect(cards).toHaveCount(3)
    await expect(cards.first().locator('a')).toHaveAttribute('href', /\/writing\//)
  })

  test('the action appears on hover without resizing the card', async ({ page }) => {
    const card = page.locator('.post-card').first()
    await card.scrollIntoViewIfNeeded()

    const action = card.locator('.post-card__action')
    await expect(action).toBeHidden()

    const before = (await card.boundingBox())!.height
    await card.hover()
    await expect(action).toBeVisible()
    expect((await card.boundingBox())!.height).toBe(before)
  })
})

test.describe('phone menu', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('opens, isolates the page, closes on Escape', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const menu = page.locator('#mobile-menu')
    const burger = page.locator('header button[aria-controls="mobile-menu"]')

    await expect(menu).toBeHidden()

    await burger.click()
    await expect(menu).toBeVisible()
    await expect(page.locator('main')).toHaveAttribute('inert', '')
    await expect(page.locator('html')).toHaveCSS('overflow', 'hidden')

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(page.locator('main')).not.toHaveAttribute('inert', '')
    await expect(burger).toBeFocused()
  })
})

// ── Performance metrics ───────────────────────────────────────────────────────

test.describe('performance', () => {
  test('LCP under 2.5s', async ({ page }) => {
    let lcp = 0
    await page.addInitScript(() => {
      new PerformanceObserver(list => {
        const entries = list.getEntries()
        ;(window as any).__lcp = entries[entries.length - 1].startTime
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    lcp = await page.evaluate(() => (window as any).__lcp ?? 0)

    console.log(`LCP: ${Math.round(lcp)}ms`)
    expect(lcp, `LCP too high: ${Math.round(lcp)}ms`).toBeLessThan(2500)
  })

  test('JS heap stays under 100MB after full scroll', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // scroll through the entire page
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(500)

    const heapMB = await page.evaluate(
      () => ((performance as any).memory?.usedJSHeapSize ?? 0) / 1024 / 1024
    )
    console.log(`JS heap after full scroll: ${heapMB.toFixed(1)} MB`)

    expect(heapMB, `Heap too large: ${heapMB.toFixed(1)} MB`).toBeLessThan(100)
  })
})

// ── Event listener leak probe ─────────────────────────────────────────────────

test('event listener count does not grow on navigation', async ({ page }) => {
  const countListeners = () =>
    page.evaluate(() => (window as any).__listenerCount ?? 'unsupported')

  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  const heap1 = await page.evaluate(
    () => ((performance as any).memory?.usedJSHeapSize ?? 0) / 1024 / 1024
  )

  await page.reload()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)

  const heap2 = await page.evaluate(
    () => ((performance as any).memory?.usedJSHeapSize ?? 0) / 1024 / 1024
  )
  const growthMB = heap2 - heap1

  console.log(`Heap growth after reload: ${growthMB.toFixed(2)} MB`)
  expect(growthMB, `Possible leak — heap grew ${growthMB.toFixed(2)} MB on reload`).toBeLessThan(10)
})
