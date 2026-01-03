/**
 * Admin Content Routes
 *
 * Shared endpoints for content operations across all content types.
 * Includes publish/unpublish status management.
 */
import { Elysia, t } from 'elysia';
import { createResponse } from '../../types/responses';
import { NotFoundError } from '../../types/errors';
import { authMiddleware } from '../../middleware/auth';
import { ContentStatusSchema, AdminIdParamSchema } from '../../types/content-schemas';
import {
  getContentById,
  updateContentStatus,
  getProjectWithAllTranslations,
  getMaterialWithAllTranslations,
  getNewsWithAllTranslations,
} from '../../db/queries';
import type { ContentStatus } from '../../db/schema';
import type { DrizzleDB } from '../../db';

/**
 * Valid content types for the publish endpoint.
 */
const VALID_CONTENT_TYPES = ['projects', 'materials', 'news'] as const;
type ValidContentType = (typeof VALID_CONTENT_TYPES)[number];

/**
 * Content type parameter schema.
 */
const ContentTypeParamSchema = t.Object({
  contentType: t.Union(
    VALID_CONTENT_TYPES.map((ct) => t.Literal(ct)),
    { description: 'Content type: projects, materials, or news' }
  ),
  id: t.String({
    pattern: '^[0-9]+$',
    description: 'Content ID',
  }),
});

/**
 * Publish status body schema.
 */
const PublishStatusBodySchema = t.Object({
  status: ContentStatusSchema,
});

/**
 * Formats content response based on content type.
 * Returns the full content data with all translations.
 */
function getFormattedContentResponse(
  db: Parameters<typeof getContentById>[0],
  contentType: ValidContentType,
  id: number
) {
  switch (contentType) {
    case 'projects': {
      const project = getProjectWithAllTranslations(db, id);
      if (!project) return null;
      return {
        id: project.id,
        type: project.type,
        slug: project.slug,
        status: project.status,
        featured: project.featured,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        publishedAt: project.publishedAt?.toISOString() ?? null,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
        projectStatus: project.projectStatus,
        startDate: project.startDate?.toISOString() ?? null,
        endDate: project.endDate?.toISOString() ?? null,
        translations: project.translations.map((t) => ({
          id: t.id,
          contentId: t.contentId,
          lang: t.lang,
          title: t.title,
          description: t.description,
          body: t.body,
          metaTitle: t.metaTitle,
          metaDescription: t.metaDescription,
        })),
        technologies: project.technologies,
      };
    }
    case 'materials': {
      const material = getMaterialWithAllTranslations(db, id);
      if (!material) return null;
      return {
        id: material.id,
        type: material.type,
        slug: material.slug,
        status: material.status,
        featured: material.featured,
        createdAt: material.createdAt.toISOString(),
        updatedAt: material.updatedAt.toISOString(),
        publishedAt: material.publishedAt?.toISOString() ?? null,
        category: material.category,
        downloadUrl: material.downloadUrl,
        fileSize: material.fileSize,
        translations: material.translations.map((t) => ({
          id: t.id,
          contentId: t.contentId,
          lang: t.lang,
          title: t.title,
          description: t.description,
          body: t.body,
          metaTitle: t.metaTitle,
          metaDescription: t.metaDescription,
        })),
      };
    }
    case 'news': {
      const newsItem = getNewsWithAllTranslations(db, id);
      if (!newsItem) return null;
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
  }
}

/**
 * Admin content routes plugin.
 * Provides shared content operations across all content types.
 */
export const adminContentRoutes: any = new Elysia({ name: 'admin-content' })
  .use(authMiddleware)
  .patch(
    '/:contentType/:id/publish',
    async ({ params, body, db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const contentType = params.contentType as ValidContentType;
      const id = parseInt(params.id, 10);
      const newStatus = body.status as ContentStatus;

      // Verify content exists
      const content = getContentById(db, id);
      if (!content) {
        throw new NotFoundError('Content not found');
      }

      // Update the content status
      updateContentStatus(db, id, newStatus);

      // Get the formatted response based on content type
      const formattedContent = getFormattedContentResponse(db, contentType, id);
      if (!formattedContent) {
        throw new NotFoundError('Content not found after update');
      }

      return createResponse(formattedContent);
    },
    {
      params: ContentTypeParamSchema,
      body: PublishStatusBodySchema,
      detail: {
        tags: ['admin', 'content'],
        summary: 'Update content status (publish/unpublish)',
        description:
          'Changes the publication status of content. Sets publishedAt timestamp when first published. Supports projects, materials, and news.',
      },
    }
  );
