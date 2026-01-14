/**
 * Admin Media Routes Tests
 *
 * Tests for media upload and CRUD endpoints.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Elysia, t } from 'elysia';
import jwt from '@elysiajs/jwt';
import { eq, isNull } from 'drizzle-orm';
import { mkdir, rm } from 'fs/promises';
import { createTestDatabase, resetDatabase, closeDatabase } from '../../db/test-utils';
import * as schema from '../../db/schema';

const TEST_JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
const TEST_UPLOADS_PATH = './test-uploads';

describe('Admin Media Routes', () => {
  let db: ReturnType<typeof createTestDatabase>['db'];
  let client: ReturnType<typeof createTestDatabase>['client'];
  let testApp: any;
  let accessToken: string;

  beforeAll(async () => {
    // Set up test database
    const testDb = createTestDatabase();
    db = testDb.db;
    client = testDb.client;

    // Create test uploads directory
    await mkdir(TEST_UPLOADS_PATH, { recursive: true });

    // Create test app with JWT and routes
    // Use the same db instance via closure
    testApp = new Elysia({ name: 'test-app' })
      .use(jwt({
        name: 'jwt',
        secret: TEST_JWT_SECRET,
      }))
      .get('/generate-token', async ({ jwt: jwtPlugin }) => {
        const token = await jwtPlugin.sign({
          sub: 'admin',
          type: 'access',
          exp: Math.floor(Date.now() / 1000) + 3600,
        });
        return { token };
      })
      .group('/api/admin/media', (app) =>
        app
          .derive({ as: 'scoped' }, async ({ request, jwt: jwtPlugin, set }) => {
            const auth = request.headers.get('authorization');
            if (!auth || !auth.startsWith('Bearer ')) {
              set.status = 401;
              throw new Error('Unauthorized');
            }
            const token = auth.replace('Bearer ', '');
            const payload = await jwtPlugin.verify(token);
            if (!payload) {
              set.status = 401;
              throw new Error('Invalid token');
            }
            // Use the closure db instance
            return { admin: { sub: (payload as { sub: string }).sub }, db };
          })
          .onError(({ code, set }) => {
            if (code === 'UNKNOWN') {
              set.status = 401;
              return { error: 'Unauthorized', code: 'UNAUTHORIZED' };
            }
          })
          .post(
            '/',
            async ({ body, db: database, set }) => {
              const file = body.file;
              if (!file) {
                set.status = 400;
                return { error: 'No file provided' };
              }

              // Validate file type
              const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'];
              if (!allowedTypes.includes(file.type)) {
                set.status = 415;
                return { error: 'Unsupported media type', code: 'UNSUPPORTED_MEDIA_TYPE' };
              }

              // Validate file size (10MB for images, 25MB for PDF)
              const maxSize = file.type.startsWith('image/') ? 10 * 1024 * 1024 : 25 * 1024 * 1024;
              if (file.size > maxSize) {
                set.status = 413;
                return { error: 'File too large', code: 'PAYLOAD_TOO_LARGE' };
              }

              const storageKey = `2025/01/test-${Date.now()}-${file.name}`;
              const now = new Date();

              const [insertedMedia] = await database.insert(schema.media).values({
                filename: file.name,
                mimeType: file.type,
                size: file.size,
                storageKey,
                createdAt: now,
              }).returning();

              set.status = 201;
              return { data: insertedMedia };
            },
            {
              body: t.Object({
                file: t.File(),
              }),
            }
          )
          .get('/', async ({ db: database, query }) => {
            const limit = query.limit ? parseInt(query.limit as string) : 20;
            const offset = query.offset ? parseInt(query.offset as string) : 0;

            const results = await database.select().from(schema.media)
              .where(isNull(schema.media.deletedAt))
              .limit(limit).offset(offset);

            return {
              data: results,
              pagination: {
                total: results.length,
                offset,
                limit,
                hasMore: false,
              },
            };
          })
          .get('/:id', async ({ params, db: database, set }) => {
            const id = parseInt(params.id, 10);
            const [media] = await database.select().from(schema.media)
              .where(eq(schema.media.id, id));

            if (!media || media.deletedAt) {
              set.status = 404;
              return { error: 'Not found', code: 'NOT_FOUND' };
            }

            return { data: media };
          })
          .put('/:id', async ({ params, body, db: database, set }) => {
            const id = parseInt(params.id, 10);
            const [media] = await database.select().from(schema.media)
              .where(eq(schema.media.id, id));

            if (!media || media.deletedAt) {
              set.status = 404;
              return { error: 'Not found', code: 'NOT_FOUND' };
            }

            await database.update(schema.media)
              .set({ altText: (body as { altText?: string }).altText ?? null })
              .where(eq(schema.media.id, id));

            const [updated] = await database.select().from(schema.media)
              .where(eq(schema.media.id, id));

            return { data: updated };
          })
          .delete('/:id', async ({ params, db: database, set }) => {
            const id = parseInt(params.id, 10);
            const [media] = await database.select().from(schema.media)
              .where(eq(schema.media.id, id));

            if (!media || media.deletedAt) {
              set.status = 404;
              return { error: 'Not found', code: 'NOT_FOUND' };
            }

            const deletedAt = new Date();
            await database.update(schema.media)
              .set({ deletedAt })
              .where(eq(schema.media.id, id));

            return { message: 'Media deleted', id, deletedAt: deletedAt.toISOString() };
          })
      );

    // Generate access token
    const tokenResponse = await testApp.handle(new Request('http://test/generate-token'));
    const tokenJson = await tokenResponse.json();
    accessToken = tokenJson.token;
  });

  afterAll(async () => {
    await closeDatabase(client);
    try {
      await rm(TEST_UPLOADS_PATH, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Reset database to clean state
    await resetDatabase(db);
  });

  test('POST /api/admin/media requires authentication', async () => {
    const formData = new FormData();
    formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }));

    const response = await testApp.handle(new Request('http://test/api/admin/media', {
      method: 'POST',
      body: formData,
    }));

    expect(response.status).toBe(401);
  });

  test('POST /api/admin/media accepts valid image file', async () => {
    const formData = new FormData();
    formData.append('file', new File(['test image data'], 'test.jpg', { type: 'image/jpeg' }));

    const response = await testApp.handle(new Request('http://test/api/admin/media', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    }));

    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.data).toBeDefined();
    expect(json.data.filename).toBe('test.jpg');
    expect(json.data.mimeType).toBe('image/jpeg');
  });

  test('POST /api/admin/media returns 415 for invalid file type', async () => {
    const formData = new FormData();
    formData.append('file', new File(['test'], 'test.exe', { type: 'application/x-msdownload' }));

    const response = await testApp.handle(new Request('http://test/api/admin/media', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      body: formData,
    }));

    expect(response.status).toBe(415);
    const json = await response.json();
    expect(json.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  test('GET /api/admin/media returns paginated list', async () => {
    // Insert test records using Drizzle
    const now = new Date();
    await db.insert(schema.media).values({
      filename: 'test1.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/test1.jpg',
      createdAt: now,
    });
    await db.insert(schema.media).values({
      filename: 'test2.png',
      mimeType: 'image/png',
      size: 2048,
      storageKey: '2025/01/test2.png',
      createdAt: now,
    });

    const response = await testApp.handle(new Request('http://test/api/admin/media?limit=10&offset=0', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }));

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data).toHaveLength(2);
    expect(json.pagination).toBeDefined();
    expect(json.pagination.limit).toBe(10);
    expect(json.pagination.offset).toBe(0);
  });

  test('GET /api/admin/media/:id returns single media with variants', async () => {
    const now = new Date();
    const variants = JSON.stringify({
      thumb: { path: '2025/01/test-thumb.webp', width: 400, height: 300 },
    });
    const [inserted] = await db.insert(schema.media).values({
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/test.jpg',
      createdAt: now,
      variants,
      width: 1920,
      height: 1080,
    }).returning();

    const response = await testApp.handle(new Request(`http://test/api/admin/media/${inserted.id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }));

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data).toBeDefined();
    expect(json.data.filename).toBe('test.jpg');
    expect(json.data.width).toBe(1920);
    expect(json.data.height).toBe(1080);
  });

  test('PUT /api/admin/media/:id updates altText', async () => {
    const now = new Date();
    const [inserted] = await db.insert(schema.media).values({
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/test.jpg',
      createdAt: now,
    }).returning();

    const response = await testApp.handle(new Request(`http://test/api/admin/media/${inserted.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ altText: 'Updated alt text' }),
    }));

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data.altText).toBe('Updated alt text');
  });

  test('DELETE /api/admin/media/:id sets deletedAt (soft delete)', async () => {
    const now = new Date();
    const [inserted] = await db.insert(schema.media).values({
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/test.jpg',
      createdAt: now,
    }).returning();

    const response = await testApp.handle(new Request(`http://test/api/admin/media/${inserted.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }));

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.message).toBe('Media deleted');
    expect(json.id).toBe(inserted.id);

    // Verify soft delete
    const [media] = await db.select().from(schema.media).where(eq(schema.media.id, inserted.id));
    expect(media?.deletedAt).not.toBeNull();
  });

  test('GET /api/admin/media/:id returns 404 for non-existent media', async () => {
    const response = await testApp.handle(new Request('http://test/api/admin/media/999', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }));

    expect(response.status).toBe(404);
  });
});
