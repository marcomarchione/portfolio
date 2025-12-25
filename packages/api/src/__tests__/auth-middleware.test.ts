/**
 * Authentication Middleware Tests
 *
 * Tests for auth middleware Bearer token extraction and verification.
 */
import { describe, test, expect } from 'bun:test';
import { Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';
import { createAuthMiddleware } from '../middleware/auth';
import { errorHandler } from '../middleware/error-handler';

const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long';

/**
 * Creates a test app with auth middleware and a protected route.
 */
function createProtectedApp() {
  return new Elysia()
    .use(errorHandler)
    .use(createAuthMiddleware(TEST_SECRET))
    .get('/protected', ({ admin }) => ({ message: `Hello ${admin.sub}` }));
}

/**
 * Generates a test token with the given payload.
 */
async function generateTestToken(payload: Record<string, unknown>): Promise<string> {
  const app = new Elysia().use(jwt({ name: 'jwt', secret: TEST_SECRET }));

  let token = '';
  app.get('/gen', async ({ jwt }) => {
    token = await jwt.sign(payload);
    return 'ok';
  });

  await app.handle(new Request('http://localhost/gen'));
  return token;
}

describe('Authentication Middleware', () => {
  test('request passes with valid access token in Authorization header', async () => {
    const app = createProtectedApp();
    const now = Math.floor(Date.now() / 1000);

    const token = await generateTestToken({
      sub: 'admin',
      type: 'access',
      iat: now,
      exp: now + 900,
    });

    const response = await app.handle(
      new Request('http://localhost/protected', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe('Hello admin');
  });

  test('request fails with missing Authorization header (401)', async () => {
    const app = createProtectedApp();

    const response = await app.handle(new Request('http://localhost/protected'));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('UNAUTHORIZED');
    expect(body.message).toContain('Missing');
  });

  test('request fails with invalid token format (401)', async () => {
    const app = createProtectedApp();

    // Test with invalid format (not Bearer)
    const response1 = await app.handle(
      new Request('http://localhost/protected', {
        headers: {
          Authorization: 'Basic sometoken',
        },
      })
    );

    expect(response1.status).toBe(401);

    // Test with just token (no Bearer prefix)
    const response2 = await app.handle(
      new Request('http://localhost/protected', {
        headers: {
          Authorization: 'sometoken',
        },
      })
    );

    expect(response2.status).toBe(401);
  });

  test('request fails with expired access token (401)', async () => {
    const app = createProtectedApp();
    const now = Math.floor(Date.now() / 1000);

    const token = await generateTestToken({
      sub: 'admin',
      type: 'access',
      iat: now - 1000,
      exp: now - 1, // Expired 1 second ago
    });

    const response = await app.handle(
      new Request('http://localhost/protected', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('UNAUTHORIZED');
  });

  test('request fails with refresh token (wrong token type, 401)', async () => {
    const app = createProtectedApp();
    const now = Math.floor(Date.now() / 1000);

    // Generate a refresh token instead of access token
    const token = await generateTestToken({
      sub: 'admin',
      type: 'refresh', // Wrong type!
      iat: now,
      exp: now + 86400,
    });

    const response = await app.handle(
      new Request('http://localhost/protected', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('UNAUTHORIZED');
    expect(body.message).toContain('Invalid token type');
  });
});
