# Roadmap

> Personal working notes — written in Russian for speed.

Labels: `fix` `feat` `design` `content` `sec` `perf` `infra` `analytics` `a11y` `dx` `seo` `legal` `docs` `ux` `chore` `refactor`

Сюда же складываются мелочи, не связанные с текущим редизайном — письма из GSC и
Вебмастера, хвосты по локалям, инфраструктурные задачи. Формат записи: что не так →
чем подтверждено (curl, лог, письмо с датой) → что сделать. Гипотезы помечать словом
«проверить», чтобы потом не спутать их с установленным фактом.

---

## Todo

> половина новых правок инициированы уже... третим по счету редизайном, получается? я наконец-то не поленился и закопался в фигме на недельку другую чтобы что-то удобоваримое сделать, но это затронуло весь сайт радикально. А значит появился повод поправить наболевшее на проде

**ВАЖНОЕ**
- [?] поправить прокрутку. Это может быть вызвано как lenis, так и чем бы то ни было еще, но на xiaomi телефонах, на тачпадах асусов и еще неизвестном ряде устройств прокрутка не работает вообще. От футера выпадашки мы избавляемся, поэтому в принципе можно найти более щадящие способы прокрутки.
  СДЕЛАНО: Lenis снесён целиком (плагин, зависимость, hold-логика куртины) — между вводом и прокруткой больше нет JS. Прежние костыли (off на pointer:coarse, детект тачпада по wheel-сигнатуре) были эвристикой поверх эвристики и на Xiaomi не помогали.
- [] логика картинок - раньше они грузились из sanity напрямую с опр. ограничениями (см. историю), теперь есть четкие правила для ручного пережатия png исходников в jxl -> avif -> webp -> jpg. Основа - размер картинки в браузере в трех разрешениях: x3, x2, x1. Надо подумать как это вообще подкрутить чтобы не возиться лишний раз - например грузить в sanity исходник, но отдавать собственному серверу. Причину такой мудрености см. в моке, лень второй раз описывать - потому что ну а почему бы и нет модно красиво молодежно и что вы мне сделаете это мой сайт. Санити с jxl не работает вообще, с а avif - вроде работает, но нестабильно - выгоды от этого решения не будет никакой, головной боли будет очень много чтобы сместить медиа с cdn, но всегда хотел потыкать jxl в проде, так что делаем. PS: хочу оправдать свою любовь к jxl перед потомками и теми немногочисленными беднягами, кто реально будет читать эту родмапу - Я как-то искал себе толи джинсы, толи что-то еще, штаны в общем, на зарубежке - через сдек заказать, напался в рекомендациях на один сайт, смотрю - изображения аномально четкие и постепенно детализируются так классно. Открыл инспектором - а это jxl с прогрессивкой. Начал о нем читать и вот влюбився, теперь только ждать пока везде завезут. И пофег мне что avif весит даже меньше.
- [] SEO и локализация. Об этом уже написано ниже, но проблема шире - где-то кривые description в индексации, где-то локали путаются
- [] статьи пишутся из маркдауна - у нас не завезена нормальная отрисовка таблиц. Надо сделать.
- [] дотянуться до деталей которые динамически генерируются и проверить - список страниц, роботы, MCP файлы и скрипты
- [] !important в моке пока НЕ определены анимации, они заглушки. Все анимации - отдельный разбор, надо будет по моей же статье глянуть и трайнуть сделать.
- [] !important в моке все цвета приведены как hex, по факту та же oklck палитра for sure.
- [] не забыть о страницах ошибок и OG'картинках

**Хвосты редизайна (UI-баги):**
- [x] `fix` высота хэдера — причина: на постах в #nav-toc-slot садится TOC-кнопка (2.25rem) и задаёт высоту, на других страницах слот пуст; фикс — min-height: 4.5rem на .nav-inner (кнопка + вертикальный padding), высота одинакова везде
- [x] `fix` прыжок «как я работаю» — причина: backdrop-filter ячеек + SVG-caustic ломаются, пока предок в transform (reveal translateY/scale), и резко перерисовываются на transform:none; фикс — reveal этой секции только по opacity (transform: none)

