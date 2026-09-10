import { defineType, defineField } from 'sanity'
import { localeString } from './locale'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'notice',
      title: 'Maintenance notice',
      type: 'object',
      description: 'A slim strip above the header. Turn on during works on the live site.',
      fields: [
        { name: 'enabled', title: 'Show the notice', type: 'boolean', initialValue: false },
        localeString({ name: 'text', title: 'Text', maxChars: 80, soft: true }),
      ],
      options: { collapsible: true, collapsed: true },
    }),
    defineField({
      name: 'telegramHandle',
      title: 'Telegram handle',
      type: 'string',
      description: 'Without @, e.g. "lyoraeth"',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'githubHandle',
      title: 'GitHub handle',
      type: 'string',
      description: 'Without @, e.g. "lyoraeth"',
      validation: rule => rule.required(),
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
