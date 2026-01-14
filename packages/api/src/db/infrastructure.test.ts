/**
 * Database Infrastructure Tests
 *
 * Tests for database connection and Drizzle ORM integration with PostgreSQL.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { sql } from 'drizzle-orm';
import type postgres from 'postgres';
import { createTestDatabase, closeDatabase } from './test-utils';

describe('Database Infrastructure', () => {
  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof createTestDatabase>['db'];

  beforeAll(() => {
    const testDb = createTestDatabase();
    client = testDb.client;
    db = testDb.db;
  });

  afterAll(async () => {
    await closeDatabase(client);
  });

  test('database connection initializes with postgres.js', () => {
    expect(db).toBeDefined();
    expect(client).toBeDefined();
  });

  test('PostgreSQL version is accessible', async () => {
    const result = await db.execute(sql`SELECT version()`);
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  test('Drizzle wrapper integrates with postgres.js driver', () => {
    expect(db).toBeDefined();
    expect(typeof db.select).toBe('function');
    expect(typeof db.insert).toBe('function');
    expect(typeof db.update).toBe('function');
    expect(typeof db.delete).toBe('function');
  });

  test('can execute raw SQL queries', async () => {
    const result = await db.execute(sql`SELECT 1 + 1 AS sum`);
    expect(result).toBeDefined();
    expect(result[0].sum).toBe(2);
  });

  test('transactions are supported', async () => {
    // This test verifies that transactions work by creating a temp table
    // and rolling back changes
    await db.execute(sql`CREATE TEMP TABLE test_tx (id SERIAL PRIMARY KEY, name TEXT)`);

    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql`INSERT INTO test_tx (name) VALUES ('test')`);
        const result = await tx.execute(sql`SELECT * FROM test_tx`);
        expect(result.length).toBe(1);

        // Force rollback by throwing
        throw new Error('Rollback test');
      });
    } catch (e) {
      // Expected error
    }

    // After rollback, the table should be empty
    const result = await db.execute(sql`SELECT * FROM test_tx`);
    expect(result.length).toBe(0);

    await db.execute(sql`DROP TABLE test_tx`);
  });
});
