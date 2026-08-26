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
      name: 'teaser',
      title: 'Teaser (card at rest)',
      type: 'object',
      description: 'One line under the title on a resting card. Hard limit — longer text breaks the card.',
      fields: [
        { name: 'en', title: 'English', type: 'string', validation: (rule: any) => rule.max(60) },
        { name: 'ru', title: 'Russian', type: 'string', validation: (rule: any) => rule.max(60) },
      ],
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt (card on hover, work listing)',
      type: 'object',
      description: 'Replaces the teaser when the card is hovered, and carries the work listing. 2–3 sentences.',
      fields: [
        { name: 'en', title: 'English', type: 'text', rows: 3, validation: (rule: any) => rule.max(240).warning('Over 240 characters the card grows past its design height') },
        { name: 'ru', title: 'Russian', type: 'text', rows: 3, validation: (rule: any) => rule.max(240).warning('Over 240 characters the card grows past its design height') },
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body (case page)',
      type: 'object',
      description: 'Full text of the case. Blank lines separate paragraphs.',
      fields: [
        { name: 'en', title: 'English', type: 'text', rows: 12 },
        { name: 'ru', title: 'Russian', type: 'text', rows: 12 },
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
      name: 'cover',
      title: 'Viewport cover image',
      type: 'image',
      description: 'Screenshot shown in the card viewport',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describes the screenshot for screen readers and search engines',
          validation: (rule: any) => rule.required().warning('Add alt text — the site falls back to the project title otherwise'),
        },
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
    select: { title: 'title.en', subtitle: 'teaser.en', media: 'cover' },
  },
})
