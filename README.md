![Project Status](https://img.shields.io/badge/Status-In%20Development-yellow.svg)
![Technologies](https://img.shields.io/badge/Tech-Nuxt%204%2C%20Vue%203%2C%20motion--v%2C%20Lenis%2C%20Tailwind-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

# lyoraeth.art

Personal site — work, writing, contact. Built to show how I take a vague brief or a legacy mess and return something correct, considered, and shippable. The site itself is the demo.

---

## Overview

This is the ninth iteration of my personal site, and the first one built on a proper foundation: a defined brief, a design system, and a tech stack chosen for reasons rather than curiosity.

The design concept is **atmospheric minimalism** — a dark stage with blurred color primitives deep in the background, glass layers with refraction in the middle, and sharp typographic content up front under "gallery light." Volume is achieved through light, blur, and layers — not bevels or drop shadows on buttons.

The codebase itself is part of the case: clean architecture, conventional commits, and a component structure that a next developer could actually maintain.

---

## Stack

| Technology | Purpose |
| :--- | :--- |
| **Nuxt 4** | SSR for SEO, file-based routing, Nitro server |
| **Vue 3** | Composition API, reactive component layer |
| **motion-v** | Declarative animation — variants, scroll triggers, layout animations |
| **Lenis** | Smooth scroll, initialized client-side only |
| **@nuxt/content** | File-based CMS for the writing section (markdown) |
| **@nuxtjs/i18n** | EN / RU with SSR-rendered hreflang |
| **Tailwind CSS** | Utility-first styling, reads design tokens via CSS variables |
| **@vueuse/core** | `useMouse`, `useIntersectionObserver`, `usePreferredReducedMotion` |
| **@nuxt/image** | AVIF/WebP, lazy loading, responsive srcset |
| **@nuxt/fonts** | Self-hosted Golos Text, Onest, JetBrains Mono — no Google Fonts request in prod |

---

## Technical Highlights

### Animation layer (motion-v)
All animations are declarative — no manual lifecycle management, no imperative `addEventListener` chains. Scroll reveals, hero stagger, glass tilt, metaball cursor effect, and blob parallax are all expressed as `:initial` / `:animate` / `:while-in-view` bindings. Everything respects `prefers-reduced-motion` through a single `usePreferredReducedMotion` composable.

### SSR-safe interactivity
Anything touching `window`, `document`, or pointer events lives either in `onMounted` or in `.client`-suffixed plugins. Lenis is initialized this way. The metaball and parallax effects are client-only by design — the server renders clean, fully readable HTML.

### Design system
All design tokens (color, spacing, radius, easing) are defined as CSS custom properties in `assets/css/tokens.css` and consumed by both Tailwind and component styles. The glass recipe (blur, saturation, inner highlight, specular `::after`) is a single reusable `.glass` class applied consistently across cards, nav, and contact panel.

### Backend (Nitro)
The contact form posts to `server/api/contact.post.ts` — a Nitro route that calls the Telegram Bot API. No separate server process, no Python, no Laravel. Telegram token lives in `.env` → `runtimeConfig`, never in the repo.

### Content
Writing posts are `.md` files in `content/en/` and `content/ru/`. Frontmatter carries `title`, `date`, `tags`, and `readingTime`. The main page queries the three most recent; `/writing` serves the full archive. No CMS login, no deploy required to publish a post.

---

## Dev

```bash
pnpm install
pnpm dev          # localhost:3000
```

## Build & Deploy

```bash
pnpm build
pnpm preview      # verify production build locally
```

Production output is a self-contained Node server in `.output/`. On the server:

```bash
node .output/server/index.mjs   # runs on :3000
```

Keep it alive with pm2 or systemd, proxy with nginx or Caddy (Caddy handles Let's Encrypt automatically).

---

## Structure

```
app/
  components/       # UI components (GlassCard, Hero, WorkCard, …)
  pages/            # file-based routes (index, writing/[slug])
  plugins/          # lenis.client.ts
  assets/css/       # tokens.css, global styles
content/
  en/writing/       # EN posts (.md)
  ru/writing/       # RU posts (.md)
server/api/
  contact.post.ts   # form → Telegram
i18n/locales/
  en.json
  ru.json
```

---

## Author

**Danil Klimov**
- GitHub: [@lyoraeth](https://github.com/lyoraeth)
- Telegram: [@lyoraeth](https://t.me/lyoraeth)
