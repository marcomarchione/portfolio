/**
 * Admin Technologies Routes
 *
 * CRUD endpoints for technologies with authentication.
 * All routes require valid JWT access token.
 */
import { Elysia } from 'elysia';
import { createResponse } from '../../types/responses';
import { NotFoundError, ApiError } from '../../types/errors';
import { authMiddleware } from '../../middleware/auth';
import {
  AdminIdParamSchema,
  CreateTechnologyBodySchema,
  UpdateTechnologyBodySchema,
} from '../../types/content-schemas';
import {
  listTechnologies,
  getTechnologyById,
  createTechnology,
  updateTechnology,
  deleteTechnology,
  isTechnologyReferenced,
} from '../../db/queries';

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
 * Formats a technology for API response.
 */
function formatTechnologyResponse(technology: ReturnType<typeof getTechnologyById>) {
  if (!technology) return null;
  return {
    id: technology.id,
    name: technology.name,
    icon: technology.icon,
    color: technology.color,
  };
}

/**
 * Admin technologies routes plugin.
 */
export const adminTechnologiesRoutes = new Elysia({ name: 'admin-technologies', prefix: '/technologies' })
  .use(authMiddleware)
  .get(
    '/',
    async ({ db }) => {
      const technologies = listTechnologies(db);
      return createResponse(technologies.map(formatTechnologyResponse).filter(Boolean));
    },
    {
      detail: {
        tags: ['admin', 'technologies'],
        summary: 'List all technologies (admin)',
        description: 'Returns all technologies.',
      },
    }
  )
  .get(
    '/:id',
    async ({ params, db }) => {
      const id = parseInt(params.id, 10);
      const technology = getTechnologyById(db, id);

      if (!technology) {
        throw new NotFoundError('Technology not found');
      }

      return createResponse(formatTechnologyResponse(technology));
    },
    {
      params: AdminIdParamSchema,
      detail: {
        tags: ['admin', 'technologies'],
        summary: 'Get technology by ID',
        description: 'Returns a single technology.',
      },
    }
  )
  .post(
    '/',
    async ({ body, db, set }) => {
      const technology = createTechnology(db, {
        name: body.name,
        icon: body.icon,
        color: body.color,
      });

      set.status = 201;
      return createResponse(formatTechnologyResponse(technology));
    },
    {
      body: CreateTechnologyBodySchema,
      detail: {
        tags: ['admin', 'technologies'],
        summary: 'Create technology',
        description: 'Creates a new technology.',
      },
    }
  )
  .put(
    '/:id',
    async ({ params, body, db }) => {
      const id = parseInt(params.id, 10);

      const technology = updateTechnology(db, id, {
        name: body.name,
        icon: body.icon,
        color: body.color,
      });

      if (!technology) {
        throw new NotFoundError('Technology not found');
      }

      return createResponse(formatTechnologyResponse(technology));
    },
    {
      params: AdminIdParamSchema,
      body: UpdateTechnologyBodySchema,
      detail: {
        tags: ['admin', 'technologies'],
        summary: 'Update technology',
        description: 'Updates a technology.',
      },
    }
  )
  .delete(
    '/:id',
    async ({ params, db }) => {
      const id = parseInt(params.id, 10);

      // Check if technology exists
      const technology = getTechnologyById(db, id);
      if (!technology) {
        throw new NotFoundError('Technology not found');
      }

      // Check if referenced
      if (isTechnologyReferenced(db, id)) {
        throw new ConflictError('Technology is referenced by one or more projects', {
          technologyId: id,
        });
      }

      // Delete
      deleteTechnology(db, id);

      return createResponse({ message: 'Technology deleted successfully', id });
    },
    {
      params: AdminIdParamSchema,
      detail: {
        tags: ['admin', 'technologies'],
        summary: 'Delete technology',
        description:
          'Hard deletes a technology. Returns 409 Conflict if referenced by any projects.',
      },
    }
  );
