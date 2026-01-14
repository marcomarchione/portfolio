/**
 * Database Connection Module
 *
 * Initializes PostgreSQL database with Drizzle ORM using postgres.js driver.
 */
import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

/** Type alias for the Drizzle database instance */
export type DrizzleDB = PostgresJsDatabase<typeof schema>;

/** Default database URL */
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://portfolio:portfolio_dev@localhost:5432/portfolio';

/**
 * Creates and configures a PostgreSQL database connection.
 *
 * @param connectionString - PostgreSQL connection URL
 * @returns Configured Drizzle database instance
 */
export function createDatabase(connectionString: string = DATABASE_URL): DrizzleDB {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}

/**
 * Creates a database connection for testing purposes.
 * Uses a separate test database or the provided connection string.
 *
 * @param connectionString - PostgreSQL connection URL for testing
 * @returns Configured Drizzle database instance
 */
export function createTestDatabase(connectionString?: string): DrizzleDB {
  const testUrl = connectionString ?? process.env.TEST_DATABASE_URL ?? DATABASE_URL;
  const client = postgres(testUrl);
  return drizzle(client, { schema });
}

/**
 * Gets a raw postgres.js client for direct SQL execution.
 * Useful for running raw SQL queries or migrations.
 *
 * @param connectionString - PostgreSQL connection URL
 * @returns postgres.js client instance
 */
export function getRawConnection(connectionString: string = DATABASE_URL) {
  return postgres(connectionString);
}

// Default database instance for application use
export const db = createDatabase();

// Re-export schema for convenience
export * from './schema';
