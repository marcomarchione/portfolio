/**
 * Technologies Table Schema
 *
 * Standalone lookup table for technology tags on projects.
 * Used for tagging projects with technologies/frameworks.
 */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * Technologies Table
 *
 * Stores technology definitions that can be associated with projects.
 * Referenced by the project_technologies junction table.
 */
export const technologies = sqliteTable('technologies', {
  /** Auto-incrementing primary key */
  id: integer('id').primaryKey({ autoIncrement: true }),

  /** Technology name (must be unique) */
  name: text('name').notNull().unique(),

  /** Icon identifier or path */
  icon: text('icon'),

  /** Hex color code for display */
  color: text('color'),
});

/** Type for selecting from technologies table */
export type Technology = typeof technologies.$inferSelect;

/** Type for inserting into technologies table */
export type NewTechnology = typeof technologies.$inferInsert;
