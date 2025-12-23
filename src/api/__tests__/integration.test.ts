/**
 * Integration Tests
 *
 * Tests complete request lifecycle and integration between components.
 * Fills coverage gaps identified in Task Group 5.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Elysia, t } from 'elysia';
import { createTestApp, type TestApp } from '../test-utils';
import { errorHandler } from '../middleware/error-handler';
import { createCorsMiddleware } from '../middleware/cors';
import { createDatabasePlugin } from '../plugins/database';
import { createTestDatabase, closeDatabase } from '../../db/test-utils';

describe('Complete Request Lifecycle', () => {
  let testApp: TestApp;

  beforeEach(() => {
    testApp = createTestApp();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  test('TypeBox validation errors produce correct 400 responses', async () => {
    // Create app with TypeBox validated route
    const { sqlite, db } = createTestDatabase();
    const app = new Elysia()
      .use(errorHandler)
      .use(createDatabasePlugin(db))
      .post(
        '/test-validation',
        ({ body }) => ({ received: body }),
        {
          body: t.Object({
            name: t.String({ minLength: 1 }),
            age: t.Number({ minimum: 0 }),
          }),
        }
      );

    // Send invalid request body (missing required fields)
    const response = await app.handle(
      new Request('http://localhost/test-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '', age: -5 }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.path).toBe('/test-validation');
    expect(body.timestamp).toBeDefined();

    closeDatabase(sqlite);
  });

  test('unknown routes return 404 with structured error', async () => {
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/nonexistent-route')
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('NOT_FOUND');
    expect(body.path).toBe('/api/v1/nonexistent-route');
    expect(body.timestamp).toBeDefined();
  });

  test('error response includes correct path and timestamp', async () => {
    const { sqlite, db } = createTestDatabase();
    const app = new Elysia()
      .use(errorHandler)
      .use(createDatabasePlugin(db))
      .get('/api/test/specific-path', () => {
        throw new Error('Test error');
      });

    const beforeTime = new Date();
    const response = await app.handle(
      new Request('http://localhost/api/test/specific-path')
    );
    const afterTime = new Date();

    const body = await response.json();
    expect(body.path).toBe('/api/test/specific-path');

    // Verify timestamp is within request timeframe
    const responseTime = new Date(body.timestamp);
    expect(responseTime >= beforeTime).toBe(true);
    expect(responseTime <= afterTime).toBe(true);

    closeDatabase(sqlite);
  });
});

describe('CORS Preflight Requests', () => {
  test('OPTIONS request returns correct CORS headers', async () => {
    const testApp = createTestApp({
      cors: true,
      corsOrigins: ['https://marcomarchione.it'],
    });

    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/health', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://marcomarchione.it',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type',
        },
      })
    );

    // Preflight should succeed
    expect(response.status).toBe(204);

    // Verify CORS headers
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://marcomarchione.it'
    );
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');

    testApp.cleanup();
  });

  test('CORS rejects requests from unknown origins', async () => {
    const testApp = createTestApp({
      cors: true,
      corsOrigins: ['https://marcomarchione.it'],
    });

    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/health', {
        headers: {
          Origin: 'https://malicious-site.com',
        },
      })
    );

    // Request should still succeed but without CORS headers for that origin
    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    expect(allowOrigin).not.toBe('https://malicious-site.com');

    testApp.cleanup();
  });
});

describe('Health Check Edge Cases', () => {
  test('health endpoint with invalid query params returns validation error', async () => {
    const testApp = createTestApp();

    // Invalid db param value should return 400 (validated as 'true' | 'false')
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/health?db=invalid')
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('VALIDATION_ERROR');

    testApp.cleanup();
  });
});

describe('API Prefix Verification', () => {
  test('all routes are under /api/v1 prefix', async () => {
    const testApp = createTestApp();

    // Health should be at /api/v1/health
    const healthResponse = await testApp.app.handle(
      new Request('http://localhost/api/v1/health')
    );
    expect(healthResponse.status).toBe(200);

    // Root should 404
    const rootResponse = await testApp.app.handle(
      new Request('http://localhost/')
    );
    expect(rootResponse.status).toBe(404);

    // /health without prefix should 404
    const noPrefix = await testApp.app.handle(
      new Request('http://localhost/health')
    );
    expect(noPrefix.status).toBe(404);

    testApp.cleanup();
  });
});
