# Roadmap

> Personal working notes — written in Russian for speed.

Labels: `fix` `feat` `design` `content` `sec` `perf` `infra` `analytics` `a11y` `dx`

---

## Todo

**Хвосты редизайна (UI-баги):**
- [ ] `fix` унифицировать высоту хэдера на телефоне. Эталон — страница поста ~72px. Странно что на главной он меньше
- [ ] `fix` раздел «как я работаю» на главной, возможно, отрисовывается в старом стиле и перерисовывается — есть прыжок дизайна, непонятно откуда

**Этап 6 — финальная уборка:**
- [x] `dx` причесать кодовую базу — воркфлоу: багхант (14 находок, 10 подтверждено адверсариально) → фиксы → SOLID-декомпозиция god-компонентов (writing/[slug] 867 строк → useMarkdown/useToc/useArticleSeo/useReadingProgressBar; work/[slug] → useArticleSeo/useCaseStudyFunnel) → TSDoc. Финал: typecheck+tests+build+смоук зелёные, 0 регрессий
- [x] `sec` !! найдено и исправлено воркфлоу (НЕ ЗАПУШЕНО — прод пока уязвим): **Turnstile bypass** в contact.post + comment.post (`if(!valid)` где valid=объект {success}, всегда truthy → капча не работала вовсе); **HTML-инъекция в письма** (comment nick/message + csp-report — неэкранированный ввод рядом с live approve-ссылкой → escapeHtml util); **mcp/send.post открытый email-релей** без Turnstile/rate-limit; **утечка listeners** в writing/[slug] (onUnmounted после await не регался → scroll-листенеры + reading-progress state текли между постами)
- [x] `content` локали, полный проход — тон уже выровнен быстрым проходом; полный нашёл одну кальку («Со всеми углами» → «Ничего не срезаю»), остальное в норме
- [x] `docs` README + политики под актуалочку — README: Lenis desktop-only/touch-off; политики privacy EN/RU: Umami теперь учитывает и события взаимодействия (не только просмотры), дата → июль 2026; personal-data не тронут (аналитики не касается)
- [x] `docs` убрать претенциозные метафоры — README (newspaper/window manager/page-of-print/paper), код-комменты (Hero «browser is a newspaper», Stage «scenography/софит/dark paper», error, Approach «whisper», useToc «sail»)
- [ ] `docs` переснять скриншоты в readme/ — устарели после редизайна (РУЧНОЕ — нужен браузер)

**Отложено (нужны внешние условия):**
- [ ] `sec` nginx rate-limit для POST /api/mcp/send — сейчас в limit_req_zone только /api/contact и /api/comment; у mcp/send капчи нет (WebMCP-мост), поэтому лимит на nginx-уровне особенно нужен (добавить в nginx-proxy-manager Advanced, как для contact/comment). В коде уже добавлен size-cap как первый барьер
- [ ] `analytics` **ЧАСТЬ 2 (после накопления трафика)** алгоритм релевантности блога — score = log(views+1)×w₁ + completions×w₂ + votes×w₃ + comments×w₄ + boost×freshness_decay; Nitro-утилита fetchUmamiEvents с кешем ~1ч; UMAMI_API_URL + UMAMI_API_KEY в env; читает post-read/post-completed (из части 1) через Umami API, votes/comments из Sanity; заменяет ручной popularity в сортировке «Популярное». ПРЕДУСЛОВИЕ: создать read-only API key в Umami; данные оживут через недели трафика
- [ ] `seo` РУЧНОЕ ПОСЛЕ ДЕПЛОЯ — GSC + Яндекс.Вебмастер + Bing: скормить sitemap, request indexing ключевых страниц; заполнить alt-тексты обложек в Sanity CMS

## Considering

- [ ] RSS-точка в колофон куртины — строка вроде «Feed» / ссылка «RSS» с тултипом-подсказкой (в стиле остальных строк колофона: Fonts / Built with / CMS / Analytics). Ведёт на локале-версию фида (/rss.xml для EN, /ru/rss.xml для RU). Discovery-линки в head уже есть — это просто зримая человеческая точка.
- [ ] `perf` динамические OG images — Satori/nuxt-og-image, брендированный шаблон per-post/per-case
- [ ] `feat` beta-banner — флаг inDevelopment в siteSettings (Sanity) + первый визит, появляется через 15-30с, автоскрытие, крестик, localStorage чтобы не показывать снова
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

## Done — редизайн + hardening (июль 2026)

**Редизайн (exp/redesign-v2, замержено):**
- [x] `design` уход от glassmorphism — плоские карточки с masked-обводкой и курсор-glow, единая геометрия колец, чётная шкала радиусов; фон-сцена статична (temperature shading вместо анимированных блобов)
- [x] `feat` хиро — editorial-двухколонка с портретом-figure (passe-partout, подпись), CMS-driven из Sanity siteSettings + статичный фоллбэк
- [x] `design` плейсхолдеры — FPO-система (кроп-марки, обрез, диагонали) вместо косплея ОС; исходники в lyoaeth-brand/placeholders
- [x] `design` ApproachSection — стекло подзагашено (не убрано)
- [x] `dx` убраны артефакты редизайна — мёртвые .card-glare, неиспользуемые токены, .form-privacy; тесты useGlowCard переписаны
- [x] `content`+`docs` быстрый проход локалей (слоган→«результат», RU на «вы») и README (editorial minimalism)
- [x] `refactor` WorkCompactCard/PostRow вынесены с рабочим edge-glow; сайдбар блога → frosted-панель

**Hardening (этот заход, ещё НЕ запушено — 6+ локальных коммитов):**
- [x] `chore` dependabot — studio sanity 3.68→6.3 (убиты 4 high), esbuild low принят как dev-only
- [x] `fix` скролл-стек — lenis off на touch (pointer:coarse) + детект тачпадов по wheel-сигнатуре; футер-куртина статична на touch; TOC clamp у конца статьи (fixed, НЕ sticky). ПРОВЕРИТЬ XIAOMI 15T после деплоя
- [x] `seo` мега-эпик — description-экскерпты, трансформ og:image+dims/alt, hreflang/canonical/og:locale (useLocaleHead), sitemap xhtml+lastmod, JSON-LD (BlogPosting/BreadcrumbList/CreativeWork/Blog/CollectionPage), RSS EN+RU, prev/next, noindex error, fetchpriority LCP, локализованные крошки. Смоук против собранного сервера пройден
- [x] `fix` SanityPicture — ступенчатая деградация webp→jpg-трансформ→raw (вместо падения в raw навсегда); alt-warnings в схемах
- [x] `fix` i18n-редирект — сырые navigateTo без localePath (карточки блога на главной) + error-redirect на EN
- [x] `analytics` ЧАСТЬ 1 — useTrack + EV + плагин (scroll-depth/outbound) + точечные события (lang-switch, section-view, cta/contact, work-воронка, post read/completed/reference, comment-start)

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
