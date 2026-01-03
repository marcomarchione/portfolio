/**
 * Authentication Routes Tests
 *
 * Tests for login, token refresh, and logout endpoints.
 */
import { describe, test, expect, beforeAll } from 'bun:test';
import { Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';
import { createAuthRoutes } from '../routes/auth';
import { errorHandler } from '../middleware/error-handler';

const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long';
const TEST_PASSWORD = 'test-admin-password';
let TEST_PASSWORD_HASH: string;

// Generate password hash before tests
beforeAll(async () => {
  TEST_PASSWORD_HASH = await Bun.password.hash(TEST_PASSWORD);
});

/**
 * Creates a test app with auth routes.
 */
function createTestApp() {
  return new Elysia()
    .use(errorHandler)
    .use(createAuthRoutes(TEST_SECRET, TEST_PASSWORD_HASH));
}

/**
 * Generates a test token with the given payload.
 */
async function generateTestToken(payload: Record<string, unknown>): Promise<string> {
  const app: any = new Elysia().use(jwt({ name: 'jwt', secret: TEST_SECRET }));

  let token = '';
  app.get('/gen', async ({ jwt: jwtPlugin }: any) => {
    token = await jwtPlugin.sign(payload);
    return 'ok';
  });

  await app.handle(new Request('http://localhost/gen'));
  return token;
}

describe('Authentication Routes', () => {
  test('POST /auth/login with valid credentials returns tokens', async () => {
    const app = createTestApp();

    const response = await app.handle(
      new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: TEST_PASSWORD,
        }),
      })
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data).toHaveProperty('accessToken');
    expect(body.data).toHaveProperty('refreshToken');
    expect(body.data).toHaveProperty('expiresIn');
    expect(typeof body.data.accessToken).toBe('string');
    expect(typeof body.data.refreshToken).toBe('string');
    expect(body.data.expiresIn).toBe(900); // 15 minutes in seconds
  });

  test('POST /auth/login with invalid password returns 401', async () => {
    const app = createTestApp();

    const response = await app.handle(
      new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'wrong-password',
        }),
      })
    );

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('UNAUTHORIZED');
    expect(body.message).toContain('Invalid credentials');
  });

  test('POST /auth/login with invalid username returns 401', async () => {
    const app = createTestApp();

    const response = await app.handle(
      new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'wrong-user',
          password: TEST_PASSWORD,
        }),
      })
    );

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('UNAUTHORIZED');
  });

  test('POST /auth/login validates request body schema', async () => {
    const app = createTestApp();

    // Missing password
    const response1 = await app.handle(
      new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
        }),
      })
    );

    expect(response1.status).toBe(400);

    // Missing username
    const response2 = await app.handle(
      new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: TEST_PASSWORD,
        }),
      })
    );

    expect(response2.status).toBe(400);
  });

  test('POST /auth/refresh with valid refresh token returns new access token', async () => {
    const app = createTestApp();

    // First login to get a refresh token
    const loginResponse = await app.handle(
      new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: TEST_PASSWORD,
        }),
      })
    );

    const loginBody = await loginResponse.json();
    const refreshToken = loginBody.data.refreshToken;

    // Use refresh token to get new access token
    const refreshResponse = await app.handle(
      new Request('http://localhost/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken,
        }),
      })
    );

    expect(refreshResponse.status).toBe(200);

    const refreshBody = await refreshResponse.json();
    expect(refreshBody.data).toHaveProperty('accessToken');
    expect(refreshBody.data).toHaveProperty('expiresIn');
    expect(typeof refreshBody.data.accessToken).toBe('string');
    expect(refreshBody.data.expiresIn).toBe(900);
  });

  test('POST /auth/refresh with expired/invalid token returns 401', async () => {
    const app = createTestApp();
    const now = Math.floor(Date.now() / 1000);

    // Generate expired refresh token
    const expiredToken = await generateTestToken({
      sub: 'admin',
      type: 'refresh',
      iat: now - 1000,
      exp: now - 1, // Expired
    });

    const response = await app.handle(
      new Request('http://localhost/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: expiredToken,
        }),
      })
    );

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('UNAUTHORIZED');
  });

  test('POST /auth/refresh with access token (wrong type) returns 401', async () => {
    const app = createTestApp();
    const now = Math.floor(Date.now() / 1000);

    // Generate access token instead of refresh token
    const accessToken = await generateTestToken({
      sub: 'admin',
      type: 'access', // Wrong type!
      iat: now,
      exp: now + 900,
    });

    const response = await app.handle(
      new Request('http://localhost/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: accessToken,
        }),
      })
    );

    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error).toBe('UNAUTHORIZED');
  });

  test('POST /auth/logout returns success message', async () => {
    const app = createTestApp();

    const response = await app.handle(
      new Request('http://localhost/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data).toHaveProperty('message');
    expect(body.data.message).toBe('Logged out successfully');
  });
});
