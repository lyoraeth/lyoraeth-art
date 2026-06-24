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
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' }),
  },
})