**Этап 6 — финальная уборка:**
- [x] `dx` причесать кодовую базу — воркфлоу: багхант (14 находок, 10 подтверждено адверсариально) → фиксы → SOLID-декомпозиция god-компонентов (writing/[slug] 867 строк → useMarkdown/useToc/useArticleSeo/useReadingProgressBar; work/[slug] → useArticleSeo/useCaseStudyFunnel) → TSDoc. Финал: typecheck+tests+build+смоук зелёные, 0 регрессий
- [x] `sec` !! **Turnstile bypass** в contact.post + comment.post (`if(!valid)` где valid=объект {success}, всегда truthy → капча не работала вовсе); **HTML-инъекция в письма** (comment nick/message + csp-report — неэкранированный ввод рядом с live approve-ссылкой → escapeHtml util); **mcp/send.post открытый email-релей** без Turnstile/rate-limit; **утечка listeners** в writing/[slug] (onUnmounted после await не регался → scroll-листенеры + reading-progress state текли между постами)
- [x] `content` локали, полный проход — тон уже выровнен быстрым проходом; полный нашёл одну кальку («Со всеми углами» → «Ничего не срезаю»), остальное в норме
- [x] `docs` README + политики под актуалочку — README: Lenis desktop-only/touch-off; политики privacy EN/RU: Umami теперь учитывает и события взаимодействия (не только просмотры), дата → июль 2026; personal-data не тронут (аналитики не касается)
- [x] `docs` убрать претенциозные метафоры — README (newspaper/window manager/page-of-print/paper), код-комменты (Hero «browser is a newspaper», Stage «scenography/софит/dark paper», error, Approach «whisper», useToc «sail»)
- [ ] `docs` переснять скриншоты в readme/ — устарели после редизайна (РУЧНОЕ — нужен браузер)

**Индексация и канонизация (по отчёту GSC, разобрано 18.08.2026):**

Всё проверено curl'ом против прода, статусы разнесены на «чинить» и «так и должно быть».

- [ ] `infra` **РУЧНОЕ НА VPS — www не редиректится, корень двух пунктов отчёта.** `https://www.lyoraeth.art/` отдаёт 200 и полноценный HTML (canonical при этом честно указывает на apex), `https://www.lyoraeth.art/rss.xml` — тоже 200. Отсюда «Вариант страницы с тегом canonical» для www-главной и www-фиды в «просканировано, но не проиндексировано». Фикс — 301 `www.lyoraeth.art/*` → `lyoraeth.art/*` на nginx (http+www и http уже редиректятся, дырка только в https+www). Сниппет готов, применить руками на VPS — см. чат от 07.09.2026
- [x] `seo` **фиды считаются дублями друг друга.** `/ru/rss.xml` попал в «Страница является копией, канонический вариант не выбран» — у XML-фида и не может быть `rel=canonical`, а Google сравнил его с `/rss.xml`. Содержимое реально разное (EN «writing» / RU «блог»), то есть срабатывание ложное. Фикс — `X-Robots-Tag: noindex` на `/rss.xml` и `/ru/rss.xml`, `routeRules` в `nuxt.config.ts`
- [ ] `infra` **РУЧНОЕ НА VPS — `/ru/` и `/ru` обе отдают 200**, редиректа между ними нет, canonical у обеих на `/ru`. Не ошибка (Google выбор уважает), но краулинговый бюджет тратится. Фикс — 301 со слеш-версии на nginx, НЕ через Nuxt `routeRules` (проверено 07.09.2026: Nitro/rou3 нормализует слеш при матчинге routeRules-ключей, `/ru/` и `/ru` считаются одним и тем же паттерном — правило `'/ru/': redirect('/ru')` цепляет и голый `/ru` тоже и уходит в бесконечный редирект-луп). Сниппет готов вместе с www-фиксом выше
- [x] `seo` `/personal-data` → 301 на `/privacy` — работает как задумано, в sitemap старого URL нет (проверено). В отчёте это «Страница с переадресацией», действий не требует. Туда же http→https и http+www→https
- [ ] `seo` **«Просканирована, но пока не проиндексирована» на трёх постах блога** (`/ru/writing/worked-in-test-wrong-question`, `/ru/writing/your-website-is-already-saying-something`, `/writing/why-your-website-breaks-on-phones`) — технической причины нет: 200, canonical и hreflang на месте, в sitemap присутствуют. Это решение Google по молодому домену с малым числом внешних сигналов. Что реально влияет: внутренние ссылки на эти посты с индексируемых страниц, внешние упоминания, время. Точечно — Request Indexing в GSC. Проверить повторно через месяц, до тех пор не дёргаться
- [ ] `seo` URL с трекинг-параметрами (`?ysclid=` от Яндекса, `?utm_*`) — canonical корректный, статус информационный. Опционально: 301 со стрипом известных параметров
- [ ] `seo` после фиксов — Validate Fix в GSC по каждому статусу, иначе отчёт обновится сам через недели

