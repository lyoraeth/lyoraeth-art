// Run: node seed.mjs
// Requires studio/.env with SANITY_STUDIO_PROJECT_ID + SANITY_STUDIO_DATASET

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))

// load .env manually (no dotenv dependency needed)
try {
  const env = readFileSync(resolve(__dir, '.env'), 'utf8')
  for (const line of env.split('\n')) {
    const [k, ...v] = line.split('=')
    if (k && v.length) process.env[k.trim()] = v.join('=').trim()
  }
} catch {}

const projectId = process.env.SANITY_STUDIO_PROJECT_ID
const dataset   = process.env.SANITY_STUDIO_DATASET ?? 'production'

if (!projectId) {
  console.error('❌  SANITY_STUDIO_PROJECT_ID not set in studio/.env')
  process.exit(1)
}

const client = createClient({ projectId, dataset, useCdn: false, apiVersion: '2024-01-01', token: process.env.SANITY_TOKEN })

// ── Work items ────────────────────────────────────────────────────────────────

const works = [
  {
    _type: 'work',
    order: 1,
    title:       { en: 'Design System',            ru: 'Дизайн-система' },
    kicker:      { en: 'Type: Component library',  ru: 'Тип: Компонентная библиотека' },
    description: {
      en: 'Рыба рыба рыба рыба рыба. Рыба рыба рыба рыба рыба рыба рыба рыба.',
      ru: 'Рыба рыба рыба рыба рыба. Рыба рыба рыба рыба рыба рыба рыба рыба.',
    },
    tags:    ['Figma', 'Tokens', 'React', 'Storybook'],
    tagWarm: 'Design system',
  },
  {
    _type: 'work',
    order: 2,
    title:       { en: 'Stories Player',       ru: 'Плеер историй' },
    kicker:      { en: 'Type: Mobile feature', ru: 'Тип: Мобильная фича' },
    description: {
      en: 'Рыба рыба рыба рыба рыба. Рыба рыба рыба рыба рыба рыба рыба рыба.',
      ru: 'Рыба рыба рыба рыба рыба. Рыба рыба рыба рыба рыба рыба рыба рыба.',
    },
    tags:    ['Vue 3', 'Canvas', 'GSAP'],
    tagWarm: 'Prod',
  },
  {
    _type: 'work',
    order: 3,
    title:       { en: 'Payment Funnel Bot',  ru: 'Бот платёжной воронки' },
    kicker:      { en: 'Type: Automation',    ru: 'Тип: Автоматизация' },
    description: {
      en: 'Рыба рыба рыба рыба рыба. Рыба рыба рыба рыба рыба рыба рыба рыба.',
      ru: 'Рыба рыба рыба рыба рыба. Рыба рыба рыба рыба рыба рыба рыба рыба.',
    },
    tags:    ['Node.js', 'Telegram Bot API', 'PostgreSQL'],
    tagWarm: 'Prod',
  },
  {
    _type: 'work',
    order: 4,
    title:       { en: 'Analytics Dashboard', ru: 'Аналитический дашборд' },
    kicker:      { en: 'Type: Internal tool', ru: 'Тип: Внутренний инструмент' },
    description: {
      en: 'Рыба рыба рыба рыба рыба. Рыба рыба рыба рыба рыба рыба рыба рыба.',
      ru: 'Рыба рыба рыба рыба рыба. Рыба рыба рыба рыба рыба рыба рыба рыба.',
    },
    tags:    ['Nuxt 3', 'Chart.js', 'Tailwind'],
    tagWarm: 'Internal',
  },
  {
    _type: 'work',
    order: 5,
    title:       { en: 'API Gateway',         ru: 'API-шлюз' },
    kicker:      { en: 'Type: Backend',       ru: 'Тип: Бэкенд' },
    description: {
      en: 'Рыба рыба рыба рыба рыба. Рыба рыба рыба рыба рыба рыба рыба рыба.',
      ru: 'Рыба рыба рыба рыба рыба. Рыба рыба рыба рыба рыба рыба рыба рыба.',
    },
    tags:    ['Fastify', 'Redis', 'Docker'],
    tagWarm: 'Prod',
  },
  {
    _type: 'work',
    order: 6,
    title:       { en: 'E-commerce Platform', ru: 'Платформа e-commerce' },
    kicker:      { en: 'Type: Full-stack',    ru: 'Тип: Full-stack' },
    description: {
      en: 'Рыба рыба рыба рыба рыба. Рыба рыба рыба рыба рыба рыба рыба рыба.',
      ru: 'Рыба рыба рыба рыба рыба. Рыба рыба рыба рыба рыба рыба рыба рыба.',
    },
    tags:    ['Next.js', 'Stripe', 'Prisma'],
    tagWarm: 'Prod',
  },
]

