import { defineType, defineField } from 'sanity'
import { coverImage, localeString, localeText } from './locale'

/**
 * A blog post. The body stays two plain markdown fields rather than one
 * bilingual object: unlike a case study, a post is formatted text, and the
 * editor wants the whole document height for it.
 */
export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'body',    title: 'Body' },
    { name: 'media',   title: 'Media' },
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
      name: 'topic',
      title: 'Topic',
      description: 'Single label above the title on a card. One per post, unlike tags.',
      group: 'content',
      maxChars: 24,
    }),
    localeText({
      name: 'excerpt',
      title: 'Excerpt',
      description: 'Written for the card rather than lifted from the opening. Falls back to the start of the body when left empty.',
      group: 'content',
      maxChars: 240,
      soft: true,
    }),

    defineField({
      name: 'body',
      title: 'Body — English',
      type: 'text',
      rows: 30,
      group: 'body',
      description: 'Markdown: **bold**, *italic*, ## H2, ### H3, > quote, --- divider, ![alt](url "caption")',
    }),
    defineField({
      name: 'bodyRu',
      title: 'Body — Russian',
      type: 'text',
      rows: 30,
      group: 'body',
      description: 'Same markdown as the English body.',
    }),
    defineField({
      name: 'references',
      title: 'References',
      type: 'array',
      group: 'body',
      description: 'Numbered source list at the end of the post.',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Title', type: 'string', validation: rule => rule.required() },
            { name: 'href',  title: 'URL',   type: 'url',    validation: rule => rule.required() },
          ],
          preview: {
            select: { title: 'title', subtitle: 'href' },
          },
        },
      ],
    }),

    coverImage({
      title: 'Cover image',
      group: 'media',
      altHint: 'Add alt text — the site falls back to the post title otherwise',
    }),

    defineField({
      name: 'gallery',
      title: 'Body images',
      type: 'array',
      group: 'media',
      description: 'Reference in the body as ![alt](gallery:key){fit=cover pos=top ar=16/9}. The pipeline encodes each to jxl/avif/webp/jpg on the server.',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'key',
              title: 'Key',
              type: 'string',
              description: 'The name the body markdown references — lowercase, digits, hyphens.',
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
        return new Set(keys).size === keys.length || 'Keys must be unique within a post'
      }),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'meta',
      options: { source: 'title.en', maxLength: 96 },
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      group: 'meta',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'readingTime',
      title: 'Reading time (min)',
      type: 'number',
      group: 'meta',
      validation: rule => rule.positive().integer(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'meta',
      description: 'Search and filtering in the blog — separate from the topic label.',
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'popularity',
      title: 'Popularity',
      type: 'number',
      group: 'meta',
      description: 'Manual ranking for the "Popular" sort — higher comes first.',
      initialValue: 0,
      validation: rule => rule.min(0).max(100),
    }),
  ],
  orderings: [
    {
      title: 'Newest first',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title.en', subtitle: 'publishedAt', media: 'cover' },
    prepare: ({ title, subtitle, media }) => ({
      title,
      subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : 'No date',
      media,
    }),
  },
})
