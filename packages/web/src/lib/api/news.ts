/**
 * News API
 *
 * Functions for fetching news content from the API.
 */
import type { Language, News, PaginatedResponse, ApiResponse } from '@marcomarchione/shared';
import { get, getSafe } from './client';

/** Options for fetching news list */
export interface GetNewsOptions {
  limit?: number;
  offset?: number;
}

/**
 * Fetches a paginated list of news articles.
 *
 * @param lang - Language code for translations
 * @param options - Optional pagination
 * @returns Paginated news response
 */
export async function getNews(
  lang: Language,
  options: GetNewsOptions = {}
): Promise<PaginatedResponse<News>> {
  const params = new URLSearchParams();
  params.set('lang', lang);

  if (options.limit !== undefined) {
    params.set('limit', String(options.limit));
  }
  if (options.offset !== undefined) {
    params.set('offset', String(options.offset));
  }

  return get<PaginatedResponse<News>>(`/news?${params.toString()}`);
}

/**
 * Fetches a single news article by slug.
 *
 * @param slug - News article slug
 * @param lang - Language code for translations
 * @returns News data or null if not found
 */
export async function getNewsItem(
  slug: string,
  lang: Language
): Promise<News | null> {
  const response = await getSafe<ApiResponse<News>>(`/news/${slug}?lang=${lang}`);
  return response?.data ?? null;
}

/**
 * Fetches all news slugs for static path generation.
 *
 * @returns Array of news slugs
 */
export async function getNewsSlugs(): Promise<string[]> {
  const response = await getSafe<PaginatedResponse<News>>('/news?limit=1000');
  return response?.data.map((n: News) => n.slug) ?? [];
}
