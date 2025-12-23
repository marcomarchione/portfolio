/**
 * Swagger/OpenAPI Plugin
 *
 * Configures OpenAPI documentation generation.
 * Only enabled in development mode for security.
 *
 * Access:
 * - Swagger UI: /api/docs
 * - OpenAPI JSON: /api/docs/json
 */
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { isDevelopment } from '../config';

/**
 * OpenAPI documentation configuration.
 */
const swaggerConfig = {
  documentation: {
    info: {
      title: 'Marco Marchione API',
      version: '1.0.0',
      description:
        'Backend API for marcomarchione.it portfolio website. Provides endpoints for content management, project showcases, news articles, and materials.',
      contact: {
        name: 'Marco Marchione',
        url: 'https://marcomarchione.it',
      },
    },
    tags: [
      { name: 'health', description: 'Health check endpoints' },
      { name: 'content', description: 'Content management endpoints' },
      { name: 'projects', description: 'Project showcase endpoints' },
      { name: 'news', description: 'News article endpoints' },
      { name: 'materials', description: 'Downloadable materials endpoints' },
    ],
  },
  path: '/api/docs',
  exclude: ['/api/docs', '/api/docs/json'],
};

/**
 * No-op plugin for production.
 * Returns an empty Elysia instance with zero overhead.
 */
const noOpPlugin = new Elysia({ name: 'swagger-disabled' });

/**
 * Swagger plugin for Elysia.
 * Conditionally enabled only in development mode.
 *
 * In production, returns a no-op plugin for zero overhead.
 */
export const swaggerPlugin = isDevelopment()
  ? new Elysia({ name: 'swagger' }).use(swagger(swaggerConfig))
  : noOpPlugin;

/**
 * Creates a Swagger plugin that can be explicitly enabled or disabled.
 * Useful for testing both modes.
 *
 * @param enabled - Whether to enable Swagger
 * @returns Configured Swagger plugin or no-op
 */
export function createSwaggerPlugin(enabled: boolean) {
  if (enabled) {
    return new Elysia({ name: 'swagger' }).use(swagger(swaggerConfig));
  }
  return noOpPlugin;
}
