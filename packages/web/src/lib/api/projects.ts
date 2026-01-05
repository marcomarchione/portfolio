/**
 * Projects API
 *
 * Functions for fetching project content from the API.
 */
import type { Language, Project, PaginatedResponse, ApiResponse } from '@marcomarchione/shared';
import { get, getSafe } from './client';

/** Options for fetching projects list */
export interface GetProjectsOptions {
  featured?: boolean;
  limit?: number;
  offset?: number;
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

  return get<PaginatedResponse<Project>>(`/projects?${params.toString()}`);
}

/**
 * Fetches a single project by slug.
 *
 * @param slug - Project slug
 * @param lang - Language code for translations
 * @returns Project data or null if not found
 */
export async function getProject(
  slug: string,
  lang: Language
): Promise<Project | null> {
  const response = await getSafe<ApiResponse<Project>>(`/projects/${slug}?lang=${lang}`);
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
