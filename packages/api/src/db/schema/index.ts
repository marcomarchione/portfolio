/**
 * Database Schema Barrel Export
 *
 * This module exports all table definitions and inferred types.
 */

// Core tables
export {
  contentBase,
  CONTENT_TYPES,
  CONTENT_STATUSES,
  type ContentBase,
  type NewContentBase,
  type ContentType,
  type ContentStatus,
} from './content-base';

export {
  contentTranslations,
  LANGUAGES,
  type ContentTranslation,
  type NewContentTranslation,
  type Language,
} from './content-translations';

export {
  projects,
  PROJECT_STATUSES,
  type Project,
  type NewProject,
  type ProjectStatus,
} from './projects';

export {
  materials,
  MATERIAL_CATEGORIES,
  type Material,
  type NewMaterial,
  type MaterialCategory,
} from './materials';

export { news, type News, type NewNews } from './news';

// Supporting tables
export { technologies, type Technology, type NewTechnology } from './technologies';

export { tags, type Tag, type NewTag } from './tags';

export {
  media,
  type Media,
  type NewMedia,
  type MediaVariant,
  type MediaVariants,
} from './media';

// Junction tables
export {
  projectTechnologies,
  type ProjectTechnology,
  type NewProjectTechnology,
} from './project-technologies';

export { newsTags, type NewsTag, type NewNewsTag } from './news-tags';
