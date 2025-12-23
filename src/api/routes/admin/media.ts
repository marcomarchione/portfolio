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
  countMedia,
  updateMediaAltText,
  updateMediaVariants,
  softDeleteMedia,
} from '../../../db/queries';
import {
  validateFileType,
  validateFileSize,
  getMaxFileSize,
  getAllowedMimeTypes,
  saveFile,
  processImage,
  getPublicUrl,
  getFilePath,
  isRasterImage,
} from '../../../services/media';
import { config } from '../../config';
import type { Media, MediaVariants } from '../../../db/schema';

/**
 * Formats a media record for API response.
 */
function formatMediaResponse(media: Media) {
  const response: Record<string, unknown> = {
    id: media.id,
    filename: media.filename,
    mimeType: media.mimeType,
    size: media.size,
    storageKey: media.storageKey,
    url: getPublicUrl(media.storageKey),
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
            url: getPublicUrl(variant.path),
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
export const adminMediaRoutes = new Elysia({ name: 'admin-media', prefix: '/media' })
  .use(authMiddleware)
  .post(
    '/',
    async ({ body, db, set }) => {
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

      // Save file to disk
      const saveResult = await saveFile(file, config.UPLOADS_PATH);

      // Insert media record
      const media = insertMedia(db, {
        filename: saveResult.filename,
        mimeType: saveResult.mimeType,
        size: saveResult.size,
        storageKey: saveResult.storageKey,
        createdAt: new Date(),
      });

      // Process image variants asynchronously (fire-and-forget)
      if (isRasterImage(file.type)) {
        processImage(
          saveResult.filePath,
          config.UPLOADS_PATH,
          saveResult.storageKey,
          saveResult.mimeType
        ).then((result) => {
          // Update media record with variants and dimensions
          if (result.width > 0 && Object.keys(result.variants).length > 0) {
            updateMediaVariants(db, media.id, {
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
    async ({ query, db }) => {
      const limit = query.limit ?? 20;
      const offset = query.offset ?? 0;
      const mimeType = query.mimeType;

      const options = {
        limit,
        offset,
        mimeType,
      };

      const mediaList = listMedia(db, options);
      const total = countMedia(db, options);

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
    '/:id',
    async ({ params, db }) => {
      const id = parseInt(params.id, 10);
      const media = getMediaById(db, id);

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
    async ({ params, body, db }) => {
      const id = parseInt(params.id, 10);

      const media = updateMediaAltText(db, id, body.altText ?? null);

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
  .delete(
    '/:id',
    async ({ params, db }) => {
      const id = parseInt(params.id, 10);

      const media = softDeleteMedia(db, id);

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
  );
