import { test, expect, type Page } from '@playwright/test'

/*
 * Waits are on 'load', not 'networkidle': the contact form embeds a Turnstile
 * widget that keeps a connection open, so the network never goes idle.
 *
 * 'load' alone isn't enough to interact, though — the markup is there but the
 * handlers are not, and a click on a submit button would post the form the
 * native way, reloading the page. Vue sets __vue_app__ on the root once it has
 * hydrated, which is the moment the page becomes clickable.
 */
async function ready(page: Page) {
  await page.waitForLoadState('load')
  await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as any)?.__vue_app__))
}

// ── Console error / warning collector ────────────────────────────────────────

test.describe('runtime errors', () => {
  test('no console errors on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text())
    })
    page.on('pageerror', err => errors.push(err.message))

    await page.goto('/')
    await ready(page)

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
    await ready(page)

    expect(hydrationWarnings, `Hydration warnings:\n${hydrationWarnings.join('\n')}`).toHaveLength(0)
  })
})

// ── Sections render ───────────────────────────────────────────────────────────

test.describe('header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await ready(page)
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
    await ready(page)
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
    await ready(page)
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
    await ready(page)
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

test.describe('card text stays selectable', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await ready(page)
  })

  test('dragging across a post excerpt selects it instead of following the card', async ({ page }) => {
    await page.locator('.post-card').first().scrollIntoViewIfNeeded()
    const box = (await page.locator('.post-card__body p').first().boundingBox())!

    await page.mouse.move(box.x + 10, box.y + 6)
    await page.mouse.down()
    for (let i = 1; i <= 10; i++) {
      await page.mouse.move(box.x + 10 + ((box.width - 30) * i) / 10, box.y + 6 + (30 * i) / 10)
    }
    await page.mouse.up()

    expect(await page.evaluate(() => window.getSelection()?.toString() ?? '')).not.toBe('')
    // the drag ended on the card, but it was a selection, not a click
    expect(new URL(page.url()).pathname).not.toContain('/writing/')
  })

  test('a plain click still opens the post', async ({ page }) => {
    const card = page.locator('.post-card').first()
    await card.scrollIntoViewIfNeeded()
    const box = (await card.boundingBox())!

    await page.mouse.click(box.x + box.width - 40, box.y + 20)
    await page.waitForURL(/\/writing\//)
  })

  test('a double click selects a word instead of navigating', async ({ page }) => {
    await page.locator('.post-card').first().scrollIntoViewIfNeeded()
    await page.locator('.post-card__body p').first().dblclick()
    // long enough for the deferred single-click navigation to have fired
    await page.waitForTimeout(600)

    expect(await page.evaluate(() => window.getSelection()?.toString().trim() ?? '')).not.toBe('')
    expect(new URL(page.url()).pathname).not.toContain('/writing/')
  })

  test('ctrl+click opens the post in a new tab, like a link would', async ({ page, context }) => {
    const card = page.locator('.post-card').first()
    await card.scrollIntoViewIfNeeded()
    const box = (await card.boundingBox())!

    const opened = context.waitForEvent('page')
    await page.keyboard.down('Control')
    await page.mouse.click(box.x + box.width - 40, box.y + 20)
    await page.keyboard.up('Control')

    const tab = await opened
    expect(new URL(tab.url()).pathname).toContain('/writing/')
    // and the page we clicked from stayed put
    expect(new URL(page.url()).pathname).not.toContain('/writing/')
  })
})

test.describe('cards on touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('a tap opens the card, and hover states never latch', async ({ page }) => {
    await page.goto('/')
    await ready(page)

    const card = page.locator('.work-card').first()
    await card.scrollIntoViewIfNeeded()

    // the resting state is what a touch device sees, before and after the tap
    await expect(card.locator('.work-card__state--short')).toBeVisible()
    await expect(card.locator('.work-card__state--full')).toBeHidden()

    await card.tap()
    await page.waitForURL(/\/work\//)
  })
})

test.describe('contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await ready(page)
    await page.locator('#contact').scrollIntoViewIfNeeded()
  })

  test('an empty form explains every field and focuses the first', async ({ page }) => {
    await page.locator('#contact button[type=submit]').click()

    const shown = page.locator('#contact .contact-error:visible')
    await expect(shown).toHaveCount(3)
    await expect(page.locator('#contact-from')).toBeFocused()
    await expect(page.locator('#contact-from')).toHaveAttribute('aria-invalid', 'true')
  })

  test('a contact that is not a handle or an address is called out, and the hint clears on input', async ({ page }) => {
    await page.fill('#contact-from', 'вася')
    await page.fill('#contact-message', 'привет')
    await page.locator('#contact button[type=submit]').click()

    const hint = page.locator('#contact-from-error')
    await expect(hint).toBeVisible()
    const text = await hint.textContent()

    await page.fill('#contact-from', '@lyoraeth')
    await expect(hint).toBeHidden()
    // the message explains rather than labels: no "error", no "invalid"
    expect(text!.toLowerCase()).not.toMatch(/ошибк|invalid|error/)
  })
})

