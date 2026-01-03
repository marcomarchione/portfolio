/**
 * Admin Tags Routes
 *
 * CRUD endpoints for tags with authentication.
 * All routes require valid JWT access token.
 */
import { Elysia } from 'elysia';
import { createResponse } from '../../types/responses';
import { NotFoundError, ApiError } from '../../types/errors';
import { authMiddleware } from '../../middleware/auth';
import {
  AdminIdParamSchema,
  CreateTagBodySchema,
  UpdateTagBodySchema,
} from '../../types/content-schemas';
import {
  listTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  isTagReferenced,
} from '../../db/queries';
import type { DrizzleDB } from '../../db';

/**
 * Conflict error for referential integrity violations.
 */
class ConflictError extends ApiError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 409, 'VALIDATION_ERROR', details);
    this.name = 'ConflictError';
  }
}

/**
 * Formats a tag for API response.
 */
function formatTagResponse(tag: ReturnType<typeof getTagById>) {
  if (!tag) return null;
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
  };
}

/**
 * Admin tags routes plugin.
 */
export const adminTagsRoutes: any = new Elysia({ name: 'admin-tags', prefix: '/tags' })
  .use(authMiddleware)
  .get(
    '/',
    async ({ db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const tags = listTags(db);
      return createResponse(tags.map(formatTagResponse).filter(Boolean));
    },
    {
      detail: {
        tags: ['admin', 'tags'],
        summary: 'List all tags (admin)',
        description: 'Returns all tags.',
      },
    }
  )
  .get(
    '/:id',
    async ({ params, db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const id = parseInt(params.id, 10);
      const tag = getTagById(db, id);

      if (!tag) {
        throw new NotFoundError('Tag not found');
      }

      return createResponse(formatTagResponse(tag));
    },
    {
      params: AdminIdParamSchema,
      detail: {
        tags: ['admin', 'tags'],
        summary: 'Get tag by ID',
        description: 'Returns a single tag.',
      },
    }
  )
  .post(
    '/',
    async ({ body, db: rawDb, set }) => {
      const db = rawDb as DrizzleDB;
      const tag = createTag(db, {
        name: body.name,
        slug: body.slug,
      });

      set.status = 201;
      return createResponse(formatTagResponse(tag));
    },
    {
      body: CreateTagBodySchema,
      detail: {
        tags: ['admin', 'tags'],
        summary: 'Create tag',
        description: 'Creates a new tag.',
      },
    }
  )
  .put(
    '/:id',
    async ({ params, body, db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const id = parseInt(params.id, 10);

      const tag = updateTag(db, id, {
        name: body.name,
        slug: body.slug,
      });

      if (!tag) {
        throw new NotFoundError('Tag not found');
      }

      return createResponse(formatTagResponse(tag));
    },
    {
      params: AdminIdParamSchema,
      body: UpdateTagBodySchema,
      detail: {
        tags: ['admin', 'tags'],
        summary: 'Update tag',
        description: 'Updates a tag.',
      },
    }
  )
  .delete(
    '/:id',
    async ({ params, db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const id = parseInt(params.id, 10);

      // Check if tag exists
      const tag = getTagById(db, id);
      if (!tag) {
        throw new NotFoundError('Tag not found');
      }

      // Check if referenced
      if (isTagReferenced(db, id)) {
        throw new ConflictError('Tag is referenced by one or more news items', {
          tagId: id,
        });
      }

      // Delete
      deleteTag(db, id);

      return createResponse({ message: 'Tag deleted successfully', id });
    },
    {
      params: AdminIdParamSchema,
      detail: {
        tags: ['admin', 'tags'],
        summary: 'Delete tag',
        description:
          'Hard deletes a tag. Returns 409 Conflict if referenced by any news.',
      },
    }
  );
