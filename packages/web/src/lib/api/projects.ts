/**
 * Projects API
 *
 * Functions for fetching project content from the API.
 */
import type { Language, Project, PaginatedResponse, ApiResponse, Technology } from '@marcomarchione/shared';
import { get, getSafe } from './client';

/** Project development status */
export type ProjectStatus = 'in-progress' | 'completed' | 'archived';

/** Project sort options */
export type ProjectSortOption = 'newest' | 'oldest' | 'title';

/** Options for fetching projects list */
export interface GetProjectsOptions {
  featured?: boolean;
  limit?: number;
  offset?: number;
  /** Filter by technology name */
  technology?: string;
  /** Filter by project development status */
  projectStatus?: ProjectStatus;
  /** Sort order option */
  sortBy?: ProjectSortOption;
}

/** Gallery image structure */
export interface GalleryImage {
  id: number;
  url: string;
  alt: string | null;
  displayOrder: number;
}

/** Extended project type with gallery images */
export interface ProjectWithGallery extends Project {
  galleryImages?: GalleryImage[];
}

/**
 * Fetches a paginated list of projects.
 *
 * @param lang - Language code for translations
 * @param options - Optional filters and pagination
 * @returns Paginated projects response
 */
export async function getProjects(
  lang: Language,
  options: GetProjectsOptions = {}
): Promise<PaginatedResponse<Project>> {
  const params = new URLSearchParams();
  params.set('lang', lang);

  if (options.featured !== undefined) {
    params.set('featured', String(options.featured));
  }
  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }
  if (options.offset !== undefined) {
    params.set('offset', String(options.offset));
  }
  if (options.technology !== undefined) {
    params.set('technology', options.technology);
  }
  if (options.projectStatus !== undefined) {
    params.set('projectStatus', options.projectStatus);
  }
  if (options.sortBy !== undefined) {
    params.set('sortBy', options.sortBy);
  }

  return get<PaginatedResponse<Project>>(`/projects?${params.toString()}`);
}

/**
 * Fetches a single project by slug (with gallery images).
 *
 * @param slug - Project slug
 * @param lang - Language code for translations
 * @returns Project data with gallery images or null if not found
 */
export async function getProject(
  slug: string,
  lang: Language
): Promise<ProjectWithGallery | null> {
  const response = await getSafe<ApiResponse<ProjectWithGallery>>(`/projects/${slug}?lang=${lang}`);
  return response?.data ?? null;
}

/**
 * Fetches all project slugs for static path generation.
 *
 * @returns Array of project slugs
 */
export async function getProjectSlugs(): Promise<string[]> {
  const response = await getSafe<PaginatedResponse<Project>>('/projects?limit=1000');
  return response?.data.map((p: Project) => p.slug) ?? [];
}

/**
 * Fetches all available technologies for filtering.
 *
 * @returns Array of technologies
 */
export async function getTechnologies(): Promise<Technology[]> {
  const response = await getSafe<ApiResponse<Technology[]>>('/technologies');
  return response?.data ?? [];
}
