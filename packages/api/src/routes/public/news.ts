/**
 * Public News Routes
 *
 * Read-only endpoints for published news articles.
 * No authentication required.
 */
import { Elysia, t } from 'elysia';
import { createResponse, createPaginatedResponse } from '../../types/responses';
import { NotFoundError } from '../../types/errors';
import {
  NewsQuerySchema,
  SlugParamSchema,
} from '../../types/content-schemas';
import { LangSchema } from '../../types/validation';
import {
  getNewsWithTranslation,
  listNews,
  countNews,
  getTranslation,
  getNewsTags,
  getNewsByContentId,
} from '../../db/queries';
import type { Language } from '../../db/schema';

/**
 * Formats a news item for API response.
 */
function formatNewsResponse(newsItem: NonNullable<ReturnType<typeof getNewsWithTranslation>>) {
  return {
    id: newsItem.id,
    type: newsItem.type,
    slug: newsItem.slug,
    status: newsItem.status,
    featured: newsItem.featured,
    createdAt: newsItem.createdAt.toISOString(),
    updatedAt: newsItem.updatedAt.toISOString(),
    publishedAt: newsItem.publishedAt?.toISOString() ?? null,
    coverImage: newsItem.coverImage,
    readingTime: newsItem.readingTime,
    translation: newsItem.translation
      ? {
          id: newsItem.translation.id,
          contentId: newsItem.translation.contentId,
          lang: newsItem.translation.lang,
          title: newsItem.translation.title,
          description: newsItem.translation.description,
          body: newsItem.translation.body,
          metaTitle: newsItem.translation.metaTitle,
          metaDescription: newsItem.translation.metaDescription,
        }
      : null,
    tags: newsItem.tags,
  };
}

/**
 * Public news routes plugin.
 */
export const publicNewsRoutes = new Elysia({ name: 'public-news', prefix: '/news' })
  .get(
    '/',
    async ({ query, db }) => {
      const lang = (query.lang ?? 'it') as Language;
      const limit = query.limit ?? 20;
      const offset = query.offset ?? 0;
      const featured = query.featured;
      const tag = query.tag;

      const options = {
        limit,
        offset,
        featured,
        tag,
        publishedOnly: true,
      };

      const newsItems = listNews(db, options);
      const total = countNews(db, options);

      // Get translations and tags for each news item
      const newsWithTranslations = newsItems.map((newsItem) => {
        const translation = getTranslation(db, newsItem.id, lang);
        const newsRecord = getNewsByContentId(db, newsItem.id);
        const tags = newsRecord ? getNewsTags(db, newsRecord.id) : [];

        return {
          id: newsItem.id,
          type: newsItem.type,
          slug: newsItem.slug,
          status: newsItem.status,
          featured: newsItem.featured,
          createdAt: newsItem.createdAt.toISOString(),
          updatedAt: newsItem.updatedAt.toISOString(),
          publishedAt: newsItem.publishedAt?.toISOString() ?? null,
          coverImage: newsItem.coverImage,
          readingTime: newsItem.readingTime,
          translation: translation
            ? {
                id: translation.id,
                contentId: translation.contentId,
                lang: translation.lang,
                title: translation.title,
                description: translation.description,
                body: translation.body,
                metaTitle: translation.metaTitle,
                metaDescription: translation.metaDescription,
              }
            : null,
          tags,
        };
      });

      return createPaginatedResponse(newsWithTranslations, total, offset, limit);
    },
    {
      query: NewsQuerySchema,
      detail: {
        tags: ['news'],
        summary: 'List published news',
        description:
          'Returns a paginated list of published news articles with translations for the requested language.',
      },
    }
  )
  .get(
    '/:slug',
    async ({ params, query, db }) => {
      const lang = (query.lang ?? 'it') as Language;
      const newsItem = getNewsWithTranslation(db, params.slug, lang);

      if (!newsItem || newsItem.status !== 'published') {
        throw new NotFoundError('News article not found');
      }

      return createResponse(formatNewsResponse(newsItem));
    },
    {
      params: SlugParamSchema,
      query: t.Object({
        lang: t.Optional(LangSchema),
      }),
      detail: {
        tags: ['news'],
        summary: 'Get news article by slug',
        description:
          'Returns a single published news article with translation for the requested language.',
      },
    }
  );
