import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteStatus',
  title: 'Site Status',
  type: 'document',
  fields: [
    defineField({
      name: 'availability',
      title: 'Availability',
      type: 'string',
      options: {
        list: [
          { title: '🟢 Available',    value: 'available' },
          { title: '🟡 Part-time',    value: 'part_time' },
          { title: '🔴 Busy',         value: 'busy' },
          { title: '⚫ Unavailable',  value: 'unavailable' },
        ],
        layout: 'radio',
      },
      initialValue: 'available',
      validation: Rule => Rule.required(),
    }),
  ],
  preview: {
    select: { availability: 'availability' },
    prepare: ({ availability }: any) => ({
      title: 'Site Status',
      subtitle: availability ?? 'not set',
    }),
  },
})
