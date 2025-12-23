/**
 * News Extension Table Schema
 *
 * Type-specific extension for news articles.
 * One-to-one relationship with content_base.
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { contentBase } from './content-base';

/**
 * News Table
 *
 * Stores news-specific fields extending content_base.
 * Each news article must have exactly one corresponding content_base record.
 */
export const news = sqliteTable('news', {
  /** Auto-incrementing primary key */
  id: integer('id').primaryKey({ autoIncrement: true }),

  /** Foreign key to content_base with UNIQUE constraint for 1:1 relationship */
  contentId: integer('content_id')
    .notNull()
    .unique()
    .references(() => contentBase.id, { onDelete: 'cascade' }),

  /** Cover image path or R2 key */
  coverImage: text('cover_image'),

  /** Estimated reading time in minutes */
  readingTime: integer('reading_time'),
});

/** Type for selecting from news table */
export type News = typeof news.$inferSelect;

/** Type for inserting into news table */
export type NewNews = typeof news.$inferInsert;
