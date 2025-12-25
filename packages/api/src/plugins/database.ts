/**
 * Database Plugin
 *
 * Injects the database instance into Elysia route context.
 * Route handlers can access the database via `context.db`.
 *
 * Usage:
 * ```typescript
 * app.use(databasePlugin)
 *    .get('/test', ({ db }) => {
 *      // db is fully typed Drizzle instance
 *    });
 * ```
 *
 * For testing:
 * ```typescript
 * import { createTestDatabase } from '../db/test-utils';
 * const { db } = createTestDatabase();
 * const testApp = createDatabasePlugin(db);
 * ```
 */
import { Elysia } from 'elysia';
import { db as defaultDb } from '../db';
import type { createDatabase } from '../db';

/** Type for the database instance */
export type DatabaseInstance = ReturnType<typeof createDatabase>;

/**
 * Creates a database plugin with a custom database instance.
 * Useful for injecting test databases.
 *
 * @param db - Database instance to inject
 * @returns Elysia plugin that decorates context with db
 */
export function createDatabasePlugin(db: DatabaseInstance) {
  return new Elysia({ name: 'database' }).decorate('db', db);
}

/**
 * Default database plugin using the production database.
 * Injects the database instance from src/db/index.ts.
 */
export const databasePlugin = createDatabasePlugin(defaultDb);
