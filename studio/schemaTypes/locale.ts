import { defineField } from 'sanity'
import type { FieldDefinition, Rule } from 'sanity'

/**
 * Bilingual fields, built as helpers rather than as their own Sanity types.
 *
 * @remarks
 * A named object type would stamp `_type` into every stored value; a helper
 * produces the same plain `{ en, ru }` the site already reads, and still keeps
 * the shape in one place.
 */

interface LocaleFieldOptions {
  name: string
  title: string
  description?: string
  group?: string
  /** Character budget the design allows. */
  maxChars?: number
  /** Warn instead of blocking — for limits the layout survives crossing. */
  soft?: boolean
  /** English is the source language: required where the field itself is. */
  requireEn?: boolean
  /** Height of the input in the Studio. */
  rows?: number
}

const limit = (rule: Rule, { maxChars, soft }: LocaleFieldOptions): Rule => {
  if (!maxChars) return rule
  return soft
    ? rule.max(maxChars).warning(`Over ${maxChars} characters the card grows past its design height`)
    : rule.max(maxChars)
}

/** One-line bilingual field. */
export function localeString(options: LocaleFieldOptions): FieldDefinition<'object'> {
  const { name, title, description, group, requireEn } = options
  return defineField({
    name,
    title,
    description,
    group,
    type: 'object',
    fields: [
      {
        name: 'en',
        title: 'English',
        type: 'string',
        validation: rule => {
          const limited = limit(rule, options)
          return requireEn ? limited.required() : limited
        },
      },
      { name: 'ru', title: 'Russian', type: 'string', validation: rule => limit(rule, options) },
    ],
  })
}

/** Multi-line bilingual field. */
export function localeText(options: LocaleFieldOptions): FieldDefinition<'object'> {
  const { name, title, description, group, requireEn, rows = 3 } = options
  return defineField({
    name,
    title,
    description,
    group,
    type: 'object',
    fields: [
      {
        name: 'en',
        title: 'English',
        type: 'text',
        rows,
        validation: rule => {
          const limited = limit(rule, options)
          return requireEn ? limited.required() : limited
        },
      },
      { name: 'ru', title: 'Russian', type: 'text', rows, validation: rule => limit(rule, options) },
    ],
  })
}

/** Cover image with the alt text the site falls back from. */
export function coverImage(options: { title: string; description?: string; group?: string; altHint: string }): FieldDefinition<'image'> {
  return defineField({
    name: 'cover',
    title: options.title,
    description: options.description,
    group: options.group,
    type: 'image',
    options: { hotspot: true },
    fields: [
      {
        name: 'alt',
        title: 'Alt text',
        type: 'string',
        description: 'Describes the image for screen readers and search engines',
        validation: rule => rule.required().warning(options.altHint),
      },
    ],
  })
}
