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
      name: 'description',
      title: 'Description',
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
    }),
    defineField({
      name: 'url',
      title: 'Project URL',
      type: 'url',
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
