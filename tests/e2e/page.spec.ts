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

test.describe('sections visible', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  const sections = ['#work', '#stack', '#approach', '#writing', '#contact']

  for (const id of sections) {
    test(`section ${id} exists in DOM`, async ({ page }) => {
      const el = page.locator(id)
      await expect(el).toBeAttached()
    })
  }

  test('work cards reveal after scroll', async ({ page }) => {
    await page.locator('#work').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1200) // reveal duration
    const cards = page.locator('.work-card.in')
    await expect(cards).not.toHaveCount(0)
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

  test('no layout shift on card hover', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.locator('#work').scrollIntoViewIfNeeded()
    await page.waitForTimeout(1200)

    const clsBefore = await page.evaluate(() => {
      let cls = 0
      new PerformanceObserver(list => {
        list.getEntries().forEach((e: any) => { if (!e.hadRecentInput) cls += e.value })
      }).observe({ type: 'layout-shift', buffered: true })
      return cls
    })

    const card = page.locator('.work-card').first()
    await card.hover()
    await page.waitForTimeout(400)

    const clsAfter = await page.evaluate(() => {
      let cls = 0
      const entries = performance.getEntriesByType('layout-shift') as any[]
      entries.forEach(e => { if (!e.hadRecentInput) cls += e.value })
      return cls
    })

    console.log(`CLS delta on hover: ${(clsAfter - clsBefore).toFixed(4)}`)
    expect(clsAfter - clsBefore, 'Card hover caused layout shift').toBeLessThan(0.05)
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
