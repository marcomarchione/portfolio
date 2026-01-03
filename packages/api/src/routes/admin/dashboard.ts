/**
 * Admin Dashboard Routes
 *
 * Endpoints for dashboard statistics and recent items.
 * All routes require valid JWT access token.
 */
import { Elysia, t } from 'elysia';
import { createResponse } from '../../types/responses';
import { authMiddleware } from '../../middleware/auth';
import { getContentStatistics, getRecentItems } from '../../db/queries/dashboard';
import type { DrizzleDB } from '../../db';

/**
 * Admin dashboard routes plugin.
 */
export const adminDashboardRoutes: any = new Elysia({ name: 'admin-dashboard', prefix: '/dashboard' })
  .use(authMiddleware)
  .get(
    '/stats',
    async ({ db: rawDb }) => {
      const db = rawDb as DrizzleDB;
      const stats = getContentStatistics(db);

      return createResponse(stats);
    },
    {
      detail: {
        tags: ['admin', 'dashboard'],
        summary: 'Get content statistics',
        description:
          'Returns counts for all content types grouped by status (draft, published, archived).',
      },
    }
  )
  .get(
    '/recent',
    async ({ db: rawDb, query }) => {
      const db = rawDb as DrizzleDB;
      const limit = query.limit ?? 10;
      const recentItems = getRecentItems(db, limit);

      // Format dates for API response
      const formattedItems = recentItems.map((item) => ({
        ...item,
        updatedAt: item.updatedAt.toISOString(),
      }));

      return createResponse(formattedItems);
    },
    {
      query: t.Object({
        limit: t.Optional(
          t.Integer({
            minimum: 1,
            maximum: 50,
            default: 10,
            description: 'Number of recent items to return (1-50)',
          })
        ),
      }),
      detail: {
        tags: ['admin', 'dashboard'],
        summary: 'Get recent items',
        description:
          'Returns the most recently updated content items across all types with Italian title.',
      },
    }
  );
