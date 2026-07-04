import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'telegramHandle',
      title: 'Telegram handle',
      type: 'string',
      description: 'Without @, e.g. "lyoraeth"',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'githubHandle',
      title: 'GitHub handle',
      type: 'string',
      description: 'Without @, e.g. "lyoraeth"',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'cvEn',
      title: 'CV — English (PDF)',
      type: 'file',
      options: { accept: '.pdf' },
    }),
    defineField({
      name: 'cvRu',
      title: 'CV — Русский (PDF)',
      type: 'file',
      options: { accept: '.pdf' },
    }),
    defineField({
      name: 'heroPortrait',
      title: 'Hero portrait',
      type: 'image',
      description: 'Portrait shown in the site hero. Falls back to the bundled static photo when empty.',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Alt text', type: 'string' },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' }),
  },
})
