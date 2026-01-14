/**
 * Admin Media Routes
 *
 * CRUD endpoints for media files with authentication.
 * All routes require valid JWT access token.
 */
import { Elysia, t } from 'elysia';
import { createResponse, createPaginatedResponse } from '../../types/responses';
import {
  NotFoundError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  ValidationError,
} from '../../types/errors';
import { authMiddleware } from '../../middleware/auth';
import {
  MediaQuerySchema,
  MediaIdParamSchema,
  UpdateMediaBodySchema,
} from '../../types/media-schemas';
import {
  insertMedia,
  getMediaById,
  listMedia,
  listDeletedMedia,
  countMedia,
  countDeletedMedia,
  updateMediaAltText,
  updateMediaVariants,
  softDeleteMedia,
  restoreMedia,
  permanentlyDeleteMedia,
} from '../../db/queries';
import {
  validateFileType,
  validateFileSize,
  getMaxFileSize,
  getAllowedMimeTypes,
  processImage,
  isRasterImage,
  saveFile,
  deleteFile,
  getStoragePublicUrl,
  type StorageConfig,
} from '../../services/media';
import { config } from '../../config';
import type { Media, MediaVariants } from '../../db/schema';
import type { DrizzleDB } from '../../db';

/**
 * Gets storage configuration from app config.
 */
function getStorageConfigFromAppConfig(): StorageConfig {
  return {
    backend: config.STORAGE_BACKEND,
    uploadsPath: config.UPLOADS_PATH,
    r2Config: config.R2_CONFIG,
  };
}

/**
 * Formats a media record for API response.
 */
function formatMediaResponse(media: Media) {
  const storageConfig = getStorageConfigFromAppConfig();
  const response: Record<string, unknown> = {
    id: media.id,
    filename: media.filename,
    mimeType: media.mimeType,
    size: media.size,
    storageKey: media.storageKey,
    url: getStoragePublicUrl(media.storageKey, storageConfig),
    altText: media.altText,
    width: media.width,
    height: media.height,
    createdAt: media.createdAt.toISOString(),
    deletedAt: media.deletedAt?.toISOString() ?? null,
  };

  // Parse and add variant URLs if available
  if (media.variants) {
    try {
      const variants = JSON.parse(media.variants) as MediaVariants;
      const variantsWithUrls: Record<string, unknown> = {};

      for (const [key, variant] of Object.entries(variants)) {
        if (variant) {
          variantsWithUrls[key] = {
            ...variant,
            url: getStoragePublicUrl(variant.path, storageConfig),
          };
        }
      }

      response.variants = variantsWithUrls;
    } catch {
      // Ignore JSON parse errors
    }
  }

  return response;
}

/**
 * Admin media routes plugin.
 */
