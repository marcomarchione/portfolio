/**
 * Plugin Tests
 *
 * Tests database injection and Swagger documentation plugins.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Elysia } from 'elysia';
import { createDatabasePlugin } from '../plugins/database';
import { createSwaggerPlugin } from '../plugins/swagger';
import { createTestDatabase, closeDatabase } from '../../db/test-utils';
import type { Database } from 'bun:sqlite';

describe('Database Plugin', () => {
  let sqlite: Database;
  let db: ReturnType<typeof createTestDatabase>['db'];

  beforeAll(() => {
    const testDb = createTestDatabase();
    sqlite = testDb.sqlite;
    db = testDb.db;
  });

  afterAll(() => {
    closeDatabase(sqlite);
  });

  test('injects db into route context', async () => {
    const app = new Elysia()
      .use(createDatabasePlugin(db))
      .get('/test-db', ({ db }) => {
        // Verify db is available and has query methods
        return {
          hasSelect: typeof db.select === 'function',
          hasInsert: typeof db.insert === 'function',
        };
      });

    const response = await app.handle(new Request('http://localhost/test-db'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.hasSelect).toBe(true);
    expect(body.hasInsert).toBe(true);
  });
});

describe('Swagger Plugin', () => {
  test('Swagger UI is available at /api/docs in development', async () => {
    const app = new Elysia().use(createSwaggerPlugin(true)).get('/test', () => 'ok');

    const response = await app.handle(new Request('http://localhost/api/docs'));

    // Swagger should return HTML
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toContain('html');
  });

  test('Swagger JSON is available at /api/docs/json in development', async () => {
    const app = new Elysia()
      .use(createSwaggerPlugin(true))
      .get('/api/v1/health', () => ({ status: 'ok' }));

    const response = await app.handle(new Request('http://localhost/api/docs/json'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.openapi).toBeDefined();
    expect(body.info).toBeDefined();
    expect(body.info.title).toBe('Marco Marchione API');
  });

  test('Swagger endpoints return 404 in production mode', async () => {
    // Use disabled swagger plugin (simulating production)
    const app = new Elysia()
      .use(createSwaggerPlugin(false))
      .get('/api/v1/health', () => ({ status: 'ok' }));

    // /api/docs should 404
    const docsResponse = await app.handle(new Request('http://localhost/api/docs'));
    expect(docsResponse.status).toBe(404);

    // /api/docs/json should 404
    const jsonResponse = await app.handle(new Request('http://localhost/api/docs/json'));
    expect(jsonResponse.status).toBe(404);
  });
});
