/**
 * Public Technologies Routes
 *
 * Read-only endpoint for technologies.
 * No authentication required.
 */
import { Elysia } from 'elysia';
import { createResponse } from '../../types/responses';
import { listTechnologies } from '../../../db/queries';

/**
 * Public technologies routes plugin.
 */
export const publicTechnologiesRoutes = new Elysia({
  name: 'public-technologies',
  prefix: '/technologies',
}).get(
  '/',
  async ({ db }) => {
    const technologies = listTechnologies(db);
    return createResponse(technologies);
  },
  {
    detail: {
      tags: ['technologies'],
      summary: 'List all technologies',
      description: 'Returns all technologies. No pagination required as the list is small.',
    },
  }
);
