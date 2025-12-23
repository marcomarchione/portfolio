/**
 * Content Base Table Schema
 *
 * Primary table for all content types with shared metadata fields.
 * Supports three content types: project, material, and news.
 */
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/** Valid content types for the CMS */
export const CONTENT_TYPES = ['project', 'material', 'news'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

/** Valid content statuses */
export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/**
 * Content Base Table
 *
 * Stores shared metadata for all content types (projects, materials, news).
 * Type-specific data is stored in extension tables with 1:1 relationships.
 */
export const contentBase = sqliteTable(
  'content_base',
  {
    /** Auto-incrementing primary key */
    id: integer('id').primaryKey({ autoIncrement: true }),

    /** Content type discriminator with CHECK constraint */
    type: text('type', { enum: CONTENT_TYPES }).notNull(),

    /** URL-friendly unique identifier */
    slug: text('slug').notNull().unique(),

    /** Publication status with CHECK constraint */
    status: text('status', { enum: CONTENT_STATUSES }).notNull().default('draft'),

    /** Whether this content is featured on the homepage */
    featured: integer('featured', { mode: 'boolean' }).notNull().default(false),

    /** Unix timestamp of creation */
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),

    /** Unix timestamp of last update */
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .notNull()
      .$defaultFn(() => new Date()),

    /** Unix timestamp of publication (null if never published) */
    publishedAt: integer('published_at', { mode: 'timestamp_ms' }),
  },
  (table) => [
    index('idx_content_base_type').on(table.type),
    index('idx_content_base_slug').on(table.slug),
    index('idx_content_base_status').on(table.status),
    index('idx_content_base_featured').on(table.featured),
    index('idx_content_base_published_at').on(table.publishedAt),
  ]
);

/** Type for selecting from content_base table */
export type ContentBase = typeof contentBase.$inferSelect;

/** Type for inserting into content_base table */
export type NewContentBase = typeof contentBase.$inferInsert;
