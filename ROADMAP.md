# Roadmap

> Personal working notes — written in Russian for speed.

Labels: `fix` `feat` `design` `content` `sec` `perf` `infra` `analytics` `a11y` `dx`

---

## Todo

- [ ] `analytics` кастомные события Umami — lang-switch, section-view, scroll-depth, cta-click, copy-email, work-open/depth/completed/link, post-read/completed, reference-click, comment-start, contact-start, outbound-click
- [ ] `analytics` алгоритм релевантности блога — score = log(views+1)×w₁ + completions×w₂ + votes×w₃ + comments×w₄ + boost×freshness_decay; Nitro-утилита fetchUmamiEvents с кешем ~1ч; UMAMI_API_URL + UMAMI_API_KEY в env
- [ ] `a11y` alt-атрибуты обложек из Sanity

## Considering

- [ ] `perf` динамические OG images — Satori/nuxt-og-image, брендированный шаблон per-post/per-case
- [ ] `feat` beta-banner — флаг inDevelopment в siteSettings (Sanity) + первый визит, появляется через 15-30с, автоскрытие, крестик, localStorage чтобы не показывать снова
- [ ] `feat` RSS feed — /rss.xml через Nitro route
- [ ] `feat` TOC для длинных постов — якорные ссылки, sticky sidebar (событие toc-click уже в плане)
- [ ] `feat` навигация пред/след пост — в конце writing/[slug]
- [ ] `dx` расширить Playwright — покрытие writing/[slug], work/[slug], форм (scaffold уже есть)
- [ ] `feat` донаты — оценить целесообразность
- [ ] `dx` Lighthouse CI
- [ ] `a11y` WCAG 2.2 AA аудит
- [ ] `dx` feature flags
- [ ] `dx` Storybook компонентов
- [ ] `dx` contract testing API
- [ ] `infra` полноценный error tracking
- [ ] `infra` Advanced observability
- [ ] `feat` PWA

---

## Done

- [x] `fix` смена языка сбрасывала скролл — router.options.ts, stripLocale-сравнение путей
- [x] `feat` nav дропдаун — ховер на Work/Writing, топ-3 кейса/поста, Teleport + backdrop-filter, i18n, анимация, тёмный/светлый режим по состоянию хэдера
- [x] `fix` стрелочки на кнопках — vertical-align: middle
- [x] `feat` комментарии — схема, Studio, email-апрув через Resend + HMAC
- [x] `content` локализация body постов — поле bodyRu в схеме и GROQ
- [x] `infra` Healthcheck — /api/health + HEALTHCHECK в Dockerfile
- [x] `infra` CI/CD — Dockerfile, docker-compose, GitHub Actions → GHCR → VPS
- [x] `sec` Permissions-Policy заголовок
- [x] `sec` CSP report endpoint — /api/csp-report → алерт Resend
- [x] `sec` security.txt, pgp-key.txt, humans.txt
- [x] `sec` SECURITY.md — политика ответственного раскрытия
- [x] `sec` Rate limiting — nginx limit_req_zone на /api/comment и /api/contact
- [x] `legal` Source Reference License вместо MIT
- [x] `legal` страницы privacy/personal-data — MD-based, GDPR consent checkboxes
- [x] `perf` Server-Timing — Nitro плагин, метрика app;dur
- [x] `perf` Lenis smooth scroll
- [x] `perf` долгий кеш статики, eager loading карточек портфолио
- [x] `seo` sitemap.xml + robots.txt — динамические Nitro-роуты
- [x] `seo` OG image, Twitter card, JSON-LD (Person + BlogPosting)
- [x] `feat` llms.txt + WebMCP — send_message tool
- [x] `feat` llms-full.txt — динамический Nitro-роут с контентом из Sanity
- [x] `feat` siteSettings singleton в Sanity — Telegram, GitHub, CV
- [x] `feat` availability status в nav — из CMS, пульсирующий индикатор
- [x] `feat` bilingual CV из Sanity
- [x] `feat` Umami — client plugin, env-gated, prod-only
- [x] `feat` источники в постах — references[] в Sanity, нумерованный footer
- [x] `feat` Markdown body — marked вместо Portable Text, кастомный рендерер
- [x] `feat` прогресс-бар чтения — ember-полоска, только на writing/[slug]
- [x] `a11y` skip link, focus-visible, ARIA, heading order, reduced-motion
- [x] `a11y` CLS — размеры обложек из метаданных Sanity, aspect-ratio
- [x] `design` типографика кейсов — lead, line-height 1.9, drop cap, text-indent
- [x] `design` типографика блога — prose стили, drop cap, pre/code блоки
- [x] `design` кастомный скроллбар — тонкий, ember-оттенок
- [x] `ux` кастомная валидация форм — inline, novalidate, без браузерных тултипов
- [x] `docs` README и LICENSE — обновлены, политика AI-датасетов
- [x] `fix` дублировалось "Got a project?" — убран лишний ключ из локалей
- [x] `fix` i18n — localePath() на всех внутренних ссылках
- [x] `fix` overscroll-behavior: none — убрано резиновое оттягивание
- [x] `infra` DNS-only — сайт доступен в России без CF-прокси (РКН)
