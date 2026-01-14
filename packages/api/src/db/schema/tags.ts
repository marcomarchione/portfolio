/**
 * Tags Table Schema
 *
 * Standalone lookup table for categorizing news articles.
 */
import { pgTable, text, serial, index } from 'drizzle-orm/pg-core';

/**
 * Tags Table
 *
 * Stores tag definitions for categorizing news articles.
 * Referenced by the news_tags junction table.
 */
export const tags = pgTable(
  'tags',
  {
    /** Auto-incrementing primary key */
    id: serial('id').primaryKey(),

    /** Tag display name */
    name: text('name').notNull(),

    /** URL-friendly unique identifier */
    slug: text('slug').notNull().unique(),
  },
  (table) => [index('idx_tags_slug').on(table.slug)]
);

/** Type for selecting from tags table */
export type Tag = typeof tags.$inferSelect;

/** Type for inserting into tags table */
export type NewTag = typeof tags.$inferInsert;