test.describe('footer', () => {
  test('colophon, legal links and a feed for the active locale', async ({ page }) => {
    await page.goto('/ru')
    await page.waitForLoadState('load')

    const footer = page.locator('footer')
    await expect(footer.locator('.credits-row')).toHaveCount(8)
    await expect(footer.locator('a[href$="rss.xml"]')).toHaveAttribute('href', '/ru/rss.xml')
    await expect(footer.locator('a[href*="privacy"]')).toBeVisible()
  })

  // main's flex-grow fills whatever room is left under a short page, so the
  // footer never strands above the fold with visible empty space beneath it
  // — that's the actual invariant. It doesn't mean the footer's bottom edge
  // lands exactly on the viewport's: the footer has grown taller than a
  // typical viewport on its own (this many credit rows), so on a short
  // enough viewport it already overflows before main contributes anything,
  // which is correct — there was never a gap to fill in the first place.
  test('never strands above the fold — no gap between it and the viewport bottom on a short page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('load')

    const gap = await page.evaluate(() => {
      const main = document.querySelector('main')!
      const kept = main.innerHTML
      main.innerHTML = ''
      const bottom = document.querySelector('footer')!.getBoundingClientRect().bottom
      main.innerHTML = kept
      return Math.round(window.innerHeight - bottom)
    })
    expect(gap).toBeLessThanOrEqual(0)
  })
})

test.describe('phone menu', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('opens, isolates the page, closes on Escape', async ({ page }) => {
    await page.goto('/')
    await ready(page)

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

  // Regression: the mobile search toggle sits in the header bar, above where
  // the menu panel covers — it stayed tappable while the menu was open, and
  // opening it from there didn't close the menu (only the other direction,
  // menu-closes-search, was wired).
  test('opening the search toggle closes an already-open menu', async ({ page }) => {
    await page.goto('/')
    await ready(page)

    const menu = page.locator('#mobile-menu')
    const burger = page.locator('header button[aria-controls="mobile-menu"]')
    const searchToggle = page.locator('button[aria-controls="mobile-search-input"]')

    await burger.click()
    await expect(menu).toBeVisible()

    await searchToggle.click()
    await expect(menu).toBeHidden()
    await expect(page.locator('#mobile-search-input')).toBeVisible()
  })
})

test.describe('mobile search toggle', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  // Regression: closing on an outside click or Escape used to be skipped
  // entirely whenever the field held text — the intent ("never discard
  // typed text") was implemented by refusing to close at all, leaving no
  // way to dismiss the panel once something had been typed into it.
  test('closes on outside click or Escape without discarding a typed query', async ({ page }) => {
    await page.goto('/')
    await ready(page)

    // .search-toggle carries data-open — the field itself never leaves the
    // DOM (it's animated via opacity/tabindex, not v-if), so that attribute
    // is the reliable open/closed signal, not the input's own visibility.
    const field = page.locator('.search-toggle')
    const toggle = page.locator('button[aria-controls="mobile-search-input"]')
    const input = page.locator('#mobile-search-input')

    await toggle.click()
    await expect(field).toHaveAttribute('data-open', 'true')
    await input.fill('design')
    await page.locator('body').click({ position: { x: 5, y: 5 } })
    await expect(field).not.toHaveAttribute('data-open', 'true')

    await toggle.click()
    await expect(input).toHaveValue('design')

    await page.keyboard.press('Escape')
    await expect(field).not.toHaveAttribute('data-open', 'true')
    await expect(toggle).toBeFocused()

    await toggle.click()
    await expect(input).toHaveValue('design')
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

    await page.goto('/')
    await ready(page)
    await page.waitForTimeout(500)
    lcp = await page.evaluate(() => (window as any).__lcp ?? 0)

    console.log(`LCP: ${Math.round(lcp)}ms`)
    expect(lcp, `LCP too high: ${Math.round(lcp)}ms`).toBeLessThan(2500)
  })

  test('JS heap stays under 100MB after full scroll', async ({ page }) => {
    await page.goto('/')
    await ready(page)

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
  await ready(page)
  await page.waitForTimeout(500)

  const heap1 = await page.evaluate(
    () => ((performance as any).memory?.usedJSHeapSize ?? 0) / 1024 / 1024
  )

  await page.reload()
  await ready(page)
  await page.waitForTimeout(500)

  const heap2 = await page.evaluate(
    () => ((performance as any).memory?.usedJSHeapSize ?? 0) / 1024 / 1024
  )
  const growthMB = heap2 - heap1

  console.log(`Heap growth after reload: ${growthMB.toFixed(2)} MB`)
  expect(growthMB, `Possible leak — heap grew ${growthMB.toFixed(2)} MB on reload`).toBeLessThan(10)
})
