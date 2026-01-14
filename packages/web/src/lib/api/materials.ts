/**
 * Materials API
 *
 * Functions for fetching material content from the API.
 */
import type { Language, Material, PaginatedResponse, ApiResponse } from '@marcomarchione/shared';
import { get, getSafe } from './client';

/** Material sort options */
export type MaterialSortOption = 'newest' | 'oldest' | 'title';

/** Options for fetching materials list */
export interface GetMaterialsOptions {
  category?: string;
  limit?: number;
  offset?: number;
  /** Search query to filter by title or description */
  search?: string;
  /** Sort order option */
  sortBy?: MaterialSortOption;
}

/**
 * Fetches a paginated list of materials.
 *
 * @param lang - Language code for translations
 * @param options - Optional filters and pagination
 * @returns Paginated materials response
 */
export async function getMaterials(
  lang: Language,
  options: GetMaterialsOptions = {}
): Promise<PaginatedResponse<Material>> {
  const params = new URLSearchParams();
  params.set('lang', lang);

  if (options.category) {
    params.set('category', options.category);
  }
  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }
  if (options.offset !== undefined) {
    params.set('offset', String(options.offset));
  }
  if (options.search) {
    params.set('search', options.search);
  }
  if (options.sortBy) {
    params.set('sortBy', options.sortBy);
  }

  return get<PaginatedResponse<Material>>(`/materials?${params.toString()}`);
}

/**
 * Fetches a single material by slug.
 *
 * @param slug - Material slug
 * @param lang - Language code for translations
 * @returns Material data or null if not found
 */
export async function getMaterial(
  slug: string,
  lang: Language
): Promise<Material | null> {
  const response = await getSafe<ApiResponse<Material>>(`/materials/${slug}?lang=${lang}`);
  return response?.data ?? null;
}

/**
 * Fetches all material slugs for static path generation.
 *
 * @returns Array of material slugs
 */
export async function getMaterialSlugs(): Promise<string[]> {
  const response = await getSafe<PaginatedResponse<Material>>('/materials?limit=1000');
  return response?.data.map((m: Material) => m.slug) ?? [];
}
