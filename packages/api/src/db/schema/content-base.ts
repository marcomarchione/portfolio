/**
 * Content Base Table Schema
 *
 * Primary table for all content types with shared metadata fields.
 * Supports three content types: project, material, and news.
 */
import { pgTable, text, serial, boolean, timestamp, index } from 'drizzle-orm/pg-core';

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
export const contentBase = pgTable(
  'content_base',
  {
    /** Auto-incrementing primary key */
    id: serial('id').primaryKey(),

    /** Content type discriminator with CHECK constraint */
    type: text('type', { enum: CONTENT_TYPES }).notNull(),

    /** URL-friendly unique identifier */
    slug: text('slug').notNull().unique(),

    /** Publication status with CHECK constraint */
    status: text('status', { enum: CONTENT_STATUSES }).notNull().default('draft'),

    /** Whether this content is featured on the homepage */
    featured: boolean('featured').notNull().default(false),

    /** Timestamp of creation */
    createdAt: timestamp('created_at').notNull().defaultNow(),

    /** Timestamp of last update */
    updatedAt: timestamp('updated_at').notNull().defaultNow(),

    /** Timestamp of publication (null if never published) */
    publishedAt: timestamp('published_at'),
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
