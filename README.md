![Project Status](https://img.shields.io/badge/Status-Live-green.svg)
![Technologies](https://img.shields.io/badge/Tech-Nuxt%204%2C%20Vue%203%2C%20Tailwind%2C%20Sanity-blue.svg)
![License](https://img.shields.io/badge/License-Source%20Reference-red.svg)

<div align="center">
  <h1>lyoraeth.art</h1>
  <p><b>Portfolio, documentation for open-source projects, and an engineering blog</b></p>
  <p>
    Nuxt 4 (SSR) · Sanity CMS · Own media pipeline (JXL / AVIF) · Documentation mirrored from GitHub · E2E on the production image
  </p>
  <p>
    <b>English</b> · <a href="README.ru.md">Русский</a>
  </p>
  <p>
    <a href="https://lyoraeth.art"><b>lyoraeth.art</b></a> ·
    <a href="https://lyoraeth.art/projects">Projects</a> ·
    <a href="https://lyoraeth.art/work">Work</a> ·
    <a href="https://lyoraeth.art/writing">Blog</a> ·
    <a href="SECURITY.md">Security</a>
  </p>
</div>

---

<p align="center">
  <img src="readme/hero.png" width="49%" alt="Home page: hero">
  <img src="readme/mobile.png" width="49%" alt="Mobile version">
</p>
<p align="center">
  <img src="readme/work.png" width="49%" alt="Work section">
  <img src="readme/work-page.png" width="49%" alt="Case study page">
</p>
<p align="center">
  <img src="readme/writing.png" width="49%" alt="Blog">
  <img src="readme/contact.png" width="49%" alt="Contact form">
</p>

**[lyoraeth.art](https://lyoraeth.art)** is my website: a portfolio of commercial case studies, a hub for my own open-source projects, and a blog about interfaces and development. I've been doing graphics, design and programming side by side since childhood — and in client work and my own projects alike, they've always gone hand in hand for me. That's why my main interest sits where visuals, code and aesthetics meet. My core profile is web applications and design systems (**Vue / Nuxt, TypeScript, Tailwind CSS, Node.js**), but I'm not limited to that: I take on web services, desktop software, tools or games — in short, any task where I can clearly see the finished product and know how to get it to release. And since I like to (and often simply have to) build projects end to end, I set up all the server logic, pipelines and infrastructure around them myself too.

This is the third version of the site. The earlier attempts (some of them are left in archived repositories) went to extremes: either near-radical minimalism or heavy over-engineering. Speaking of this site's history — when someone offhandedly called it "AI slop", I dug in and worked out a visual language of my own, which I've been refining ever since, along with the technical side of the site: as my skills grow, the bar for what's acceptable keeps creeping up.

Right now it's a single light theme, a 12-column grid with 1px dividers, a design-token system and an SSR-first architecture on **Nuxt 4**. The site is bilingual (`/` — EN, `/ru/` — RU) and runs without third-party trackers, external fonts or someone else's CDN for image delivery. All content is managed in Sanity but requested and processed strictly on the server: the browser gets finished HTML, locally encoded graphics (`JXL / AVIF / WebP / JPG`) and fonts from its own domain.

The project lives on a single VPS in a Docker container, next to its own Umami analytics instance. Every push to `main` builds an image, runs unit and e2e tests against it, and rolls out the update with an automatic rollback if production fails its `healthcheck`.

---

## Stack and infrastructure

| Part of the system | Solved with | Why and how it's used |
| :--- | :--- | :--- |
| **Framework** | Nuxt 4, Vue 3 (Composition API), Nitro | SSR-first, file-based routing, server API routes and background tasks in one process |
| **Styles** | Tailwind CSS v4 (`@theme static`) | Design tokens are emitted as global CSS variables so they can be read directly from components' `scoped` styles |
| **CMS** | Sanity (`studio/` in the repo) | Work, projects, posts, comments, ratings and global settings; GROQ queries run on the server only |
| **Localization** | `@nuxtjs/i18n` (`prefix_except_default`) | Browser language detected on the first visit, stored in the `i18n_locale` cookie |
| **Markdown, diagrams and code** | `marked`, `Mermaid`, `Shiki` | A custom renderer for articles, projects and legal pages; Mermaid diagrams imported dynamically; lazy code highlighting in the docs |
| **Media pipeline** | `ffmpeg`, `cjxl`, `webpmux` | Background encoding of Sanity originals into JXL / AVIF / WebP / JPG *(JXL — just because I can)* and extracting the first frame of animations |
| **OG cards** | `satori` + `resvg` | Server-side preview rendering for pages without a cover, no external microservices |
| **Mail and protection** | Resend SDK + Cloudflare Turnstile | Contact form, comment moderation from email and CSP alerts without an SMTP server of my own |
| **Analytics** | Umami (self-hosted + Postgres) | Its own container in `docker-compose.yml`, no cookies and no data passed to third parties |
| **Build and tests** | Docker (`node:22-alpine`), Vitest, Playwright | Multi-stage build, GHCR, 189 unit tests and 45 e2e tests against the built production image |
| **Hosting and network** | Sprinthost VPS (St. Petersburg), nginx-proxy-manager | SSL, rate limiting and redirects at the nginx level; DNS on Cloudflare in DNS-only mode (no proxy, so the site opens in Russia without a VPN) |

---

## What's inside and how it works

### 1. An own media pipeline instead of the Sanity CDN
Images are uploaded to Sanity as originals, but the CMS's built-in CDN transforms aren't used for delivery: Sanity has no JXL, unstable AVIF and noticeable softening at high compression quality.

* **Background encoding on a budget:** the Nitro scheduler runs the `media:sync` task every 5 minutes inside the app container. A single run encodes at most 12 variants (`mediaSyncBatch`) — upload a batch of new case studies and the queue stretches over several ticks instead of maxing out the VPS's CPU. Unused variants are deleted (with a safeguard against wiping everything on an empty response from Sanity).
* **Formats and hand calibration:** the order in `<picture>` is `jxl → avif → webp → jpg`. By file size JXL (`cjxl -d 1.8 -e 7 -p`) loses to AVIF, but I simply like the format a lot, and its progressive loading — I wanted to use it in practice and show off a little. AVIF is encoded with `libaom-av1` at full chroma `yuv444p` (`crf 23`), since small text and flat interface colours in portfolio screenshots don't survive standard subsampling well. WebP uses the `text` preset and caps the long side at 16383px (the format's limit, which long full-page screenshots hit).
* **Two crop families:** `full` keeps the original proportions (a `640 / 1280 / 1920 / 2560` ladder, trimmed to the source width), while `cover` crops the frame on the server to `4:3` anchored at the top edge (`480 / 960 / 1440 / 1920`), so a narrow card doesn't pull a full-size page screenshot.
* **Fallback on the fly:** per the spec, `<picture>` doesn't fall back to the next `<source>` if the chosen variant returns a 404 (for example, while it's still queued for encoding). So when the `<img>` fails to load, a client script drops the `<source>` tags and the image is pulled straight from the raw Sanity URL.
* **Animated WebP and GIF:** detected from the file header without full decoding (the flag in the `VP8X` chunk for WebP, or more than one frame for GIF). The original is stored as `{sha1}-anim.{webp|gif}`, while the first frame is cut out with `webpmux` and run through the normal pipeline as a static placeholder. The client renders the placeholder first, loads the animation in the background and swaps the frame after `decode()` (with `prefers-reduced-motion`, or in a `4:3` crop, it stays static).

### 2. Documentation mirrored from GitHub (`/projects/[slug]/docs`)
Every open-source project on the site has its own landing page and an optional documentation section. The texts are pulled straight from the project's GitHub repository:

* **Tree and locales:** the structure is built from `docs/SUMMARY.md` (mdBook format) and `docs/ru/SUMMARY.md`. Russian and English pages are matched by their position in the tree, and if the structures diverge, it falls back to the English version.
* **Isolation and security:** since the documentation is rendered through `v-html`, the repository owner is strictly limited to an allowlist (`lyoraeth`), both in the Studio schema and on the server. Attempts to escape the folder (`../`) resolve to `null`, and of the external link schemes only `http(s)` and `mailto` get through. Internal links are rewritten automatically to the site's routes or the project's landing page.
* **Disk cache and fault tolerance:** the index and pages are cached on disk in the media volume (`media/_docs-cache`, 30 minutes fresh + a day stale) and survive a container restart. The GitHub request timeout is 8 seconds, and responses heavier than 512 KB are discarded. If GitHub doesn't respond, the resource goes into a failure memo (up to 500 keys) and fails fast for a minute without waiting out the timeout; with an empty cache, a "documentation temporarily unavailable" page is rendered with a link to the repo.
* **Search and highlighting:** the client-side search indexes page titles in both locales and the `h2`/`h3` subheadings of the current language. Shiki grammars are loaded lazily after mount, only for the languages that appear on the page.

### 3. Content, CMS and moderation without an admin panel
* **Both languages in one document:** in Sanity, both locales are stored in `{ en, ru }` fields of the same document. The server returns both languages at once, and switching happens instantly on the client through `useLoc`.
* **Extended Markdown:** articles support galleries by key (`![caption](gallery:key){ar=16/9 fit=cover pos=top}` — an unknown key safely turns into an empty HTML comment), numbered source lists and `mermaid` diagrams (the package itself is imported dynamically only in posts that have such a code block).
* **One-click comment moderation from email:** new comments pass a Turnstile check and are saved to Sanity with `approved: false`. Through Resend, the server sends me an email with the text and a `GET /api/comment/approve?id=…&token=…` link. The token is an `HMAC-SHA256` of the document ID, verified with `timingSafeEqual`. A comment can be approved straight from a phone, without logging into Sanity Studio.
* **Ratings without storing IPs:** article voting (`POST /api/rating/[slug]`) deduplicates votes by using a salted `SHA-256` of `IP + slug` as the document ID. Raw IP addresses are never stored.
* **Maintenance banner:** the `siteSettings` singleton in the CMS can switch on a top notice banner without a deploy. The `html:has(.site-notice)` selector sets the `--notice-h` variable, which the sticky header and the `scroll-padding-top` of anchor links shift by automatically.

### 4. Design system, typography and motion
* **Grid and tokens:** 12 → 8 → 4 columns (the 640px `sm` step is disabled on purpose; the content band maxes out at `1680px` / `105rem`). All colours are defined in `oklch` in `design-system.css`, with an automatic hex fallback through an `@supports not (color: oklch(0 0 0))` block.
* **Three geometric rules for shapes:** all content (cards, images) is rectangular, with no rounding; controls and filters ("See all…" buttons, tags, CV links) are round pills; the two main accent actions ("Get in touch" in the hero and Telegram in the contacts) are rectangular cells with a label on top and a fill on hover.
* **Licensed fonts outside the repository:** **PP Neue Montreal** (text, UI) and **PP Pangram Sans** (headings). The `.woff2` files aren't in Git and aren't baked into the Docker image: they're mounted from the host into `/app/fonts` and served by the Nitro route `/fonts/[file]`, with the name checked against a regex, a permanent cache and a `Cross-Origin-Resource-Policy: same-origin` header against hotlinking from other domains.
* **Motion calibration and scrolling:** transition durations are chosen by the limits of visual perception (the breakdown is published in the post *"How Many Milliseconds an Interface Actually Needs"*): base hover — `180 ms`, press — `90 ms`, the reaction of a card's neighbouring elements — `220 ms`, the blog card's fill sweep — `620 ms`. A single `--ease-out` curve is used, with its exact reflection `--ease-in` for elements leaving the screen. One `prefers-reduced-motion` block turns all transitions off instantly. The custom scroll interceptor (Lenis) is removed completely — in the first version of the site it broke scrolling on Xiaomi phones and ASUS touchpads; scrolling is now the browser's own.
* **Cards without overlay links:** cards are clickable as a whole without an empty `<a>` stretched over them. The real link sits only on the heading, and the card forwards the gestures programmatically: text inside can be selected with the mouse as usual, a click on text waits out the double-click window, and `Ctrl` / `⌘` / the mouse wheel open a background tab. Hover states sit behind `@media (hover: hover)` and don't stick after a tap on a phone.

### 5. SEO, AI agents and generated static files
* **A linked JSON-LD graph:** the home page declares a `Person` node with an `@id`, and the `BlogPosting`, `CreativeWork` and `SoftwareSourceCode` schemas on inner pages reference it by that identifier.
* **Dynamic OG previews:** if a page has no cover of its own, the `/og/[type]/[slug]` route builds a card on the fly with `satori` and `resvg`. A `base64` string is stored in the Nitro cache, since the built-in cache serializes entries to JSON and, when a raw `Buffer` was stored, turned it into a `{"type":"Buffer",...}` object — which left Telegram previews stuck loading.
* **Machine readability (`llms-full.txt` and WebMCP):** besides `sitemap.xml` and localized RSS feeds (marked `noindex` so search engines don't treat the EN and RU feeds as duplicates), the `/llms-full.txt` route gathers all work and articles from Sanity into a single text document for LLMs. The page also registers a WebMCP `send_message` tool, which lets AI agents submit the contact form directly without parsing the markup (protected by a length limit and rate limiting).

### 6. Security and privacy
* **Headers:** every response is sent with `Strict-Transport-Security` (preload), `Cross-Origin-Opener-Policy: same-origin`, `X-Frame-Options: DENY` and a strict `Permissions-Policy` (camera, microphone, geolocation, payments, USB, Bluetooth and FLoC disabled).
* **An own CSP receiver:** the `Content-Security-Policy-Report-Only` policy sends violation reports to the internal `POST /api/csp-report` endpoint, which forwards them by email through Resend without third-party collectors (in dev mode sending is off, so it doesn't spam on HMR and Vue DevTools triggers).
* **Endpoint protection:** `POST /api/comment`, `/api/contact` and `/api/mcp/send` are shielded from flooding at the nginx level (`limit_req_zone`) and cut excess requests off with `429` before they reach Node.js. There's a PGP-signed `/.well-known/security.txt` and a vulnerability disclosure policy in [SECURITY.md](SECURITY.md).

---

## CI/CD and testing

The deploy pipeline (`.github/workflows/deploy.yml`) is built so that a broken image can't stay in production. Parallel runs are queued (`concurrency: deploy` without cancelling the current step) to avoid a `race condition` when two commits are deployed over SSH back to back.

1. **Verify:** a quick check without a browser or Docker — `pnpm install --frozen-lockfile`, ESLint, type checking and **189 unit tests (Vitest)** (composables, Markdown and documentation parsers, the media width ladder, `en.json` / `ru.json` locale key parity, the version generator).
2. **Build image:** a multi-stage image is built and pushed to GHCR under the commit tag (not `latest`). At the same step, the `computeVersion.mjs` script replays the whole Git history and computes a semantic version of the form `2.x.y+build` for the colophon in the footer.
3. **E2E against the built image:** CI starts exactly the Docker container that will go to the server (with test Turnstile keys and font stubs). Once it passes its `HEALTHCHECK`, **45 e2e tests (Playwright)** run against it: navigation without hydration errors or a lost root node (`<Transition>`), the lightbox, the media pipeline, no console errors, no horizontal scroll, no event-listener leaks, as well as performance budgets (LCP < 2.5 s, heap growth on scroll < 100 MB).
4. **Promote to latest:** only after a green Playwright run does the image get the `latest` tag.
5. **Deploy & Auto-rollback:** the SSH deploy writes the new version straight into `.env`, remembers the ID of the currently running image, updates the container and waits for a `healthy` status inside Docker plus a successful external smoke request to `https://lyoraeth.art`. If any of the checks fails, the script **automatically rolls back** the `latest` tag and `.env` to the previous version and restarts the old container.

> **An IPv6 detail in Alpine:** the `HEALTHCHECK` inside the container hits `http://127.0.0.1:3000/api/health` strictly, not `localhost`. In `node:22-alpine`, the name `localhost` resolves to `::1` as well, and busybox's built-in `wget` tries IPv6 first, where Node (`HOST=0.0.0.0`) isn't listening.

---

## Known limitations and plans

Current architectural trade-offs and queued tasks:

* **CSP in Report-Only mode:** the content security policy is still collecting statistics on the allowlist before switching to blocking mode (Enforce).
* **Animation check queue:** checking existing WebP/GIF files for animation in the `media:sync` task currently shares the per-run limit (`mediaSyncBatch = 12`) with encoding new images and waits for a free slot.
* **GitHub documentation limits:** requests to the GitHub API for the latest release go without a token (a limit of 60 requests per hour from the server's IP, smoothed out by a 30-minute cache), and the documentation branch is still pinned to `main` (support for `docsRef` tags, prev/next pagination and full-text search are postponed).
* **Performance metrics:** LCP and memory budgets are checked synthetically in Playwright on every build (local LCP ~572 ms), but RUM / CrUX collection and Lighthouse CI aren't connected yet.

---

## Local setup and development

**Requirements:** Node.js 22+, `pnpm`, plus the `ffmpeg`, `cjxl` (`libjxl-tools`) and `webpmux` (`libwebp-tools`) utilities in `PATH` for the media pipeline to work normally (if they're missing, the encoding task won't run, but the site itself keeps working in an emergency fallback mode, serving the raw originals from the Sanity CDN).

1. Install the dependencies and copy the environment template:
   ```bash
   pnpm install
   cp .env.example .env
   ```
2. Fill in `.env` with the Sanity project keys (`NUXT_SANITY_PROJECT_ID`, `DATASET`, `TOKEN`), test or production Turnstile keys and a Resend API key.
3. Start the development server:
   ```bash
   pnpm dev          # http://localhost:3000
   ```

### Useful commands

```bash
# Build and preview the production version locally
pnpm build && pnpm preview

# Lint and TypeScript type checking
pnpm lint
pnpm typecheck

# Run unit tests (Vitest)
pnpm test

# Run e2e tests (Playwright starts the server itself if it isn't running)
pnpm test:e2e

# Deploy the Sanity Studio schemas and UI (requires project owner rights)
cd studio && npx sanity deploy
```

---

## Repository structure

```text
app/
  components/           # SiteHeader, MobileMenu, PageFooter, SiteNotice, SanityPicture,
                        # WorkCard, PostCard, ProjectShowcase, DocsSidebar, ArticleToc,
                        # SearchResults, LegalArticle, sections/*, post/*
  composables/          # useMarkdown, useToc, useSiteSearch, useDocsSearch, useCodeHighlight,
                        # useAnimatedMedia, useArticleSeo, useCardLink, useTrack, useReveal...
  pages/                # index, projects/[slug](/docs/[[page]]), work/[slug], writing/[slug],
                        # privacy, personal-data (152-FZ)
  layouts/redesign.vue  # The site's main shell
  assets/css/           # main.css (layers), design-system.css (tokens), prose.css (article typography)
  assets/content/       # Legal texts in Markdown (EN / RU)
shared/
  media.ts              # Naming rules and the width ladder (shared by the server and the client)
  docs.ts, markdown.ts  # Shared parsing and navigation utilities
server/
  api/                  # Endpoints for content, contact, comments, ratings, releases, CSP and WebMCP
  routes/               # Serving /media/*, /fonts/*, generating /og/*, sitemap.xml, rss.xml, llms-full.txt
  tasks/media/sync.ts   # The image encoding scheduler (every 5 minutes)
  utils/                # Sanity and GitHub clients, media encoder, failure cache, OG templates
  plugins/timing.ts     # The Server-Timing: app;dur= header
studio/                 # Sanity Studio (document schemas and configuration)
scripts/                # computeVersion.mjs (computing the semver version from commit history)
tests/                  # unit/ (Vitest) and e2e/ (Playwright)
i18n/locales/           # UI dictionaries en.json and ru.json
```

---

## How it's made

This site is a distillation of the practical skills, architectural patterns and layout techniques I've learned and tried out for real at my main job and in freelance work. All of the visual design, the grid, the typography and the token system are mine.

It was built with an [agentic engineering](https://simonwillison.net/2026/may/6/vibe-coding-and-agentic-engineering) approach, paired with [Claude Code](https://claude.com/claude-code) (Anthropic), but unlike my experiments with Rust, the AI's role here is utilitarian. Since the web stack is my core profile, I came up with the architecture, the component structure, the server logic and the infrastructure, and partly wrote them myself, following working patterns I already knew.

Every decision is checked by hand and covered by automated tests on the real production image, but I'm always glad of a constructive outside view. If you spot a bug, an architectural misstep or a place in the code that could be cleaner — message me on Telegram or open an [issue](https://github.com/lyoraeth/lyoraeth-art/issues).

---

## Contact and attribution

For work, collaboration or code discussions:

* **Website and contact form:** [lyoraeth.art/#contact](https://lyoraeth.art/#contact)
* **Telegram:** [@lyoraeth](https://t.me/lyoraeth)
* **GitHub:** [@lyoraeth](https://github.com/lyoraeth)

### Attribution
* **Fonts:** PP Neue Montreal and PP Pangram Sans by [Pangram Pangram](https://pangrampangram.com/) (Explore & Pitch Font Pack).
* **Hero image:** Lyubov Popova, *Painterly Architectonic*, 1918 (public domain, MoMA collection / Wikimedia Commons).

---

## License

The project is published under the **Source Reference License**. The source code is open solely for reading and studying the engineering decisions. Copying the code, design, graphics, texts, localization dictionaries and legal documents is prohibited. The full terms are in **[LICENSE](LICENSE)**.
