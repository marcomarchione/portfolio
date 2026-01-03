/**
 * Database Connection Module
 *
 * Initializes SQLite database with Drizzle ORM using bun:sqlite driver.
 * Applies recommended SQLite pragmas for performance and data integrity.
 */
import { Database } from 'bun:sqlite';
import { drizzle, type BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';

/** Type alias for the Drizzle database instance */
export type DrizzleDB = BunSQLiteDatabase<typeof schema>;

/** Default database file path */
const DATABASE_PATH = process.env.DATABASE_PATH ?? './data.db';

/**
 * Creates and configures a SQLite database connection with optimized pragmas.
 *
 * @param dbPath - Path to the SQLite database file (defaults to ./data.db)
 * @returns Configured Drizzle database instance
 */
export function createDatabase(dbPath: string = DATABASE_PATH) {
  const sqlite = new Database(dbPath);

  // Apply SQLite pragmas for optimal performance and data integrity
  // WAL mode: Better concurrent read performance
  sqlite.exec('PRAGMA journal_mode = WAL');

  // Enable foreign key enforcement
  sqlite.exec('PRAGMA foreign_keys = ON');

  // Balance between safety and speed
  sqlite.exec('PRAGMA synchronous = NORMAL');

  return drizzle(sqlite, { schema });
}

/**
 * Creates an in-memory database for testing purposes.
 * Applies the same pragmas as the file-based database.
 *
 * @returns Configured Drizzle database instance using in-memory SQLite
 */
export function createTestDatabase() {
  const sqlite = new Database(':memory:');

  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec('PRAGMA synchronous = NORMAL');

  return drizzle(sqlite, { schema });
}

/**
 * Gets the raw SQLite connection from a Drizzle database instance.
 * Useful for running raw SQL queries or checking pragmas.
 */
export function getRawConnection(dbPath: string = DATABASE_PATH): Database {
  const sqlite = new Database(dbPath);

  sqlite.exec('PRAGMA journal_mode = WAL');
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec('PRAGMA synchronous = NORMAL');

  return sqlite;
}

// Default database instance for application use
export const db = createDatabase();

// Re-export schema for convenience
export * from './schema';
