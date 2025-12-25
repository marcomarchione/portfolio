/**
 * Admin Materials Routes
 *
 * CRUD endpoints for materials with authentication.
 * All routes require valid JWT access token.
 */
import { Elysia } from 'elysia';
import { createResponse, createPaginatedResponse } from '../../types/responses';
import { NotFoundError } from '../../types/errors';
import { authMiddleware } from '../../middleware/auth';
import {
  AdminListQuerySchema,
  AdminIdParamSchema,
  CreateMaterialBodySchema,
  UpdateMaterialBodySchema,
  TranslationBodySchema,
  TranslationLangParamSchema,
} from '../../types/content-schemas';
import {
  getMaterialWithAllTranslations,
  listMaterials,
  countMaterials,
  createMaterial,
  updateMaterial,
  archiveContent,
  upsertTranslation,
} from '../../db/queries';
import type { ContentStatus, Language, MaterialCategory } from '../../db/schema';

/**
 * Formats a material for admin API response.
 */
function formatAdminMaterialResponse(
  material: NonNullable<ReturnType<typeof getMaterialWithAllTranslations>>
) {
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

/**
 * Admin materials routes plugin.
 */
export const adminMaterialsRoutes = new Elysia({ name: 'admin-materials', prefix: '/materials' })
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

      const materials = listMaterials(db, options);
      const total = countMaterials(db, options);

      // Get all translations for each material
      const materialsWithAllTranslations = materials.map((material) => {
        const fullMaterial = getMaterialWithAllTranslations(db, material.id);
        if (!fullMaterial) return null;
        return formatAdminMaterialResponse(fullMaterial);
      }).filter(Boolean);

      return createPaginatedResponse(materialsWithAllTranslations, total, offset, limit);
    },
    {
      query: AdminListQuerySchema,
      detail: {
        tags: ['admin', 'materials'],
        summary: 'List all materials (admin)',
        description:
          'Returns a paginated list of all materials with all translations. Includes drafts and archived.',
      },
    }
  )
  .get(
    '/:id',
    async ({ params, db }) => {
      const id = parseInt(params.id, 10);
      const material = getMaterialWithAllTranslations(db, id);

      if (!material) {
        throw new NotFoundError('Material not found');
      }

      return createResponse(formatAdminMaterialResponse(material));
    },
    {
      params: AdminIdParamSchema,
      detail: {
        tags: ['admin', 'materials'],
        summary: 'Get material by ID (admin)',
        description: 'Returns a single material with all translations.',
      },
    }
  )
  .post(
    '/',
    async ({ body, db, set }) => {
      const material = createMaterial(db, {
        slug: body.slug,
        category: body.category as MaterialCategory,
        downloadUrl: body.downloadUrl,
        fileSize: body.fileSize,
        status: body.status as ContentStatus | undefined,
        featured: body.featured,
      });

      set.status = 201;
      return createResponse(formatAdminMaterialResponse(material));
    },
    {
      body: CreateMaterialBodySchema,
      detail: {
        tags: ['admin', 'materials'],
        summary: 'Create material',
        description:
          'Creates a new material with content_base and material extension in a transaction.',
      },
    }
  )
  .put(
    '/:id',
    async ({ params, body, db }) => {
      const id = parseInt(params.id, 10);

      const material = updateMaterial(db, id, {
        slug: body.slug,
        category: body.category as MaterialCategory | undefined,
        downloadUrl: body.downloadUrl,
        fileSize: body.fileSize,
        status: body.status as ContentStatus | undefined,
        featured: body.featured,
      });

      if (!material) {
        throw new NotFoundError('Material not found');
      }

      return createResponse(formatAdminMaterialResponse(material));
    },
    {
      params: AdminIdParamSchema,
      body: UpdateMaterialBodySchema,
      detail: {
        tags: ['admin', 'materials'],
        summary: 'Update material',
        description:
          'Updates a material. When status changes to published, sets publishedAt timestamp.',
      },
    }
  )
  .put(
    '/:id/translations/:lang',
    async ({ params, body, db }) => {
      const id = parseInt(params.id, 10);
      const lang = params.lang as Language;

      // Verify material exists
      const material = getMaterialWithAllTranslations(db, id);
      if (!material) {
        throw new NotFoundError('Material not found');
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
        tags: ['admin', 'materials'],
        summary: 'Upsert material translation',
        description:
          'Creates or updates a translation for a material in the specified language.',
      },
    }
  )
  .delete(
    '/:id',
    async ({ params, db }) => {
      const id = parseInt(params.id, 10);

      const archived = archiveContent(db, id);
      if (!archived) {
        throw new NotFoundError('Material not found');
      }

      // Get updated material with all translations
      const material = getMaterialWithAllTranslations(db, id);
      if (!material) {
        throw new NotFoundError('Material not found');
      }

      return createResponse(formatAdminMaterialResponse(material));
    },
    {
      params: AdminIdParamSchema,
      detail: {
        tags: ['admin', 'materials'],
        summary: 'Archive material',
        description: 'Soft deletes a material by setting its status to archived.',
      },
    }
  );
