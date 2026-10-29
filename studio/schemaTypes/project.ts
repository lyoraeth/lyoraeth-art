import { defineType, defineField } from 'sanity'
import { coverImage, localeString, localeText } from './locale'

/** Docs are rendered straight from the repo through `v-html`, so the repo has
 *  to be one of ours — the same allowlist the server enforces. */
const REPO_URL_RE = /^https:\/\/github\.com\/lyoraeth\/[\w.-]+\/?$/

/**
 * One of the author's own open-source tools. Unlike a `work` case study (a
 * narrative for a client), a project is a landing page for a thing people can
 * use: what it is, a few screenshots, where the code lives, and — when the
 * repo carries a `docs/` folder — a docs section mirrored onto the site.
 */
export default defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'media',   title: 'Media' },
    { name: 'links',   title: 'Links & docs' },
    { name: 'meta',    title: 'Meta' },
  ],
  fields: [
    localeString({
      name: 'title',
      title: 'Title',
      group: 'content',
      requireEn: true,
    }),
    localeString({
      name: 'teaser',
      title: 'Tagline',
      description: 'One line under the title — what the project is, in a breath.',
      group: 'content',
      maxChars: 80,
      soft: true,
      hint: 'Past 80 characters the tagline stops being a tagline',
    }),
    localeText({
      name: 'excerpt',
      title: 'Excerpt',
      description: 'The short pitch beside the screenshot in the listing. Two or three sentences.',
      group: 'content',
      maxChars: 240,
      soft: true,
    }),
    localeText({
      name: 'body',
      title: 'Overview',
      description: 'The landing page body, in Markdown. Screenshots from "Body images" go in as ![alt](gallery:key).',
      group: 'content',
      rows: 16,
    }),

    defineField({
      name: 'logo',
      title: 'Logo',
      description: "The project's mark (SVG or PNG, square). Shown next to the name in the listing, on the landing page and in the docs. Served as is, not through the media pipeline.",
      type: 'image',
      group: 'media',
      options: { accept: 'image/svg+xml,image/png' },
    }),
    coverImage({
      title: 'Cover image',
      description: 'The screenshot shown beside the project in the listing and on the landing page.',
      group: 'media',
      altHint: 'Add alt text — the site falls back to the project title otherwise',
    }),
    defineField({
      name: 'gallery',
      title: 'Body images',
      type: 'array',
      group: 'media',
      description: 'Reference in the overview as ![alt](gallery:key){fit=cover pos=top ar=16/9}. The pipeline encodes each to jxl/avif/webp/jpg on the server.',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'key',
              title: 'Key',
              type: 'string',
              description: 'The name the overview markdown references — lowercase, digits, hyphens.',
              validation: rule => rule.required().regex(/^[a-z0-9-]+$/, { name: 'lowercase, digits and hyphens only' }),
            },
            {
              name: 'image',
              title: 'Image',
              type: 'image',
              validation: rule => rule.required(),
            },
            {
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              validation: rule => rule.required().warning('Describes the image for screen readers and search engines'),
            },
          ],
          preview: { select: { title: 'key', subtitle: 'alt', media: 'image' } },
        },
      ],
      validation: rule => rule.unique().custom((items?: { key?: string }[]) => {
        const keys = (items ?? []).map(i => i.key).filter(Boolean)
        return new Set(keys).size === keys.length || 'Keys must be unique within a project'
      }),
    }),

    defineField({
      name: 'repoUrl',
      title: 'Repository',
      type: 'url',
      group: 'links',
      description: 'https://github.com/lyoraeth/<repo> — the docs are fetched from here, so only repos under lyoraeth are accepted.',
      validation: rule => rule.required().custom((url?: string) =>
        !url || REPO_URL_RE.test(url) || 'Must be a github.com/lyoraeth/<repo> URL'),
    }),
    defineField({
      name: 'demoUrl',
      title: 'Demo / website',
      type: 'url',
      group: 'links',
    }),
    defineField({
      name: 'hasDocs',
      title: 'Show the docs section',
      type: 'boolean',
      initialValue: false,
      group: 'links',
      description: 'Mirrors the repo\'s docs folder onto the site. Needs docs/SUMMARY.md (mdBook format) in the repo.',
    }),
    defineField({
      name: 'docsPath',
      title: 'Docs folder in the repo',
      type: 'string',
      initialValue: 'docs',
      group: 'links',
      hidden: ({ document }) => !document?.hasDocs,
      validation: rule => rule.regex(/^[\w-]+(\/[\w-]+)*$/, { name: 'a relative folder path, e.g. docs' }),
    }),

    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'meta',
      initialValue: 'active',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Maintained', value: 'maintained' },
          { title: 'Archived', value: 'archived' },
        ],
        layout: 'radio',
      },
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tech stack',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'meta',
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      description: 'Shown next to the status, e.g. 2026',
      group: 'meta',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL identifier — generate it from the title',
      group: 'meta',
      options: { source: 'title.en', maxLength: 80 },
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      description: 'Lower comes first',
      group: 'meta',
    }),
  ],
  orderings: [
    {
      title: 'Sort order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'title.en', subtitle: 'teaser.en', media: 'cover' },
  },
})
