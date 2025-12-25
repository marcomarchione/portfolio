/**
 * Projects Extension Table Schema
 *
 * Type-specific extension for project content.
 * One-to-one relationship with content_base.
 */
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { contentBase } from './content-base';

/** Valid project statuses */
export const PROJECT_STATUSES = ['in-progress', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/**
 * Projects Table
 *
 * Stores project-specific fields extending content_base.
 * Each project must have exactly one corresponding content_base record.
 */
export const projects = sqliteTable(
  'projects',
  {
    /** Auto-incrementing primary key */
    id: integer('id').primaryKey({ autoIncrement: true }),

    /** Foreign key to content_base with UNIQUE constraint for 1:1 relationship */
    contentId: integer('content_id')
      .notNull()
      .unique()
      .references(() => contentBase.id, { onDelete: 'cascade' }),

    /** GitHub repository URL */
    githubUrl: text('github_url'),

    /** Live demo URL */
    demoUrl: text('demo_url'),

    /** Project development status */
    projectStatus: text('project_status', { enum: PROJECT_STATUSES })
      .notNull()
      .default('in-progress'),

    /** Unix timestamp when project started */
    startDate: integer('start_date', { mode: 'timestamp_ms' }),

    /** Unix timestamp when project was completed */
    endDate: integer('end_date', { mode: 'timestamp_ms' }),
  },
  (table) => [index('idx_projects_status').on(table.projectStatus)]
);

/** Type for selecting from projects table */
export type Project = typeof projects.$inferSelect;

/** Type for inserting into projects table */
export type NewProject = typeof projects.$inferInsert;
