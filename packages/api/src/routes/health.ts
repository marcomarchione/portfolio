/**
 * Health Check Route
 *
 * Provides health check endpoint for monitoring and deployment verification.
 * No authentication required.
 */
import { Elysia, t } from 'elysia';
import { sql } from 'drizzle-orm';
import type { HealthResponse } from '../types/responses';

/**
 * Health check response schema for OpenAPI documentation.
 */
const HealthResponseSchema = t.Object({
  status: t.Union([t.Literal('ok'), t.Literal('degraded'), t.Literal('error')]),
  timestamp: t.String({ format: 'date-time' }),
  database: t.Optional(
    t.Object({
      connected: t.Boolean(),
      error: t.Optional(t.String()),
    })
  ),
});

/**
 * Health check query parameters schema.
 */
const HealthQuerySchema = t.Object({
  db: t.Optional(t.Union([t.Literal('true'), t.Literal('false')])),
});

/**
 * Health check routes plugin.
 * Provides `/health` endpoint for basic and database health checks.
 */
export const healthRoutes = new Elysia({ name: 'health-routes' }).get(
  '/health',
  async ({ query, db }): Promise<HealthResponse> => {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };

    // Check database connectivity if requested
    if (query.db === 'true') {
      try {
        // Simple query to test database connectivity using Drizzle's sql template
        db.get(sql`SELECT 1 as test`);
        response.database = {
          connected: true,
        };
      } catch (error) {
        response.status = 'degraded';
        response.database = {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown database error',
        };
      }
    }

    return response;
  },
  {
    query: HealthQuerySchema,
    response: HealthResponseSchema,
    detail: {
      tags: ['health'],
      summary: 'Health check endpoint',
      description:
        'Returns the health status of the API. Use ?db=true to include database connectivity check.',
    },
  }
);
