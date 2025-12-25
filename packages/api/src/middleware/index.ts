/**
 * Middleware Barrel Export
 *
 * Exports all middleware plugins for use in the main application.
 *
 * Usage:
 * ```typescript
 * import { errorHandler, corsMiddleware, authMiddleware } from './middleware';
 *
 * const app = new Elysia()
 *   .use(errorHandler)
 *   .use(corsMiddleware);
 *
 * // For protected routes:
 * const protectedApp = new Elysia()
 *   .use(authMiddleware)
 *   .get('/admin/data', ({ admin }) => `Hello ${admin.sub}`);
 * ```
 */

export { errorHandler } from './error-handler';
export { corsMiddleware, createCorsMiddleware } from './cors';
export { authMiddleware, createAuthMiddleware } from './auth';
