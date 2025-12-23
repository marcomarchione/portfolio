/**
 * Admin Routes Barrel Export
 *
 * Combines all admin CRUD routes under /admin prefix.
 */
import { Elysia } from 'elysia';
import { adminProjectsRoutes } from './projects';
import { adminMaterialsRoutes } from './materials';
import { adminNewsRoutes } from './news';
import { adminTechnologiesRoutes } from './technologies';
import { adminTagsRoutes } from './tags';
import { adminMediaRoutes } from './media';

/**
 * Admin routes plugin.
 * Groups all admin endpoints under /admin prefix.
 *
 * Endpoints:
 * - /admin/projects - CRUD for projects
 * - /admin/materials - CRUD for materials
 * - /admin/news - CRUD for news
 * - /admin/technologies - CRUD for technologies
 * - /admin/tags - CRUD for tags
 * - /admin/media - Upload and manage media files
 *
 * All routes require valid JWT access token.
 */
export const adminRoutes = new Elysia({ name: 'admin-routes', prefix: '/admin' })
  .use(adminProjectsRoutes)
  .use(adminMaterialsRoutes)
  .use(adminNewsRoutes)
  .use(adminTechnologiesRoutes)
  .use(adminTagsRoutes)
  .use(adminMediaRoutes);
