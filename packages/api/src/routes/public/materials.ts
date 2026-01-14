/**
 * Public Materials Routes
 *
 * Read-only endpoints for published materials.
 * No authentication required.
 */
import { Elysia, t } from 'elysia';
import { createResponse, createPaginatedResponse } from '../../types/responses';
import { NotFoundError } from '../../types/errors';
import {
  MaterialQuerySchema,
  SlugParamSchema,
} from '../../types/content-schemas';
import { LangSchema } from '../../types/validation';
import {
  getMaterialWithTranslation,
  listMaterials,
  countMaterials,
  getTranslation,
} from '../../db/queries';
import type { Language, MaterialCategory } from '../../db/schema';
import type { DrizzleDB } from '../../db';
import type { ContentSortField, SortOrder } from '../../db/queries/content';

/**
 * Formats a material for API response.
 */
function formatMaterialResponse(material: NonNullable<Awaited<ReturnType<typeof getMaterialWithTranslation>>>) {
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
    translation: material.translation
      ? {
          id: material.translation.id,
          contentId: material.translation.contentId,
          lang: material.translation.lang,
          title: material.translation.title,
          description: material.translation.description,
          body: material.translation.body,
          metaTitle: material.translation.metaTitle,
          metaDescription: material.translation.metaDescription,
        }
      : null,
  };
}

/**
 * Maps public sort options to database sort fields and orders.
 */
function mapSortOption(sortBy?: string): { sortBy: ContentSortField; sortOrder: SortOrder } {
  switch (sortBy) {
    case 'oldest':
      return { sortBy: 'createdAt', sortOrder: 'asc' };
    case 'title':
      return { sortBy: 'title', sortOrder: 'asc' };
    case 'newest':
    default:
      return { sortBy: 'createdAt', sortOrder: 'desc' };
  }
}

/**
 * Public materials routes plugin.
 */
export const publicMaterialsRoutes = new Elysia({ name: 'public-materials', prefix: '/materials' })
  .get(
    '/',
    async (ctx: any) => {
      const db = ctx.db as DrizzleDB;
      const query = ctx.query;
      const lang = (query.lang ?? 'it') as Language;
      const limit = Number(query.limit ?? 20);
      const offset = Number(query.offset ?? 0);
      const featured = query.featured === 'true' ? true : query.featured === 'false' ? false : query.featured;
      const category = query.category as MaterialCategory | undefined;
      const search = query.search as string | undefined;
      const sortByParam = query.sortBy as string | undefined;

      // Map public sort option to database sort fields
      const { sortBy, sortOrder } = mapSortOption(sortByParam);

      const options = {
        limit,
        offset,
        featured,
        category,
        search,
        sortBy,
        sortOrder,
        publishedOnly: true,
      };

      const materials = await listMaterials(db, options);
      const total = await countMaterials(db, options);

      // Get translations for each material
      const materialsWithTranslations = await Promise.all(
        materials.map(async (material) => {
          const translation = await getTranslation(db, material.id, lang);
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
          };
        })
      );

      return createPaginatedResponse(materialsWithTranslations, total, offset, limit);
    },
    {
      query: MaterialQuerySchema,
      detail: {
        tags: ['materials'],
        summary: 'List published materials',
        description:
          'Returns a paginated list of published materials with translations for the requested language. Supports category filter, search by title/description, and sorting options.',
      },
    }
  )
  .get(
    '/:slug',
    async (ctx: any) => {
      const db = ctx.db as DrizzleDB;
      const lang = (ctx.query.lang ?? 'it') as Language;
      const material = await getMaterialWithTranslation(db, ctx.params.slug, lang);

      if (!material || material.status !== 'published') {
        throw new NotFoundError('Material not found');
      }

      return createResponse(formatMaterialResponse(material));
    },
    {
      params: SlugParamSchema,
      query: t.Object({
        lang: t.Optional(LangSchema),
      }),
      detail: {
        tags: ['materials'],
        summary: 'Get material by slug',
        description:
          'Returns a single published material with translation for the requested language.',
      },
    }
  );
