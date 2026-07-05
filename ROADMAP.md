# Roadmap

> Personal working notes — written in Russian for speed.

Labels: `fix` `feat` `design` `content` `sec` `perf` `infra` `analytics` `a11y` `dx`

---

## Done — редизайн (exp/redesign-v2)

- [x] `feat` отсебяшка в хиро из Sanity — image-поле в siteSettings, SanityPicture вместо статики из /public, alt из hero.name; текущий файл остаётся фоллбэком (студии нужен редеплой для нового поля)
- [x] `design` пересмотреть плейсхолдеры — FPO-система (print-разметка: кроп-марки, обрез, диагонали) вместо косплея ОС; исходники в lyoaeth-brand/placeholders, продовые в public/placeholders; viewport-bar и loading-машинерия убраны
- [x] `design` ApproachSection — стекло оставить, но подзагасить (интенсивность каустики/блюра вниз)
- [x] `dx` убрать артефакты редизайна — мёртвые .card-glare дивы, токены --duration-blob/--duration-tilt/--duration-metaball/--ease-stage/--duration-magnet, мёртвый .form-privacy; glass-caustic оставлен (док + Approach); тесты useGlowCard переписаны под новый API
- [x] `content` локали, быстрый проход — слоган к «результату», RU унифицирован на «вы», approach без оправдательных усилителей (полный проход — после мержа)
- [x] `docs` README, быстрый проход — концепт/дизайн-секция переписаны под editorial minimalism, поправлены typography/tokens рассинхроны (СКРИНШОТЫ В readme/ УСТАРЕЛИ — переснять после мержа; полный проход — после мержа)
- [ ] унифицировать высоту хэдера на телефоне. Эталон - страница поста - ~72px. Странно выглядит что на главной он меньше

## Todo

- [x] `fix` !! lenis — на touch не инициализируется вовсе (pointer: coarse), тачпады детектятся по wheel-сигнатуре (дробные/мелкие дельты) → destroy
- [x] `fix` !! прокрутка на телефонах — lenis на touch убран целиком; ПРОВЕРИТЬ НА XIAOMI 15T после деплоя
- [x] `fix` !! футер-куртина на touch — обычный статичный футер в потоке (без reveal/hold), на десктопе поведение прежнее
- [x] `fix` TOC в статьях — остаётся fixed (sticky мёртв при overflow-x:hidden на html/body — НЕ ПЕРЕДЕЛЫВАТЬ НА STICKY), стоп у низа комментариев через clamp в scroll-хендлере
- [x] `seo` статьи блога и все индексируемые страницы — description-экскерпт из markdown, трансформированный og:image (w1200/jpg) + dims/alt, hreflang/canonical/og:locale глобально через useLocaleHead, sitemap с xhtml-альтернативами + lastmod, обогащённый JSON-LD (BlogPosting/BreadcrumbList/CreativeWork/Blog/CollectionPage), RSS EN+RU, prev/next в статьях, noindex на error, fetchpriority на LCP. Смоук против собранного сервера пройден. РУЧНОЕ ПОСЛЕ ДЕПЛОЯ: GSC + Яндекс.Вебмастер + Bing — скормить sitemap, request indexing
- [x] `fix` webp/png фоллбэки SanityPicture — причина: любая транзиентная ошибка CDN роняла в нетрансформированный оригинал навсегда; теперь ступенчатая деградация webp → jpg-трансформ (та же w/q) → raw
- [x] `fix` переадресация сбрасывает язык на англ — виновники: featured/mini-карточки блога на главной (сырые navigateTo без localePath) и redirect error-страницы на '/'
- [ ] `dx` причесать кодовую базу — артефакты, баги, утечки, небезопасные/ненадёжные места, строго оформить под TSDoc/SOLID
- [ ] `content` локали, полный проход — снять пафос, выровнять тон
- [ ] `docs` обновить README и политики под актуалочку
- [ ] `docs` убрать претенциозные метафоры из README и код-комментов («editorial minimalism — the browser is a newspaper, not a window manager» и т.п.) — дизайн не уникален и не делает такого заявления; протаскивать «между строк» посыл про природу сайтов как лейтмотив = натужно. Описывать что сделано, а не манифестировать
- [ ] `analytics` кастомные события Umami — lang-switch, section-view, scroll-depth, cta-click, copy-email, work-open/depth/completed/link, post-read/completed, reference-click, comment-start, contact-start, outbound-click
- [ ] `analytics` алгоритм релевантности блога — score = log(views+1)×w₁ + completions×w₂ + votes×w₃ + comments×w₄ + boost×freshness_decay; Nitro-утилита fetchUmamiEvents с кешем ~1ч; UMAMI_API_URL + UMAMI_API_KEY в env
- [x] `a11y` alt-атрибуты обложек из Sanity — пайплайн был уже прошит (схема+GROQ+рендеры с фоллбэком на title); добавлены warning-валидации в Studio; ЗАПОЛНИТЬ сами alt-тексты в CMS

## Considering

- [ ] `perf` динамические OG images — Satori/nuxt-og-image, брендированный шаблон per-post/per-case
- [ ] `feat` beta-banner — флаг inDevelopment в siteSettings (Sanity) + первый визит, появляется через 15-30с, автоскрытие, крестик, localStorage чтобы не показывать снова
- [x] `feat` RSS feed — /rss.xml (EN) + /ru/rss.xml через Nitro routes, сделано в рамках SEO-эпика
- [x] `feat` навигация пред/след пост — в шапке writing/[slug] рядом с back-link (не в конце), сделано в рамках SEO-эпика
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

- [x] `feat` TOC для длинных постов — десктоп sidebar, планшет/мобайл dropdown в nav, intro/источники/комментарии в оглавлении
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
