/**
 * Public Routes Barrel Export
 *
 * Combines all public read-only routes.
 */
import { Elysia } from 'elysia';
import { publicProjectsRoutes } from './projects';
import { publicMaterialsRoutes } from './materials';
import { publicNewsRoutes } from './news';
import { publicTechnologiesRoutes } from './technologies';

/**
 * Public routes plugin.
 * Groups all public endpoints.
 *
 * Endpoints:
 * - GET /projects - List published projects
 * - GET /projects/:slug - Get project by slug
 * - GET /materials - List published materials
 * - GET /materials/:slug - Get material by slug
 * - GET /news - List published news
 * - GET /news/:slug - Get news by slug
 * - GET /technologies - List all technologies
 */
export const publicRoutes = new Elysia({ name: 'public-routes' })
  .use(publicProjectsRoutes)
  .use(publicMaterialsRoutes)
  .use(publicNewsRoutes)
  .use(publicTechnologiesRoutes);
