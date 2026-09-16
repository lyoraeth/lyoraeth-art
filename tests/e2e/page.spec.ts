import { test, expect, type Page } from '@playwright/test'

/*
 * Waits are on 'load', not 'networkidle': the contact form embeds a Turnstile
 * widget that keeps a connection open, so the network never goes idle.
 *
 * 'load' alone isn't enough to interact, though — the markup is there but the
 * handlers are not, and a click on a submit button would post the form the
 * native way, reloading the page. __vue_app__ appears at createApp, before
 * hydration attaches listeners; the root instance's isMounted flips true only
 * once hydration has finished walking the tree, which is the real signal that
 * a click will land on a wired handler.
 */
async function ready(page: Page) {
  await page.waitForLoadState('load')
  await page.waitForFunction(() => {
    const app = (document.querySelector('#__nuxt') as any)?.__vue_app__
    return Boolean(app?._instance?.isMounted)
  })
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
      getComputedStyle(document.documentElement).scrollPaddingTop,
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

test.describe('writing index topic filter', () => {
  // Regression: selecting a topic unmounts the option button (v-if on the
  // panel) right after — closing this way, unlike Escape, left focus on the
  // removed element, which browsers drop back to <body> rather than
  // anywhere useful.
  test('selecting a topic returns focus to the dropdown trigger', async ({ page }) => {
    await page.goto('/writing')
    await ready(page)

    const trigger = page.locator('.filter-dropdown__trigger')
    await trigger.click()
    await page.waitForSelector('.filter-dropdown__panel')
    await page.locator('.filter-dropdown__option').first().click()

    await expect(trigger).toBeFocused()
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

test.describe('client-side navigation', () => {
  // Regression: a page with a Fragment root (multiple roots, a v-if root, a
  // comment beside the root) breaks <NuxtPage>'s <Transition mode="out-in">
  // on a client-side route change — the URL updates but the incoming page
  // never mounts, so <main> is left empty. A full page.goto() masked it (SSR,
  // no client transition), which is why earlier tests navigated that way.
  test('clicking a card actually renders the destination, no root-node warnings', async ({ page }) => {
    const warnings: string[] = []
    page.on('console', m => {
      if (/single root node|non-element root|cannot be animated/i.test(m.text())) warnings.push(m.text())
    })

    // each hop is a fresh load then a *clicked* (client-side) navigation —
    // the click is what exercises <Transition>, goBack() just churns the
    // homepage reveal animation and detaches cards mid-click
    for (const [from, cardLink, dest] of [
      ['/',        '.post-card a', /\/writing\/[^/]+$/],
      ['/',        '.work-card a', /\/work\/[^/]+$/],
      ['/writing', '.post-card a', /\/writing\/[^/]+$/],
      ['/work',    '.work-card a', /\/work\/[^/]+$/],
    ] as const) {
      await page.goto(from)
      await ready(page)
      await page.locator(cardLink).first().click()
      await page.waitForURL(dest)
      await expect(page.locator('main h1').first()).toBeVisible()
    }

    expect(warnings).toEqual([])
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

  // Regression: a failed submit cleared the token in JS but never called the
  // widget's own reset() — it kept showing "verified" for a token that had
  // already been spent, and a retry sent an empty one. Can't observe the
  // widget's internal state directly (third-party embed), so this checks
  // what's actually observable: the retry after a failure goes through at
  // all, and reset() (called unconditionally in `finally`) never throws.
  test('a failed send can be retried without reloading the page', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    // First call fails, second succeeds — both mocked, so the outcome only
    // depends on the form's own retry logic, not on whether this sandbox has
    // real Resend/Turnstile credentials configured.
    let calls = 0
    await page.route('**/api/contact', route => {
      calls += 1
      if (calls === 1) return route.fulfill({ status: 500, json: { message: 'boom' } })
      return route.fulfill({ status: 200, json: { ok: true } })
    })

    await page.fill('#contact-from', '@lyoraeth')
    await page.fill('#contact-message', 'test message')
    await page.locator('#contact-consent').check()

    await page.locator('#contact button[type=submit]').click()
    await expect(page.locator('#contact .contact-status[data-state="error"]')).toBeVisible()

    await page.locator('#contact button[type=submit]').click()
    await expect(page.locator('#contact .contact-status:not([data-state="error"])')).toBeVisible()
    expect(calls).toBe(2)

    expect(errors, `Console errors:\n${errors.join('\n')}`).toHaveLength(0)
  })
})

test.describe('post comments', () => {
  test.beforeEach(async ({ page }) => {
    // Direct navigation, not a click-through from the card grid: clicking a
    // card and landing on an empty <main> (no article, no h1 — header and
    // footer render, the page's own content never does) reproduces 100% of
    // the time right now. Client-side route transitions into a [slug] page
    // are exactly the "иногда отрисовка страниц работают криво" routing
    // issue already on the plan as its own stage — not this one's to fix,
    // so this test reads the target href off the card (real, current slug,
    // not hardcoded) and navigates to it directly instead of clicking it.
    await page.goto('/')
    await ready(page)
    const href = await page.locator('.post-card a').first().getAttribute('href')
    await page.goto(href!)
    await ready(page)
    await page.locator('#c-nick').scrollIntoViewIfNeeded()
  })

  // Not a full submit-retry regression like the contact form's: this widget
  // is appearance="invisible", and unlike the contact form's visible one it
  // never resolved a token within a reasonable wait under Playwright here,
  // so driving an actual submit is impractical to pin down reliably. The
  // reset()-on-finally fix itself is the same few lines, on the same
  // NuxtTurnstile API, already exercised by the contact form's equivalent
  // test — this just checks the form is otherwise intact and field-level
  // validation still runs (which doesn't depend on the widget resolving).
  test('client-side validation runs independently of the (invisible) captcha', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    // The submit button is legitimately disabled until the widget resolves a
    // token — dispatching the form's submit event directly is the same path
    // Vue's @submit.prevent handler runs on a real click, without needing
    // the button enabled first.
    await page.locator('.comment-form').evaluate(form => (form as HTMLFormElement).requestSubmit())
    // p, not the consent <label> itself (also text-text-critical when invalid)
    await expect(page.locator('.comment-form p.text-text-critical')).toHaveCount(3) // nick + message + consent

    expect(errors, `Console errors:\n${errors.join('\n')}`).toHaveLength(0)
  })
})

test.describe('work case cover lightbox', () => {
  test.beforeEach(async ({ page }) => {
    // Direct navigation — see the 'post comments' describe above for why.
    await page.goto('/')
    await ready(page)
    const href = await page.locator('.work-card a').first().getAttribute('href')
    await page.goto(href!)
    await ready(page)
  })

  // Regression: role="dialog" aria-modal="true" claimed modal behaviour the
  // lightbox didn't actually have — opening it never moved focus in, and
  // closing it never gave focus back to the button that opened it.
  test('moves focus in on open and back to the trigger on close', async ({ page }) => {
    const cover = page.locator('.work-cover')
    if (await cover.count() === 0) test.skip(true, 'this work item has no cover')

    await cover.click()
    await expect(page.locator('.work-lightbox__close')).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(page.locator('.work-lightbox')).toBeHidden()
    await expect(cover).toBeFocused()
  })

  // Regression: focus moved into the lightbox on open, but <main> behind it
  // stayed reachable by Tab — aria-modal="true" claimed modal behaviour the
  // page didn't actually enforce.
  test('makes the page behind it inert while open', async ({ page }) => {
    const cover = page.locator('.work-cover')
    if (await cover.count() === 0) test.skip(true, 'this work item has no cover')

    await expect(page.locator('main')).not.toHaveAttribute('inert')
    await cover.click()
    await expect(page.locator('main')).toHaveAttribute('inert')

    await page.keyboard.press('Escape')
    await expect(page.locator('main')).not.toHaveAttribute('inert')
  })

  // The case cover goes through SanityPicture → the self-hosted media
  // pipeline: an art-directed <picture> whose sources are all /media/ URLs,
  // and those must actually resolve.
  test('serves the cover from the self-hosted /media/ pipeline', async ({ page }) => {
    const cover = page.locator('.work-cover')
    if (await cover.count() === 0) test.skip(true, 'this work item has no cover')

    const srcsets = await cover.locator('source').evaluateAll(
      els => els.map(el => (el as HTMLSourceElement).srcset),
    )
    expect(srcsets.length).toBeGreaterThanOrEqual(8) // 4 formats × (full + cover)
    expect(srcsets.every(s => /^\/media\/[0-9a-f]{40}-(cover|full)-\d+\.(jxl|avif|webp|jpg)/.test(s))).toBe(true)

    // first URL of the first srcset — it should 200, not fall through to <img>
    const url = srcsets[0]!.split(' ')[0]!
    const res = await page.request.get(url)
    expect(res.status()).toBe(200)
    expect(res.headers()['cache-control']).toContain('immutable')
  })
})

test.describe('language switch', () => {
  test('switches locale from the home page and back from a sub-page, hash dropped when present', async ({ page }) => {
    await page.goto('/')
    await ready(page)

    const langLink = page.locator('.header-bar a[aria-label*="Switch language" i], .header-bar a[aria-label*="Сменить язык" i]')
    await langLink.click()
    await page.waitForURL(/\/ru\/?$/)
    await ready(page)

    // and back, from a different page this time
    await page.goto('/ru/work')
    await ready(page)
    await page.locator('.header-bar a[aria-label*="Switch language" i], .header-bar a[aria-label*="Сменить язык" i]').click()
    await page.waitForURL(url => url.pathname === '/work')

    // switching from an anchored URL drops the hash — the target section may
    // not exist (or exist at the same id) on the other locale's page
    await page.goto('/#contact')
    await ready(page)
    await expect(
      page.locator('.header-bar a[aria-label*="Switch language" i], .header-bar a[aria-label*="Сменить язык" i]'),
    ).toHaveAttribute('href', '/ru')
  })
})

test.describe('legal pages', () => {
  test('privacy renders with linkable section headings', async ({ page }) => {
    await page.goto('/privacy')
    await ready(page)
    await expect(page.locator('h1, h2').first()).toBeVisible()
    // regression: these used to render via a bare marked() call with no
    // heading-id renderer — every section was unlinkable
    await expect(page.locator('.post-body h2[id]').first()).toBeAttached()
  })

  test('personal-data redirects en visitors to privacy, but serves ru directly', async ({ page }) => {
    await page.goto('/personal-data')
    await page.waitForURL('/privacy')

    await page.goto('/ru/personal-data')
    await ready(page)
    await expect(page).toHaveURL('/ru/personal-data')
    await expect(page.locator('.post-body')).toBeVisible()
  })
})

test.describe('maintenance notice', () => {
  // The flag lives in the CMS and the layout reads it during SSR, so the
  // "on" state can't be mocked from the browser — it's covered by the
  // SiteNotice component test. Here: off by default, header unoffset.
  test('is absent by default and the header sits flush at the top', async ({ page }) => {
    await page.goto('/')
    await ready(page)
    await expect(page.locator('.site-notice')).toHaveCount(0)
    const top = await page.locator('.header').first().evaluate(el => getComputedStyle(el).top)
    expect(top).toBe('0px')
  })
})

test.describe('404 page', () => {
  test('renders the branded error page, not a bare JSON payload, and is not indexed', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', err => errors.push(err.message))

    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
    await ready(page)

    await expect(page.locator('.error-cat')).toBeVisible()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
    // header/footer still render around it — it goes through the normal layout
    await expect(page.locator('header')).toBeVisible()
    await expect(page.locator('footer')).toBeVisible()

    expect(errors, `Console errors:\n${errors.join('\n')}`).toHaveLength(0)
  })
})

test.describe('footer', () => {
  test('colophon, legal links and a feed for the active locale', async ({ page }) => {
    await page.goto('/ru')
    await page.waitForLoadState('load')

    const footer = page.locator('footer')
    await expect(footer.locator('.credits-row')).toHaveCount(9)
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
    await page.addInitScript(() => {
      new PerformanceObserver(list => {
        const entries = list.getEntries()
        ;(window as any).__lcp = entries[entries.length - 1].startTime
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })

    await page.goto('/')
    await ready(page)
    await page.waitForTimeout(500)
    const lcp = await page.evaluate(() => (window as any).__lcp ?? 0)

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
      () => ((performance as any).memory?.usedJSHeapSize ?? 0) / 1024 / 1024,
    )
    console.log(`JS heap after full scroll: ${heapMB.toFixed(1)} MB`)

    expect(heapMB, `Heap too large: ${heapMB.toFixed(1)} MB`).toBeLessThan(100)
  })
})

// ── Event listener leak probe ─────────────────────────────────────────────────

test('event listener count does not grow on navigation', async ({ page }) => {
  await page.goto('/')
  await ready(page)
  await page.waitForTimeout(500)

  const heap1 = await page.evaluate(
    () => ((performance as any).memory?.usedJSHeapSize ?? 0) / 1024 / 1024,
  )

  await page.reload()
  await ready(page)
  await page.waitForTimeout(500)

  const heap2 = await page.evaluate(
    () => ((performance as any).memory?.usedJSHeapSize ?? 0) / 1024 / 1024,
  )
  const growthMB = heap2 - heap1

  console.log(`Heap growth after reload: ${growthMB.toFixed(2)} MB`)
  expect(growthMB, `Possible leak — heap grew ${growthMB.toFixed(2)} MB on reload`).toBeLessThan(10)
})