**Отложено (нужны внешние условия):**
- [ ] `infra` **РУЧНОЕ НА VPS — шрифты редизайна.** Лицензионные woff2 (PP Neue Montreal Medium, PP Pangram Sans Semibold) в репозиторий не коммитятся (`/public/fonts/` в .gitignore), значит в Docker-образ они не попадают. Нужен location `/fonts/` в nginx, отдающий их из папки на сервере мимо Nuxt, плюс сама папка с файлами. Без этого на проде отвалится вся типографика новой главной (фолбэк — системный sans). Кеш — как у прочей статики, immutable. Вызвано тем что, чуя я, pangram pangram меня по головке не погладят если увидят в публичном репо исходники их шрифтов :)
- [x] `sec` nginx rate-limit для POST /api/mcp/send — добавлен location-блок (limit_req zone=lyoraeth_api burst=5 nodelay), как у contact/comment. Закрыто
- [ ] `analytics` **ЧАСТЬ 2 (после накопления трафика)** алгоритм релевантности блога — score = log(views+1)×w₁ + completions×w₂ + votes×w₃ + comments×w₄ + boost×freshness_decay; Nitro-утилита fetchUmamiEvents с кешем ~1ч; UMAMI_API_URL + UMAMI_API_KEY в env; читает post-read/post-completed (из части 1) через Umami API, votes/comments из Sanity; заменяет ручной popularity в сортировке «Популярное». ПРЕДУСЛОВИЕ: создать read-only API key в Umami; данные оживут через недели трафика
- [ ] `seo` РУЧНОЕ ПОСЛЕ ДЕПЛОЯ — GSC + Яндекс.Вебмастер + Bing: скормить sitemap, request indexing ключевых страниц; заполнить alt-тексты обложек в Sanity CMS

## Considering

- [x] RSS-точка в колофон куртины — строка «Feed/Фид» → ссылка RSS с тултипом, ведёт на локале-версию фида (/rss.xml EN, /ru/rss.xml RU), ember-hover как у прочих ссылок
- [x] `perf` динамические OG images — satori+resvg Nitro-роут /og/[type]/[slug] генерит брендированную 1200×630 (плоский тёмный фон, схематичная рамка с угловыми crop-марками в стиле FPO-плейсхолдеров, логотип+рубрика, заголовок, ember-полоса+дата), билингва через ?l. Только как og:image в link-preview (useArticleSeo: есть обложка → Sanity-трансформ, нет → генерация). Логотип вместо текстового wordmark (server/utils/ogLogo.ts, transparent PNG base64). Шрифты — static Onest lat+cyr + JBMono base64 в server/utils/ogFonts.ts (satori не парсит variable, storage ненадёжен между пресетами). ВИДИМЫЕ обложки блога генерацию НЕ используют — пробовал (?cover-вариант с тегами), но вплотную к тексту заголовок/дата/теги всегда дублируются → откат к Sanity-картинка → FPO-плейсхолдер (главная), на странице поста без обложки — ничего. Посты + работы
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

**Hardening (июльский заход):**
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
