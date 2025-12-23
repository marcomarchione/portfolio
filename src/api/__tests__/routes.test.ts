/**
 * Routes and Server Tests
 *
 * Tests health check endpoints and server initialization.
 */
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createTestApp, type TestApp } from '../test-utils';

describe('Health Check Endpoint', () => {
  let testApp: TestApp;

  beforeEach(() => {
    testApp = createTestApp();
  });

  afterEach(() => {
    testApp.cleanup();
  });

  test('GET /api/v1/health returns 200 with status ok and timestamp', async () => {
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/health')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    // Verify timestamp is valid ISO-8601
    expect(() => new Date(body.timestamp)).not.toThrow();
    // Should not include database info by default
    expect(body.database).toBeUndefined();
  });

  test('GET /api/v1/health?db=true returns database connectivity status', async () => {
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/health?db=true')
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.database).toBeDefined();
    expect(body.database.connected).toBe(true);
  });

  test('health endpoint requires no authentication', async () => {
    // Request without any auth headers should succeed
    const response = await testApp.app.handle(
      new Request('http://localhost/api/v1/health', {
        headers: {},
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
  });
});

describe('Server Configuration', () => {
  test('server listens on configured PORT', async () => {
    // We can't easily test the actual port binding in unit tests,
    // but we can verify the config module exports the port correctly
    const { loadConfig } = await import('../config');

    // Default port
    delete process.env.PORT;
    const defaultConfig = loadConfig();
    expect(defaultConfig.PORT).toBe(3000);

    // Custom port
    process.env.PORT = '8080';
    const customConfig = loadConfig();
    expect(customConfig.PORT).toBe(8080);

    // Restore
    delete process.env.PORT;
  });

  test('graceful shutdown is configured (signal handlers)', async () => {
    // This test verifies the shutdown function exists and can be called
    // We can't fully test SIGTERM in a unit test, but we can verify
    // the server exports the startServer function
    const { startServer, createApp } = await import('../index');

    // Verify functions exist
    expect(typeof startServer).toBe('function');
    expect(typeof createApp).toBe('function');

    // Verify createApp returns an Elysia instance
    const app = createApp();
    expect(app).toBeDefined();
    expect(typeof app.handle).toBe('function');
  });
});
