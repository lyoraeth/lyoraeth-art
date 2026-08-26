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
      name: 'topic',
      title: 'Topic (card label)',
      type: 'object',
      description: 'One word above the title on a card. One per post, unlike tags.',
      fields: [
        { name: 'en', title: 'English', type: 'string', validation: (rule: any) => rule.max(24) },
        { name: 'ru', title: 'Russian', type: 'string', validation: (rule: any) => rule.max(24) },
      ],
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt (card)',
      type: 'object',
      description: 'Written for the card, not lifted from the opening. Falls back to the start of the body when empty.',
      fields: [
        { name: 'en', title: 'English', type: 'text', rows: 3, validation: (rule: any) => rule.max(240).warning('Over 240 characters the card grows past its design height') },
        { name: 'ru', title: 'Russian', type: 'text', rows: 3, validation: (rule: any) => rule.max(240).warning('Over 240 characters the card grows past its design height') },
      ],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Search and filtering in the blog — separate from the topic label.',
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'cover',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      fields: [
        {
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describes the cover for screen readers and search engines',
          validation: (rule: any) => rule.required().warning('Add alt text — the site falls back to the post title otherwise'),
        },
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
