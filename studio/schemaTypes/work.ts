import { defineType, defineField } from 'sanity'
import { coverImage, localeString, localeText } from './locale'

/**
 * A case study. Three text lengths, each with its own place in the design:
 * the teaser on a resting card, the excerpt on hover and in the listing, and
 * the body on the case page.
 */
export default defineType({
  name: 'work',
  title: 'Work',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
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
      name: 'teaser',
      title: 'Teaser',
      description: 'Sits under the title while the card rests, and gives way to the excerpt on hover.',
      group: 'content',
      maxChars: 80,
      soft: true,
      hint: 'Past 80 characters the teaser stops hinting and starts competing with the hovered state',
    }),
    localeText({
      name: 'excerpt',
      title: 'Excerpt',
      description: 'Replaces the teaser on hover, and carries the work listing. Two or three sentences.',
      group: 'content',
      maxChars: 240,
      soft: true,
    }),
    localeText({
      name: 'body',
      title: 'Body',
      description: 'Full text of the case page. Blank lines separate paragraphs.',
      group: 'content',
      rows: 12,
    }),

    coverImage({
      title: 'Cover image',
      description: 'Screenshot shown on the case page.',
      group: 'media',
      altHint: 'Add alt text — the site falls back to the project title otherwise',
    }),

    defineField({
      name: 'tags',
      title: 'Tech tags',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'meta',
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      description: 'Shown on the card, e.g. 2026',
      group: 'meta',
    }),
    defineField({
      name: 'url',
      title: 'Project URL',
      type: 'url',
      group: 'meta',
    }),
    defineField({
      name: 'showLink',
      title: 'Show the link at the bottom of the case page',
      type: 'boolean',
      initialValue: false,
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
