/**
 * JWT Token Management Tests
 *
 * Tests for token generation and verification utilities.
 */
import { describe, test, expect } from 'bun:test';
import { Elysia } from 'elysia';
import jwt from '@elysiajs/jwt';
import {
  createJwtPlugin,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type JwtContext,
} from '../auth/jwt';

const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long';

/**
 * Creates a test app with JWT plugin and runs a handler to get jwt context.
 */
async function getJwtContext(): Promise<JwtContext> {
  const app = new Elysia().use(jwt({ name: 'jwt', secret: TEST_SECRET }));

  let jwtContext: JwtContext | null = null;

  // Create a route to extract the jwt context
  app.get('/test', ({ jwt }) => {
    jwtContext = { jwt } as JwtContext;
    return 'ok';
  });

  // Make a request to trigger the route
  await app.handle(new Request('http://localhost/test'));

  if (!jwtContext) {
    throw new Error('Failed to get JWT context');
  }

  return jwtContext;
}

describe('JWT Token Management', () => {
  test('access token generation creates correct payload structure', async () => {
    const jwtContext = await getJwtContext();

    const token = await generateAccessToken(jwtContext, '15m');

    // Verify the token
    const payload = await jwtContext.jwt.verify(token);

    expect(payload).toBeTruthy();
    expect(payload).toHaveProperty('sub', 'admin');
    expect(payload).toHaveProperty('type', 'access');
    expect(payload).toHaveProperty('iat');
    expect(payload).toHaveProperty('exp');

    // Check expiry is approximately 15 minutes from now
    const now = Math.floor(Date.now() / 1000);
    const expectedExpiry = now + 15 * 60;
    expect((payload as { exp: number }).exp).toBeGreaterThanOrEqual(expectedExpiry - 5);
    expect((payload as { exp: number }).exp).toBeLessThanOrEqual(expectedExpiry + 5);
  });

  test('refresh token generation creates correct payload structure', async () => {
    const jwtContext = await getJwtContext();

    const token = await generateRefreshToken(jwtContext, '7d');

    const payload = await jwtContext.jwt.verify(token);

    expect(payload).toBeTruthy();
    expect(payload).toHaveProperty('sub', 'admin');
    expect(payload).toHaveProperty('type', 'refresh');
    expect(payload).toHaveProperty('iat');
    expect(payload).toHaveProperty('exp');

    // Check expiry is approximately 7 days from now
    const now = Math.floor(Date.now() / 1000);
    const expectedExpiry = now + 7 * 24 * 60 * 60;
    expect((payload as { exp: number }).exp).toBeGreaterThanOrEqual(expectedExpiry - 5);
    expect((payload as { exp: number }).exp).toBeLessThanOrEqual(expectedExpiry + 5);
  });

  test('access token verification accepts valid token', async () => {
    const jwtContext = await getJwtContext();

    const token = await generateAccessToken(jwtContext, '15m');
    const payload = await verifyAccessToken(jwtContext, token);

    expect(payload).toBeTruthy();
    expect(payload?.sub).toBe('admin');
    expect(payload?.type).toBe('access');
  });

  test('token verification fails for expired token', async () => {
    const jwtContext = await getJwtContext();

    // Generate a token that's already expired (1 second ago)
    const now = Math.floor(Date.now() / 1000);
    const expiredToken = await jwtContext.jwt.sign({
      sub: 'admin',
      type: 'access',
      iat: now - 100,
      exp: now - 1, // Expired 1 second ago
    });

    const payload = await verifyAccessToken(jwtContext, expiredToken);

    expect(payload).toBeNull();
  });

  test('token verification fails for invalid signature', async () => {
    // Create two different JWT contexts with different secrets
    const app1: any = new Elysia().use(jwt({ name: 'jwt', secret: TEST_SECRET }));
    const app2: any = new Elysia().use(jwt({ name: 'jwt', secret: 'different-secret-also-at-least-32-chars' }));

    let jwt1: any = null;
    let jwt2: any = null;

    app1.get('/test', ({ jwt }: any) => {
      jwt1 = jwt;
      return 'ok';
    });
    app2.get('/test', ({ jwt }: any) => {
      jwt2 = jwt;
      return 'ok';
    });

    await app1.handle(new Request('http://localhost/test'));
    await app2.handle(new Request('http://localhost/test'));

    if (!jwt1 || !jwt2) {
      throw new Error('Failed to get JWT contexts');
    }

    // Generate token with first secret
    const now = Math.floor(Date.now() / 1000);
    const token = await jwt1.sign({
      sub: 'admin',
      type: 'access',
      iat: now,
      exp: now + 900,
    });

    // Try to verify with second secret (different)
    const payload = await verifyAccessToken({ jwt: jwt2 }, token);

    expect(payload).toBeNull();
  });
});
