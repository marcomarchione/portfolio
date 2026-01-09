/**
 * API Barrel Export
 *
 * Re-exports all API functions for clean imports.
 */

// Client utilities
export { get, getSafe, ApiError, BASE_URL, API_PREFIX } from './client';

// Projects API
export { getProjects, getProject, getProjectSlugs, getTechnologies } from './projects';
export type {
  GetProjectsOptions,
  ProjectStatus,
  ProjectSortOption,
  GalleryImage,
  ProjectWithGallery,
} from './projects';

// Materials API
export { getMaterials, getMaterial, getMaterialSlugs } from './materials';
export type { GetMaterialsOptions } from './materials';

// News API
export { getNews, getNewsItem, getNewsSlugs } from './news';
export type { GetNewsOptions } from './news';

// Re-export shared types for convenience
export type {
  Project,
  Material,
  News,
  Content,
  ContentTranslation,
  Technology,
  Tag,
  PaginatedResponse,
  ApiResponse,
} from '@marcomarchione/shared';
