/**
 * Admin News Routes
 *
 * CRUD endpoints for news with authentication.
 * All routes require valid JWT access token.
 */
import { Elysia, t } from 'elysia';
import { createResponse, createPaginatedResponse } from '../../types/responses';
import { NotFoundError } from '../../types/errors';
import { authMiddleware } from '../../middleware/auth';
import {
  AdminListQuerySchema,
  AdminIdParamSchema,
  CreateNewsBodySchema,
  UpdateNewsBodySchema,
  TranslationBodySchema,
  TranslationLangParamSchema,
  AssignTagsBodySchema,
} from '../../types/content-schemas';
import {
  getNewsWithAllTranslations,
  listNews,
  countNews,
  createNews,
  updateNews,
  archiveContent,
  upsertTranslation,
  getNewsByContentId,
  assignTags,
  removeTag,
} from '../../../db/queries';
import type { ContentStatus, Language } from '../../../db/schema';

/**
 * Formats a news item for admin API response.
 */
function formatAdminNewsResponse(
  newsItem: NonNullable<ReturnType<typeof getNewsWithAllTranslations>>
) {
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
    translations: newsItem.translations.map((t) => ({
      id: t.id,
      contentId: t.contentId,
      lang: t.lang,
      title: t.title,
      description: t.description,
      body: t.body,
      metaTitle: t.metaTitle,
      metaDescription: t.metaDescription,
    })),
    tags: newsItem.tags,
  };
}

/**
 * Admin news routes plugin.
 */
