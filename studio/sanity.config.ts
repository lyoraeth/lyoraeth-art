import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemaTypes'

const singletons = new Set(['siteStatus', 'siteSettings'])

export default defineConfig({
  name:    'lyoraeth-art',
  title:   'lyoraeth.art',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset:   process.env.SANITY_STUDIO_DATASET ?? 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem().title('Work').schemaType('work').child(S.documentTypeList('work')),
            S.listItem().title('Posts').schemaType('post').child(S.documentTypeList('post')),
            S.listItem().title('Comments').schemaType('comment').child(S.documentTypeList('comment')),
            S.divider(),
            S.listItem().title('Site Status').id('siteStatus')
              .child(S.document().schemaType('siteStatus').documentId('siteStatus')),
            S.listItem().title('Site Settings').id('siteSettings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
          ]),
    }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
    templates: templates => templates.filter(t => !singletons.has(t.schemaType)),
  },
})
