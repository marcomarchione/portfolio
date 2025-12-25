/**
 * Middleware Tests
 *
 * Tests error handler and CORS middleware functionality.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { Elysia } from 'elysia';
import { errorHandler } from '../middleware/error-handler';
import { createCorsMiddleware } from '../middleware/cors';
import { ValidationError, NotFoundError, InternalError } from '../types/errors';

describe('Error Handler Middleware', () => {
  test('catches ValidationError and returns 400 with structured response', async () => {
    const app = new Elysia()
      .use(errorHandler)
      .get('/test-validation', () => {
        throw new ValidationError('Invalid input data', {
          field: 'email',
          reason: 'Invalid email format',
        });
      });

    const response = await app.handle(new Request('http://localhost/test-validation'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toBe('Invalid input data');
    expect(body.details).toEqual({
      field: 'email',
      reason: 'Invalid email format',
    });
    expect(body.timestamp).toBeDefined();
    expect(body.path).toBe('/test-validation');
  });

  test('catches NotFoundError and returns 404 with structured response', async () => {
    const app = new Elysia()
      .use(errorHandler)
      .get('/test-notfound', () => {
        throw new NotFoundError('Project not found', { slug: 'unknown-project' });
      });

    const response = await app.handle(new Request('http://localhost/test-notfound'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('NOT_FOUND');
    expect(body.message).toBe('Project not found');
    expect(body.details).toEqual({ slug: 'unknown-project' });
    expect(body.timestamp).toBeDefined();
    expect(body.path).toBe('/test-notfound');
  });

  test('catches unknown errors and returns 500 with InternalError format', async () => {
    const app = new Elysia()
      .use(errorHandler)
      .get('/test-unknown', () => {
        throw new Error('Something went terribly wrong');
      });

    const response = await app.handle(new Request('http://localhost/test-unknown'));
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).toBe('Something went terribly wrong');
    expect(body.timestamp).toBeDefined();
    expect(body.path).toBe('/test-unknown');
  });
});

describe('CORS Middleware', () => {
  test('allows requests from marcomarchione.it origin', async () => {
    const app = new Elysia()
      .use(createCorsMiddleware(['https://marcomarchione.it']))
      .get('/test-cors', () => ({ message: 'ok' }));

    const request = new Request('http://localhost/test-cors', {
      headers: {
        Origin: 'https://marcomarchione.it',
      },
    });

    const response = await app.handle(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://marcomarchione.it'
    );
    expect(response.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  test('allows requests from localhost with any port', async () => {
    const app = new Elysia()
      .use(createCorsMiddleware(['https://marcomarchione.it']))
      .get('/test-cors', () => ({ message: 'ok' }));

    // Test localhost:3000
    const request3000 = new Request('http://localhost/test-cors', {
      headers: {
        Origin: 'http://localhost:3000',
      },
    });

    const response3000 = await app.handle(request3000);
    expect(response3000.status).toBe(200);
    expect(response3000.headers.get('Access-Control-Allow-Origin')).toBe(
      'http://localhost:3000'
    );

    // Test localhost:4321 (Astro default port)
    const request4321 = new Request('http://localhost/test-cors', {
      headers: {
        Origin: 'http://localhost:4321',
      },
    });

    const response4321 = await app.handle(request4321);
    expect(response4321.status).toBe(200);
    expect(response4321.headers.get('Access-Control-Allow-Origin')).toBe(
      'http://localhost:4321'
    );
  });
});
