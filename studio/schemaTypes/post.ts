import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'post',
  title: 'Post',
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
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title.en', maxLength: 96 },
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    }),
    defineField({
      name: 'readingTime',
      title: 'Reading time (min)',
      type: 'number',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'cover',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alt text', type: 'string' },
      ],
    }),
    defineField({
      name: 'popularity',
      title: 'Popularity (0–100)',
      type: 'number',
      description: 'Manual ranking for "Popular" sort — higher = shown first',
      initialValue: 0,
    }),
    defineField({
      name: 'references',
      title: 'References',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Title', type: 'string' },
            { name: 'href',  title: 'URL',   type: 'url' },
          ],
          preview: {
            select: { title: 'title', subtitle: 'href' },
          },
        },
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body (English)',
      type: 'text',
      rows: 30,
      description: 'Markdown: **bold**, *italic*, ## H2, ### H3, > quote, --- divider, ![alt](url "caption")',
    }),
    defineField({
      name: 'bodyRu',
      title: 'Body (Russian)',
      type: 'text',
      rows: 30,
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
    prepare({ title, subtitle, media }: any) {
      return {
        title,
        subtitle: subtitle ? new Date(subtitle).toLocaleDateString() : 'No date',
        media,
      }
    },
  },
})
