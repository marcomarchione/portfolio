/**
 * Media TypeBox Validation Schemas
 *
 * Provides validation schemas for media CRUD operations.
 * Used for request/response validation in media API endpoints.
 */
import { Type, type Static } from '@sinclair/typebox';

/**
 * Media query schema for list endpoint.
 * Extends pagination with optional mimeType filter.
 */
export const MediaQuerySchema = Type.Object({
  limit: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 100,
      default: 20,
      description: 'Number of items per page (1-100)',
    })
  ),
  offset: Type.Optional(
    Type.Integer({
      minimum: 0,
      default: 0,
      description: 'Number of items to skip',
    })
  ),
  mimeType: Type.Optional(
    Type.String({
      description: 'Filter by MIME type (e.g., image/jpeg, application/pdf)',
    })
  ),
});
export type MediaQuery = Static<typeof MediaQuerySchema>;

/**
 * Media ID parameter schema.
 */
export const MediaIdParamSchema = Type.Object({
  id: Type.String({
    pattern: '^[0-9]+$',
    description: 'Media ID',
  }),
});
export type MediaIdParam = Static<typeof MediaIdParamSchema>;

/**
 * Update media body schema.
 * Only altText can be updated.
 */
export const UpdateMediaBodySchema = Type.Object({
  altText: Type.Optional(
    Type.String({
      maxLength: 500,
      description: 'Alt text for accessibility',
    })
  ),
});
export type UpdateMediaBody = Static<typeof UpdateMediaBodySchema>;

/**
 * Media variant schema.
 */
export const MediaVariantSchema = Type.Object({
  path: Type.String({ description: 'Storage path for the variant' }),
  width: Type.Integer({ description: 'Variant width in pixels' }),
  height: Type.Integer({ description: 'Variant height in pixels' }),
  url: Type.Optional(Type.String({ description: 'Public URL for the variant' })),
});
export type MediaVariantType = Static<typeof MediaVariantSchema>;

/**
 * Media variants object schema.
 */
export const MediaVariantsSchema = Type.Object({
  thumb: Type.Optional(MediaVariantSchema),
  medium: Type.Optional(MediaVariantSchema),
  large: Type.Optional(MediaVariantSchema),
});
export type MediaVariantsType = Static<typeof MediaVariantsSchema>;

/**
 * Media response schema for API responses.
 */
export const MediaResponseSchema = Type.Object({
  id: Type.Integer({ description: 'Media ID' }),
  filename: Type.String({ description: 'Original filename' }),
  mimeType: Type.String({ description: 'MIME type' }),
  size: Type.Integer({ description: 'File size in bytes' }),
  storageKey: Type.String({ description: 'Storage key' }),
  url: Type.String({ description: 'Public URL for the file' }),
  altText: Type.Union([Type.String(), Type.Null()], { description: 'Alt text' }),
  width: Type.Union([Type.Integer(), Type.Null()], { description: 'Image width' }),
  height: Type.Union([Type.Integer(), Type.Null()], { description: 'Image height' }),
  createdAt: Type.String({ description: 'ISO-8601 timestamp' }),
  deletedAt: Type.Union([Type.String(), Type.Null()], { description: 'Deletion timestamp' }),
  variants: Type.Optional(MediaVariantsSchema),
});
export type MediaResponse = Static<typeof MediaResponseSchema>;

/**
 * Upload response schema.
 */
export const UploadResponseSchema = Type.Object({
  data: MediaResponseSchema,
});

/**
 * Media list response schema.
 */
export const MediaListResponseSchema = Type.Object({
  data: Type.Array(MediaResponseSchema),
  pagination: Type.Object({
    total: Type.Integer(),
    offset: Type.Integer(),
    limit: Type.Integer(),
    hasMore: Type.Boolean(),
  }),
});
