/**
 * Database Infrastructure Tests
 *
 * Tests for database connection, SQLite pragmas, and Drizzle ORM integration.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { Database } from 'bun:sqlite';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB_PATH = './test-infrastructure.db';

describe('Database Infrastructure', () => {
  afterAll(() => {
    // Clean up test database files
    if (existsSync(TEST_DB_PATH)) {
      unlinkSync(TEST_DB_PATH);
    }
    if (existsSync(`${TEST_DB_PATH}-wal`)) {
      unlinkSync(`${TEST_DB_PATH}-wal`);
    }
    if (existsSync(`${TEST_DB_PATH}-shm`)) {
      unlinkSync(`${TEST_DB_PATH}-shm`);
    }
  });

  test('database connection initializes with bun:sqlite', () => {
    const sqlite = new Database(TEST_DB_PATH);

    expect(sqlite).toBeDefined();
    expect(sqlite.filename).toBe(TEST_DB_PATH);

    sqlite.close();
  });

  test('SQLite pragmas are applied correctly', () => {
    const sqlite = new Database(TEST_DB_PATH);

    // Apply pragmas
    sqlite.exec('PRAGMA journal_mode = WAL');
    sqlite.exec('PRAGMA foreign_keys = ON');
    sqlite.exec('PRAGMA synchronous = NORMAL');

    // Verify pragmas
    const journalMode = sqlite.query('PRAGMA journal_mode').get() as { journal_mode: string };
    expect(journalMode.journal_mode).toBe('wal');

    const foreignKeys = sqlite.query('PRAGMA foreign_keys').get() as { foreign_keys: number };
    expect(foreignKeys.foreign_keys).toBe(1);

    const synchronous = sqlite.query('PRAGMA synchronous').get() as { synchronous: number };
    expect(synchronous.synchronous).toBe(1); // NORMAL = 1

    sqlite.close();
  });

  test('database file is created in expected location', () => {
    const sqlite = new Database(TEST_DB_PATH);

    // Write something to force file creation
    sqlite.exec('CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY)');

    expect(existsSync(TEST_DB_PATH)).toBe(true);

    sqlite.close();
  });

  test('Drizzle wrapper integrates with bun:sqlite driver', async () => {
    const { drizzle } = await import('drizzle-orm/bun-sqlite');

    const sqlite = new Database(TEST_DB_PATH);
    const db = drizzle(sqlite);

    expect(db).toBeDefined();
    expect(typeof db.select).toBe('function');
    expect(typeof db.insert).toBe('function');
    expect(typeof db.update).toBe('function');
    expect(typeof db.delete).toBe('function');

    sqlite.close();
  });
});
