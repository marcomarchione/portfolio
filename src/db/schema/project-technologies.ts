/**
 * Project Technologies Junction Table Schema
 *
 * Many-to-many relationship between projects and technologies.
 */
import { sqliteTable, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { projects } from './projects';
import { technologies } from './technologies';

/**
 * Project Technologies Junction Table
 *
 * Links projects to their associated technologies.
 * Uses composite primary key on (project_id, technology_id).
 */
export const projectTechnologies = sqliteTable(
  'project_technologies',
  {
    /** Foreign key to projects table */
    projectId: integer('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),

    /** Foreign key to technologies table */
    technologyId: integer('technology_id')
      .notNull()
      .references(() => technologies.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.technologyId] }),
    index('idx_project_technologies_project_id').on(table.projectId),
    index('idx_project_technologies_technology_id').on(table.technologyId),
  ]
);

/** Type for selecting from project_technologies table */
export type ProjectTechnology = typeof projectTechnologies.$inferSelect;

/** Type for inserting into project_technologies table */
export type NewProjectTechnology = typeof projectTechnologies.$inferInsert;
