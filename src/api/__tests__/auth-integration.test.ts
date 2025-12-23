/**
 * Authentication Integration Tests
 *
 * End-to-end tests for the complete authentication flow.
 * Tests login, token usage, refresh, and protected route access.
 */
import { describe, test, expect, beforeAll, afterEach } from 'bun:test';
import { Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';
import { createAuthRoutes } from '../routes/auth';
import { createAuthMiddleware } from '../middleware/auth';
import { errorHandler } from '../middleware/error-handler';
import { generateTestToken, TEST_JWT_SECRET } from '../test-utils';

const TEST_PASSWORD = 'integration-test-password';
let TEST_PASSWORD_HASH: string;

// Generate password hash before tests
beforeAll(async () => {
  TEST_PASSWORD_HASH = await Bun.password.hash(TEST_PASSWORD);
});

/**
 * Creates a complete test app with auth routes and protected routes.
 */
function createFullAuthApp() {
  return new Elysia()
    .use(errorHandler)
    .use(createAuthRoutes(TEST_JWT_SECRET, TEST_PASSWORD_HASH))
    .group('/admin', (app) =>
      app.use(createAuthMiddleware(TEST_JWT_SECRET)).get('/profile', ({ admin }) => ({
        message: `Welcome ${admin.sub}`,
        role: 'admin',
      }))
    );
}

describe('Authentication Integration', () => {
  test('full login -> use token -> access protected route flow', async () => {
    const app = createFullAuthApp();

    // Step 1: Login
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

    expect(loginResponse.status).toBe(200);
    const loginBody = await loginResponse.json();
    expect(loginBody.data).toHaveProperty('accessToken');
    expect(loginBody.data).toHaveProperty('refreshToken');

    const { accessToken } = loginBody.data;

    // Step 2: Access protected route with token
    const protectedResponse = await app.handle(
      new Request('http://localhost/admin/profile', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    );

    expect(protectedResponse.status).toBe(200);
    const protectedBody = await protectedResponse.json();
    expect(protectedBody.message).toBe('Welcome admin');
    expect(protectedBody.role).toBe('admin');
  });

  test('token expiry -> refresh -> continue session flow', async () => {
    const app = createFullAuthApp();

    // Step 1: Login to get tokens
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

    expect(loginResponse.status).toBe(200);
    const loginBody = await loginResponse.json();
    const { refreshToken } = loginBody.data;

    // Step 2: Use refresh token to get new access token
    const refreshResponse = await app.handle(
      new Request('http://localhost/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
    );

    expect(refreshResponse.status).toBe(200);
    const refreshBody = await refreshResponse.json();
    expect(refreshBody.data).toHaveProperty('accessToken');
    expect(refreshBody.data.expiresIn).toBe(900);

    const newAccessToken = refreshBody.data.accessToken;

    // Step 3: Use new access token to access protected route
    const protectedResponse = await app.handle(
      new Request('http://localhost/admin/profile', {
        headers: {
          Authorization: `Bearer ${newAccessToken}`,
        },
      })
    );

    expect(protectedResponse.status).toBe(200);
  });

  test('concurrent requests with same token all succeed', async () => {
    const app = createFullAuthApp();

    // Login first
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
    const { accessToken } = loginBody.data;

    // Make multiple concurrent requests
    const requests = Array.from({ length: 5 }, () =>
      app.handle(
        new Request('http://localhost/admin/profile', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      )
    );

    const responses = await Promise.all(requests);

    // All requests should succeed
    for (const response of responses) {
      expect(response.status).toBe(200);
    }
  });

  test('malformed JWT token (corrupted base64) returns 401', async () => {
    const app = createFullAuthApp();

    // Create a malformed token (not valid base64)
    const malformedToken = 'not.a.valid.jwt.token!!!@@@';

    const response = await app.handle(
      new Request('http://localhost/admin/profile', {
        headers: {
          Authorization: `Bearer ${malformedToken}`,
        },
      })
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('UNAUTHORIZED');
  });

  test('token with tampered payload returns 401', async () => {
    const app = createFullAuthApp();

    // Generate a valid token
    const now = Math.floor(Date.now() / 1000);
    const validToken = await generateTestToken(TEST_JWT_SECRET, {
      sub: 'admin',
      type: 'access',
      iat: now,
      exp: now + 900,
    });

    // Tamper with the payload (change a character in the middle)
    const parts = validToken.split('.');
    const tamperedPayload = parts[1].slice(0, -2) + 'XX'; // Modify end of payload
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const response = await app.handle(
      new Request('http://localhost/admin/profile', {
        headers: {
          Authorization: `Bearer ${tamperedToken}`,
        },
      })
    );

    expect(response.status).toBe(401);
  });

  test('JWT_SECRET exactly 32 characters is valid', async () => {
    // Exactly 32 characters (count them!)
    const exactSecret = 'exactly32chars!12345678901234567';
    expect(exactSecret.length).toBe(32);

    const customApp = new Elysia()
      .use(errorHandler)
      .use(createAuthMiddleware(exactSecret))
      .get('/test', ({ admin }) => ({ message: `Hello ${admin.sub}` }));

    const now = Math.floor(Date.now() / 1000);
    const token = await generateTestToken(exactSecret, {
      sub: 'admin',
      type: 'access',
      iat: now,
      exp: now + 900,
    });

    const response = await customApp.handle(
      new Request('http://localhost/test', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );

    expect(response.status).toBe(200);
  });

  test('error response format is consistent across all auth endpoints', async () => {
    const app = createFullAuthApp();

    // Test login error format
    const loginError = await app.handle(
      new Request('http://localhost/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: 'wrong',
        }),
      })
    );

    const loginErrorBody = await loginError.json();
    expect(loginErrorBody).toHaveProperty('error');
    expect(loginErrorBody).toHaveProperty('message');
    expect(loginErrorBody).toHaveProperty('timestamp');
    expect(loginErrorBody).toHaveProperty('path');

    // Test refresh error format
    const refreshError = await app.handle(
      new Request('http://localhost/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshToken: 'invalid-token',
        }),
      })
    );

    const refreshErrorBody = await refreshError.json();
    expect(refreshErrorBody).toHaveProperty('error');
    expect(refreshErrorBody).toHaveProperty('message');
    expect(refreshErrorBody).toHaveProperty('timestamp');
    expect(refreshErrorBody).toHaveProperty('path');

    // Test protected route error format
    const protectedError = await app.handle(
      new Request('http://localhost/admin/profile')
    );

    const protectedErrorBody = await protectedError.json();
    expect(protectedErrorBody).toHaveProperty('error');
    expect(protectedErrorBody).toHaveProperty('message');
    expect(protectedErrorBody).toHaveProperty('timestamp');
    expect(protectedErrorBody).toHaveProperty('path');
  });

  test('bcrypt password verification works with standard hash format', async () => {
    // Generate hash using Bun.password (argon2id by default)
    const password = 'test-password-123';
    const hash = await Bun.password.hash(password);

    // Verify the hash format starts with expected prefix
    // Bun uses argon2id by default, which starts with $argon2id
    expect(hash.startsWith('$argon2id') || hash.startsWith('$2')).toBe(true);

    // Verify the password
    const isValid = await Bun.password.verify(password, hash);
    expect(isValid).toBe(true);

    // Wrong password should fail
    const isInvalid = await Bun.password.verify('wrong-password', hash);
    expect(isInvalid).toBe(false);
  });
});
