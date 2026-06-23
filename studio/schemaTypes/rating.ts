import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'rating',
  title: 'Rating',
  type: 'document',
  fields: [
    defineField({ name: 'slug', type: 'string', title: 'Post slug', readOnly: true }),
    defineField({ name: 'up',   type: 'number', title: 'Upvotes',   readOnly: true, initialValue: 0 }),
    defineField({ name: 'down', type: 'number', title: 'Downvotes', readOnly: true, initialValue: 0 }),
  ],
  preview: {
    select: { title: 'slug', up: 'up', down: 'down' },
    prepare: ({ title, up, down }: any) => ({
      title,
      subtitle: `+${up ?? 0} / -${down ?? 0}`,
    }),
  },
})
