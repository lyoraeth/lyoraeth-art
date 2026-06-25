import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'work',
  title: 'Work',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'object',
      fields: [
        { name: 'en', title: 'English', type: 'string' },
        { name: 'ru', title: 'Russian', type: 'string' },
      ],
    }),
    defineField({
      name: 'kicker',
      title: 'Kicker (eyebrow text)',
      type: 'object',
      fields: [
        { name: 'en', title: 'English', type: 'string' },
        { name: 'ru', title: 'Russian', type: 'string' },
      ],
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short description (cards)',
      type: 'object',
      description: 'Shown on homepage and work listing. 1–2 sentences.',
      fields: [
        { name: 'en', title: 'English', type: 'text', rows: 2 },
        { name: 'ru', title: 'Russian', type: 'text', rows: 2 },
      ],
    }),
    defineField({
      name: 'description',
      title: 'Full description (case page)',
      type: 'object',
      fields: [
        { name: 'en', title: 'English', type: 'text', rows: 3 },
        { name: 'ru', title: 'Russian', type: 'text', rows: 3 },
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Tech tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'tagWarm',
      title: 'Highlighted tag (amber)',
      type: 'string',
      description: 'Displayed in amber, e.g. "Design system" or "Prod"',
    }),
    defineField({
      name: 'cover',
      title: 'Viewport cover image',
      type: 'image',
      description: 'Screenshot shown in the mock browser frame',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alt text', type: 'string' },
      ],
    }),
    defineField({
      name: 'url',
      title: 'Project URL',
      type: 'url',
    }),
    defineField({
      name: 'showLink',
      title: 'Show link at the bottom of the page',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
      description: 'e.g. 2025',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL identifier — generate from title',
      options: { source: 'title.en', maxLength: 80 },
    }),
    defineField({
      name: 'order',
      title: 'Sort order',
      type: 'number',
      description: 'Lower = shown first',
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
    select: { title: 'title.en', subtitle: 'tagWarm', media: 'cover' },
  },
})
