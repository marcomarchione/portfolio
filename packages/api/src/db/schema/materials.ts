/**
 * Materials Extension Table Schema
 *
 * Type-specific extension for downloadable materials.
 * One-to-one relationship with content_base.
 */
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { contentBase } from './content-base';

/** Valid material categories */
export const MATERIAL_CATEGORIES = ['guide', 'template', 'resource', 'tool'] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

/**
 * Materials Table
 *
 * Stores material-specific fields extending content_base.
 * Each material must have exactly one corresponding content_base record.
 */
export const materials = sqliteTable(
  'materials',
  {
    /** Auto-incrementing primary key */
    id: integer('id').primaryKey({ autoIncrement: true }),

    /** Foreign key to content_base with UNIQUE constraint for 1:1 relationship */
    contentId: integer('content_id')
      .notNull()
      .unique()
      .references(() => contentBase.id, { onDelete: 'cascade' }),

    /** Material category for filtering */
    category: text('category', { enum: MATERIAL_CATEGORIES }).notNull(),

    /** Download URL (required) */
    downloadUrl: text('download_url').notNull(),

    /** File size in bytes */
    fileSize: integer('file_size'),
  },
  (table) => [index('idx_materials_category').on(table.category)]
);

/** Type for selecting from materials table */
export type Material = typeof materials.$inferSelect;

/** Type for inserting into materials table */
export type NewMaterial = typeof materials.$inferInsert;
