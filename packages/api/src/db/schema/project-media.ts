/**
 * Project Media Junction Table Schema
 *
 * Many-to-many relationship between projects and media for image galleries.
 * Includes displayOrder for custom ordering of gallery images.
 */
import { pgTable, integer, primaryKey, index } from 'drizzle-orm/pg-core';
import { projects } from './projects';
import { media } from './media';

/**
 * Project Media Junction Table
 *
 * Links projects to their associated media items (gallery images).
 * Uses composite primary key on (project_id, media_id).
 * Display order enables custom ordering of gallery images (0-indexed).
 */
export const projectMedia = pgTable(
  'project_media',
  {
    /** Foreign key to projects table */
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),

    /** Foreign key to media table */
    mediaId: integer('media_id')
      .notNull()
      .references(() => media.id, { onDelete: 'cascade' }),

    /** Display order for gallery images (0-indexed) */
    displayOrder: integer('display_order').notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.mediaId] }),
    index('idx_project_media_project_id').on(table.projectId),
    index('idx_project_media_media_id').on(table.mediaId),
    index('idx_project_media_project_order').on(table.projectId, table.displayOrder),
  ]
);

/** Type for selecting from project_media table */
export type ProjectMedia = typeof projectMedia.$inferSelect;

/** Type for inserting into project_media table */
export type NewProjectMedia = typeof projectMedia.$inferInsert;
