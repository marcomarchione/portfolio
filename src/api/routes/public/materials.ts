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
} from '../../../db/queries';
import type { Language, MaterialCategory } from '../../../db/schema';

/**
 * Formats a material for API response.
 */
function formatMaterialResponse(material: NonNullable<ReturnType<typeof getMaterialWithTranslation>>) {
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
 * Public materials routes plugin.
 */
export const publicMaterialsRoutes = new Elysia({ name: 'public-materials', prefix: '/materials' })
  .get(
    '/',
    async ({ query, db }) => {
      const lang = (query.lang ?? 'it') as Language;
      const limit = query.limit ?? 20;
      const offset = query.offset ?? 0;
      const featured = query.featured;
      const category = query.category as MaterialCategory | undefined;

      const options = {
        limit,
        offset,
        featured,
        category,
        publishedOnly: true,
      };

      const materials = listMaterials(db, options);
      const total = countMaterials(db, options);

      // Get translations for each material
      const materialsWithTranslations = materials.map((material) => {
        const translation = getTranslation(db, material.id, lang);
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
      });

      return createPaginatedResponse(materialsWithTranslations, total, offset, limit);
    },
    {
      query: MaterialQuerySchema,
      detail: {
        tags: ['materials'],
        summary: 'List published materials',
        description:
          'Returns a paginated list of published materials with translations for the requested language.',
      },
    }
  )
  .get(
    '/:slug',
    async ({ params, query, db }) => {
      const lang = (query.lang ?? 'it') as Language;
      const material = getMaterialWithTranslation(db, params.slug, lang);

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
