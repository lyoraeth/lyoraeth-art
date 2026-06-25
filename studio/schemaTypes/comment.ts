import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    defineField({ name: 'postSlug',    type: 'string',   title: 'Post slug' }),
    defineField({ name: 'nick',        type: 'string',   title: 'Nick' }),
    defineField({ name: 'message',     type: 'text',     title: 'Message' }),
    defineField({ name: 'publishedAt', type: 'datetime', title: 'Posted at' }),
    defineField({
      name: 'approved',
      type: 'boolean',
      title: 'Approved',
      description: 'Set to false to hide a comment',
      initialValue: true,
    }),
  ],
  orderings: [{
    title: 'Newest first',
    name:  'publishedAtDesc',
    by:    [{ field: 'publishedAt', direction: 'desc' }],
  }],
  preview: {
    select: { title: 'nick', subtitle: 'message' },
    prepare: ({ title, subtitle }: any) => ({ title, subtitle: subtitle?.slice(0, 60) }),
  },
})
