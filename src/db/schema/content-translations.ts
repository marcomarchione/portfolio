/**
 * Content Translations Table Schema
 *
 * Stores multilingual content for each content_base record.
 * Supports 4 languages: Italian, English, Spanish, German.
 */
import { sqliteTable, text, integer, index, unique } from 'drizzle-orm/sqlite-core';
import { contentBase } from './content-base';

/** Supported languages for translations */
export const LANGUAGES = ['it', 'en', 'es', 'de'] as const;
export type Language = (typeof LANGUAGES)[number];

/**
 * Content Translations Table
 *
 * Stores translated content for each language per content item.
 * One translation per language is allowed per content_base record.
 */
export const contentTranslations = sqliteTable(
  'content_translations',
  {
    /** Auto-incrementing primary key */
    id: integer('id').primaryKey({ autoIncrement: true }),

    /** Foreign key to content_base with CASCADE DELETE */
    contentId: integer('content_id')
      .notNull()
      .references(() => contentBase.id, { onDelete: 'cascade' }),

    /** Language code with CHECK constraint */
    lang: text('lang', { enum: LANGUAGES }).notNull(),

    /** Translated title (required) */
    title: text('title').notNull(),

    /** Short description for listings */
    description: text('description'),

    /** Full body content in Markdown */
    body: text('body'),

    /** SEO meta title */
    metaTitle: text('meta_title'),

    /** SEO meta description */
    metaDescription: text('meta_description'),
  },
  (table) => [
    // Composite unique constraint: one translation per language per content
    unique('uq_content_lang').on(table.contentId, table.lang),
    index('idx_translations_content_id').on(table.contentId),
    index('idx_translations_lang').on(table.lang),
    index('idx_translations_content_lang').on(table.contentId, table.lang),
  ]
);

/** Type for selecting from content_translations table */
export type ContentTranslation = typeof contentTranslations.$inferSelect;

/** Type for inserting into content_translations table */
export type NewContentTranslation = typeof contentTranslations.$inferInsert;
