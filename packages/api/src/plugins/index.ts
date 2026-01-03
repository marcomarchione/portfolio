/**
 * Plugins Barrel Export
 *
 * Exports all Elysia plugins for use in the main application.
 *
 * Usage:
 * ```typescript
 * import { databasePlugin, swaggerPlugin } from './plugins';
 *
 * const app = new Elysia()
 *   .use(databasePlugin)
 *   .use(swaggerPlugin);
 * ```
 *
 * For testing with custom database:
 * ```typescript
 * import { createDatabasePlugin, createSwaggerPlugin } from './plugins';
 * import { createTestDatabase } from '../db/test-utils';
 *
 * const { db } = createTestDatabase();
 * const testApp = new Elysia()
 *   .use(createDatabasePlugin(db))
 *   .use(createSwaggerPlugin(false));
 * ```
 */

export { databasePlugin, createDatabasePlugin, type DatabaseInstance } from './database';
export { swaggerPlugin, createSwaggerPlugin } from './swagger';
export { staticPlugin } from './static';
