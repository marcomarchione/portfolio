/**
 * Route Aggregation
 *
 * Aggregates all API routes under the /api/v1 prefix.
 */
import { Elysia } from 'elysia';
import { healthRoutes } from './health';
import { authRoutes } from './auth';
import { publicRoutes } from './public';
import { adminRoutes } from './admin';

/**
 * API routes plugin.
 * Groups all routes under /api/v1 prefix.
 *
 * Current routes:
 * - GET /api/v1/health - Health check endpoint
 * - POST /api/v1/auth/login - Login with admin credentials
 * - POST /api/v1/auth/refresh - Refresh access token
 * - POST /api/v1/auth/logout - Logout (client-side only)
 *
 * Public content routes:
 * - GET /api/v1/projects - List published projects
 * - GET /api/v1/projects/:slug - Get project by slug
 * - GET /api/v1/materials - List published materials
 * - GET /api/v1/materials/:slug - Get material by slug
 * - GET /api/v1/news - List published news
 * - GET /api/v1/news/:slug - Get news by slug
 * - GET /api/v1/technologies - List all technologies
 *
 * Admin routes (authenticated):
 * - /api/v1/admin/projects - CRUD for projects
 * - /api/v1/admin/materials - CRUD for materials
 * - /api/v1/admin/news - CRUD for news
 * - /api/v1/admin/technologies - CRUD for technologies
 * - /api/v1/admin/tags - CRUD for tags
 */
export const apiRoutes = new Elysia({ name: 'api-routes', prefix: '/api/v1' })
  .use(healthRoutes)
  .use(authRoutes)
  .use(publicRoutes)
  .use(adminRoutes);