export const adminNewsRoutes = new Elysia({ name: 'admin-news', prefix: '/news' })
  .use(authMiddleware)
  .get(
    '/',
    async ({ query, db }) => {
      const limit = query.limit ?? 20;
      const offset = query.offset ?? 0;
      const status = query.status as ContentStatus | undefined;

      const options = {
        limit,
        offset,
        status,
        publishedOnly: false,
      };

      const newsItems = listNews(db, options);
      const total = countNews(db, options);

      // Get all translations for each news item
      const newsWithAllTranslations = newsItems.map((newsItem) => {
        const fullNews = getNewsWithAllTranslations(db, newsItem.id);
        if (!fullNews) return null;
        return formatAdminNewsResponse(fullNews);
      }).filter(Boolean);

      return createPaginatedResponse(newsWithAllTranslations, total, offset, limit);
    },
    {
      query: AdminListQuerySchema,
      detail: {
        tags: ['admin', 'news'],
        summary: 'List all news (admin)',
        description:
          'Returns a paginated list of all news items with all translations. Includes drafts and archived.',
      },
    }
  )
  .get(
    '/:id',
    async ({ params, db }) => {
      const id = parseInt(params.id, 10);
      const newsItem = getNewsWithAllTranslations(db, id);

      if (!newsItem) {
        throw new NotFoundError('News not found');
      }

      return createResponse(formatAdminNewsResponse(newsItem));
    },
    {
      params: AdminIdParamSchema,
      detail: {
        tags: ['admin', 'news'],
        summary: 'Get news by ID (admin)',
        description: 'Returns a single news item with all translations.',
      },
    }
  )
  .post(
    '/',
    async ({ body, db, set }) => {
      const newsItem = createNews(db, {
        slug: body.slug,
        coverImage: body.coverImage,
        readingTime: body.readingTime,
        status: body.status as ContentStatus | undefined,
        featured: body.featured,
      });

      set.status = 201;
      return createResponse(formatAdminNewsResponse(newsItem));
    },
    {
      body: CreateNewsBodySchema,
      detail: {
        tags: ['admin', 'news'],
        summary: 'Create news',
        description:
          'Creates a new news item with content_base and news extension in a transaction.',
      },
    }
  )
  .put(
    '/:id',
    async ({ params, body, db }) => {
      const id = parseInt(params.id, 10);

      const newsItem = updateNews(db, id, {
        slug: body.slug,
        coverImage: body.coverImage,
        readingTime: body.readingTime,
        status: body.status as ContentStatus | undefined,
        featured: body.featured,
      });

      if (!newsItem) {
        throw new NotFoundError('News not found');
      }

      return createResponse(formatAdminNewsResponse(newsItem));
    },
    {
      params: AdminIdParamSchema,
      body: UpdateNewsBodySchema,
      detail: {
        tags: ['admin', 'news'],
        summary: 'Update news',
        description:
          'Updates a news item. When status changes to published, sets publishedAt timestamp.',
      },
    }
  )
  .put(
    '/:id/translations/:lang',
    async ({ params, body, db }) => {
      const id = parseInt(params.id, 10);
      const lang = params.lang as Language;

      // Verify news exists
      const newsItem = getNewsWithAllTranslations(db, id);
      if (!newsItem) {
        throw new NotFoundError('News not found');
      }

      const translation = upsertTranslation(db, id, lang, {
        title: body.title,
        description: body.description,
        body: body.body,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
      });

      return createResponse({
        id: translation.id,
        contentId: translation.contentId,
        lang: translation.lang,
        title: translation.title,
        description: translation.description,
        body: translation.body,
        metaTitle: translation.metaTitle,
        metaDescription: translation.metaDescription,
      });
    },
    {
      params: TranslationLangParamSchema,
      body: TranslationBodySchema,
      detail: {
        tags: ['admin', 'news'],
        summary: 'Upsert news translation',
        description:
          'Creates or updates a translation for a news item in the specified language.',
      },
    }
  )
  .delete(
    '/:id',
    async ({ params, db }) => {
      const id = parseInt(params.id, 10);

      const archived = archiveContent(db, id);
      if (!archived) {
        throw new NotFoundError('News not found');
      }

      // Get updated news with all translations
      const newsItem = getNewsWithAllTranslations(db, id);
      if (!newsItem) {
        throw new NotFoundError('News not found');
      }

      return createResponse(formatAdminNewsResponse(newsItem));
    },
    {
      params: AdminIdParamSchema,
      detail: {
        tags: ['admin', 'news'],
        summary: 'Archive news',
        description: 'Soft deletes a news item by setting its status to archived.',
      },
    }
  )
  .post(
    '/:id/tags',
    async ({ params, body, db }) => {
      const id = parseInt(params.id, 10);

      // Get news record
      const newsRecord = getNewsByContentId(db, id);
      if (!newsRecord) {
        throw new NotFoundError('News not found');
      }

      // Assign tags
      assignTags(db, newsRecord.id, body.tagIds);

      // Get updated news
      const newsItem = getNewsWithAllTranslations(db, id);
      if (!newsItem) {
        throw new NotFoundError('News not found');
      }

      return createResponse(formatAdminNewsResponse(newsItem));
    },
    {
      params: AdminIdParamSchema,
      body: AssignTagsBodySchema,
      detail: {
        tags: ['admin', 'news'],
        summary: 'Assign tags to news',
        description:
          'Replaces all news tags with the provided list of tag IDs.',
      },
    }
  )
  .delete(
    '/:id/tags/:tagId',
    async ({ params, db }) => {
      const id = parseInt(params.id, 10);
      const tagId = parseInt(params.tagId, 10);

      // Get news record
      const newsRecord = getNewsByContentId(db, id);
      if (!newsRecord) {
        throw new NotFoundError('News not found');
      }

      // Remove tag
      removeTag(db, newsRecord.id, tagId);

      // Get updated news
      const newsItem = getNewsWithAllTranslations(db, id);
      if (!newsItem) {
        throw new NotFoundError('News not found');
      }

      return createResponse(formatAdminNewsResponse(newsItem));
    },
    {
      params: t.Object({
        id: t.String({ pattern: '^[0-9]+$' }),
        tagId: t.String({ pattern: '^[0-9]+$' }),
      }),
      detail: {
        tags: ['admin', 'news'],
        summary: 'Remove tag from news',
        description: 'Removes a single tag association from a news item.',
      },
    }
  );