// ── Posts ─────────────────────────────────────────────────────────────────────

const posts = [
  {
    _type: 'post',
    slug: { _type: 'slug', current: 'dvh-fix' },
    publishedAt: '2026-03-25T10:00:00Z',
    readingTime: 5,
    tags: ['mobile', 'viewport', 'css'],
    title: {
      en: 'Why dvh is unreliable, and how I fixed it',
      ru: 'Почему dvh ненадёжен и как я это починил',
    },
  },
  {
    _type: 'post',
    slug: { _type: 'slug', current: 'design-system-no-build' },
    publishedAt: '2026-02-18T10:00:00Z',
    readingTime: 7,
    tags: ['css', 'architecture'],
    title: {
      en: 'A design system with no build step',
      ru: 'Дизайн-система без сборки',
    },
  },
  {
    _type: 'post',
    slug: { _type: 'slug', current: 'vue2-onboarding' },
    publishedAt: '2026-01-19T10:00:00Z',
    readingTime: 4,
    tags: ['vue', 'dx'],
    title: {
      en: 'Onboarding myself onto Vue 2 / Node 12 in three hours',
      ru: 'Онбординг на Vue 2 / Node 12 за три часа',
    },
  },
  {
    _type: 'post',
    slug: { _type: 'slug', current: 'css-specificity-tricks' },
    publishedAt: '2025-12-10T10:00:00Z',
    readingTime: 6,
    tags: ['css', 'specificity'],
    title: {
      en: 'CSS specificity tricks I keep forgetting',
      ru: 'Трюки специфичности CSS, которые я постоянно забываю',
    },
  },
  {
    _type: 'post',
    slug: { _type: 'slug', current: 'nuxt3-i18n' },
    publishedAt: '2025-11-05T10:00:00Z',
    readingTime: 8,
    tags: ['nuxt', 'i18n', 'vue'],
    title: {
      en: 'Nuxt 3 i18n setup that actually scales',
      ru: 'Настройка i18n в Nuxt 3, которая масштабируется',
    },
  },
  {
    _type: 'post',
    slug: { _type: 'slug', current: 'animation-performance' },
    publishedAt: '2025-10-01T10:00:00Z',
    readingTime: 9,
    tags: ['animation', 'performance', 'css'],
    title: {
      en: 'Animation performance: what GPU actually composites',
      ru: 'Производительность анимаций: что GPU реально композитит',
    },
  },
]

// ── Import ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`\n🌱  Seeding ${works.length} work items + ${posts.length} posts → ${projectId}/${dataset}\n`)

  for (const doc of works) {
    const result = await client.create(doc)
    console.log(`  ✓ work: ${doc.title.en} (${result._id})`)
  }

  for (const doc of posts) {
    const result = await client.create(doc)
    console.log(`  ✓ post: ${doc.title.en} (${result._id})`)
  }

  console.log('\n✅  Done\n')
}

seed().catch(err => {
  console.error('❌ ', err.message)
  process.exit(1)
})
