/**
 * Status and Category Constants
 *
 * Defines valid statuses and categories for content types.
 */

/** Valid content types for the CMS */
export const CONTENT_TYPES = ['project', 'material', 'news'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

/** Valid content publication statuses */
export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** Valid project development statuses */
export const PROJECT_STATUSES = ['in-progress', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Valid material categories */
export const MATERIAL_CATEGORIES = ['guide', 'template', 'resource', 'tool'] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];