export const adminMediaRoutes: any = new Elysia({ name: 'admin-media', prefix: '/media' })
  .use(authMiddleware)
  .post(
    '/',
    async ({ body, db: rawDb, set }) => {
      const db = rawDb as DrizzleDB;
      // Get file from multipart form data
      const file = (body as { file?: File }).file;

      if (!file) {
        throw new ValidationError('No file provided');
      }

      // Validate file type
      if (!validateFileType(file.type)) {
        throw new UnsupportedMediaTypeError(
          `File type ${file.type} is not supported`,
          {
            receivedType: file.type,
            allowedTypes: getAllowedMimeTypes(),
          }
        );
      }

      // Validate file size
      if (!validateFileSize(file.type, file.size)) {
        const maxSize = getMaxFileSize(file.type);
        throw new PayloadTooLargeError(
          `File size exceeds limit`,
          {
            maxSize,
            receivedSize: file.size,
            mimeType: file.type,
          }
        );
      }

      // Get storage configuration
      const storageConfig = getStorageConfigFromAppConfig();

      // Read file buffer (needed for both saving and image processing)
      const fileBuffer = Buffer.from(await file.arrayBuffer());

      // Save file using storage provider (works for both local and R2)
      const saveResult = await saveFile(file, storageConfig);

      // Insert media record
      const media = await insertMedia(db, {
        filename: saveResult.filename,
        mimeType: saveResult.mimeType,
        size: saveResult.size,
        storageKey: saveResult.storageKey,
        createdAt: new Date(),
      });

      // Process image variants asynchronously (fire-and-forget)
      if (isRasterImage(file.type)) {
        processImage(
          fileBuffer,
          saveResult.storageKey,
          saveResult.mimeType,
          storageConfig
        ).then(async (result) => {
          // Update media record with variants and dimensions
          if (result.width > 0 && Object.keys(result.variants).length > 0) {
            await updateMediaVariants(db, media.id, {
              variants: JSON.stringify(result.variants),
              width: result.width,
              height: result.height,
            });
          }
        }).catch((error) => {
          console.error(`Failed to process image variants for ${saveResult.storageKey}:`, error);
        });
      }

      set.status = 201;
      return createResponse(formatMediaResponse(media));
    },
    {
      body: t.Object({
        file: t.File(),
      }),
      detail: {
        tags: ['admin', 'media'],
        summary: 'Upload media file',
        description:
          'Uploads a file and creates a media record. Generates WebP variants for images asynchronously.',
      },
    }
  )
  .get(
    '/',
    async ({ query, db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const limit = Number(query.limit ?? 20);
      const offset = Number(query.offset ?? 0);
      const mimeType = query.mimeType;

      const options = {
        limit,
        offset,
        mimeType,
      };

      const mediaList = await listMedia(db, options);
      const total = await countMedia(db, options);

      const formattedList = mediaList.map(formatMediaResponse);

      return createPaginatedResponse(formattedList, total, offset, limit);
    },
    {
      query: MediaQuerySchema,
      detail: {
        tags: ['admin', 'media'],
        summary: 'List media files',
        description: 'Returns a paginated list of media files with optional MIME type filter.',
      },
    }
  )
  .get(
    '/trash',
    async ({ query, db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const limit = Number(query.limit ?? 20);
      const offset = Number(query.offset ?? 0);
      const mimeType = query.mimeType;

      const options = {
        limit,
        offset,
        mimeType,
      };

      const mediaList = await listDeletedMedia(db, options);
      const total = await countDeletedMedia(db, options);

      const formattedList = mediaList.map(formatMediaResponse);

      return createPaginatedResponse(formattedList, total, offset, limit);
    },
    {
      query: MediaQuerySchema,
      detail: {
        tags: ['admin', 'media'],
        summary: 'List trashed media files',
        description: 'Returns a paginated list of soft-deleted media files.',
      },
    }
  )
  .get(
    '/:id',
    async ({ params, db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const id = parseInt(params.id, 10);
      const media = await getMediaById(db, id);

      if (!media) {
        throw new NotFoundError('Media not found');
      }

      return createResponse(formatMediaResponse(media));
    },
    {
      params: MediaIdParamSchema,
      detail: {
        tags: ['admin', 'media'],
        summary: 'Get media by ID',
        description: 'Returns a single media file with all variant URLs.',
      },
    }
  )
  .put(
    '/:id',
    async ({ params, body, db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const id = parseInt(params.id, 10);

      const media = await updateMediaAltText(db, id, body.altText ?? null);

      if (!media) {
        throw new NotFoundError('Media not found');
      }

      return createResponse(formatMediaResponse(media));
    },
    {
      params: MediaIdParamSchema,
      body: UpdateMediaBodySchema,
      detail: {
        tags: ['admin', 'media'],
        summary: 'Update media alt text',
        description: 'Updates the alt text for a media file.',
      },
    }
  )
  .post(
    '/:id/restore',
    async ({ params, db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const id = parseInt(params.id, 10);

      const media = await restoreMedia(db, id);

      if (!media) {
        throw new NotFoundError('Media not found or not in trash');
      }

      return createResponse({
        message: 'Media restored',
        ...formatMediaResponse(media),
      });
    },
    {
      params: MediaIdParamSchema,
      detail: {
        tags: ['admin', 'media'],
        summary: 'Restore media from trash',
        description: 'Restores a soft-deleted media file by clearing the deletedAt timestamp.',
      },
    }
  )
  .delete(
    '/:id',
    async ({ params, db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const id = parseInt(params.id, 10);

      const media = await softDeleteMedia(db, id);

      if (!media) {
        throw new NotFoundError('Media not found');
      }

      return createResponse({
        message: 'Media deleted',
        id: media.id,
        deletedAt: media.deletedAt?.toISOString(),
      });
    },
    {
      params: MediaIdParamSchema,
      detail: {
        tags: ['admin', 'media'],
        summary: 'Soft delete media',
        description:
          'Marks a media file as deleted. Files are permanently removed after 30 days.',
      },
    }
  )
  .delete(
    '/:id/permanent',
    async ({ params, db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const id = parseInt(params.id, 10);

      // Get media including deleted to verify it exists and is in trash
      const media = await getMediaById(db, id, true);

      if (!media) {
        throw new NotFoundError('Media not found');
      }

      if (!media.deletedAt) {
        throw new ValidationError('Media must be in trash before permanent deletion');
      }

      // Get storage configuration
      const storageConfig = getStorageConfigFromAppConfig();

      // Delete files from storage (original + variants)
      await deleteFile(media.storageKey, storageConfig, true);

      // Delete database record
      const deleted = await permanentlyDeleteMedia(db, id);

      if (!deleted) {
        throw new NotFoundError('Media not found');
      }

      return createResponse({
        message: 'Media permanently deleted',
        id,
      });
    },
    {
      params: MediaIdParamSchema,
      detail: {
        tags: ['admin', 'media'],
        summary: 'Permanently delete media',
        description:
          'Permanently removes a media file and its variants from the filesystem and database. Item must be in trash first.',
      },
    }
  );
