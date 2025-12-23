/**
 * Admin Media Routes Tests
 *
 * Tests for media upload and CRUD endpoints.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Elysia, t } from 'elysia';
import jwt from '@elysiajs/jwt';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq, isNull } from 'drizzle-orm';
import { mkdir, rm } from 'fs/promises';
import * as schema from '../../../db/schema';

// Test database SQL - reset autoincrement on delete
const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS media (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    storage_key TEXT NOT NULL UNIQUE,
    alt_text TEXT,
    created_at INTEGER NOT NULL,
    deleted_at INTEGER,
    variants TEXT,
    width INTEGER,
    height INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at);
  CREATE INDEX IF NOT EXISTS idx_media_storage_key ON media(storage_key);
  CREATE INDEX IF NOT EXISTS idx_media_deleted_at ON media(deleted_at);
`;

const TEST_JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
const TEST_UPLOADS_PATH = './test-uploads';

describe('Admin Media Routes', () => {
  let sqlite: Database;
  let db: ReturnType<typeof drizzle>;
  let testApp: Elysia;
  let accessToken: string;

  beforeAll(async () => {
    // Set up test database
    sqlite = new Database(':memory:');
    sqlite.exec(CREATE_TABLES_SQL);
    db = drizzle(sqlite);

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

              database.insert(schema.media).values({
                filename: file.name,
                mimeType: file.type,
                size: file.size,
                storageKey,
                createdAt: now,
              }).run();

              const media = database.select().from(schema.media)
                .where(eq(schema.media.storageKey, storageKey)).get();

              set.status = 201;
              return { data: media };
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

            const results = database.select().from(schema.media)
              .where(isNull(schema.media.deletedAt))
              .limit(limit).offset(offset).all();

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
            const media = database.select().from(schema.media)
              .where(eq(schema.media.id, id)).get();

            if (!media || media.deletedAt) {
              set.status = 404;
              return { error: 'Not found', code: 'NOT_FOUND' };
            }

            return { data: media };
          })
          .put('/:id', async ({ params, body, db: database, set }) => {
            const id = parseInt(params.id, 10);
            const media = database.select().from(schema.media)
              .where(eq(schema.media.id, id)).get();

            if (!media || media.deletedAt) {
              set.status = 404;
              return { error: 'Not found', code: 'NOT_FOUND' };
            }

            database.update(schema.media)
              .set({ altText: (body as { altText?: string }).altText ?? null })
              .where(eq(schema.media.id, id)).run();

            const updated = database.select().from(schema.media)
              .where(eq(schema.media.id, id)).get();

            return { data: updated };
          })
          .delete('/:id', async ({ params, db: database, set }) => {
            const id = parseInt(params.id, 10);
            const media = database.select().from(schema.media)
              .where(eq(schema.media.id, id)).get();

            if (!media || media.deletedAt) {
              set.status = 404;
              return { error: 'Not found', code: 'NOT_FOUND' };
            }

            const deletedAt = new Date();
            database.update(schema.media)
              .set({ deletedAt })
              .where(eq(schema.media.id, id)).run();

            return { message: 'Media deleted', id, deletedAt: deletedAt.toISOString() };
          })
      );

    // Generate access token
    const tokenResponse = await testApp.handle(new Request('http://test/generate-token'));
    const tokenJson = await tokenResponse.json();
    accessToken = tokenJson.token;
  });

  afterAll(async () => {
    sqlite.close();
    try {
      await rm(TEST_UPLOADS_PATH, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(() => {
    // Drop and recreate table to reset autoincrement
    sqlite.exec('DROP TABLE IF EXISTS media');
    sqlite.exec(`
      CREATE TABLE media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        storage_key TEXT NOT NULL UNIQUE,
        alt_text TEXT,
        created_at INTEGER NOT NULL,
        deleted_at INTEGER,
        variants TEXT,
        width INTEGER,
        height INTEGER
      )
    `);
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
    db.insert(schema.media).values({
      filename: 'test1.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/test1.jpg',
      createdAt: now,
    }).run();
    db.insert(schema.media).values({
      filename: 'test2.png',
      mimeType: 'image/png',
      size: 2048,
      storageKey: '2025/01/test2.png',
      createdAt: now,
    }).run();

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
    db.insert(schema.media).values({
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/test.jpg',
      createdAt: now,
      variants,
      width: 1920,
      height: 1080,
    }).run();

    // Get the inserted ID
    const inserted = db.select().from(schema.media).all();
    expect(inserted.length).toBe(1);
    const mediaId = inserted[0].id;

    const response = await testApp.handle(new Request(`http://test/api/admin/media/${mediaId}`, {
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
    db.insert(schema.media).values({
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/test.jpg',
      createdAt: now,
    }).run();

    // Get the inserted ID
    const inserted = db.select().from(schema.media).all();
    const mediaId = inserted[0].id;

    const response = await testApp.handle(new Request(`http://test/api/admin/media/${mediaId}`, {
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
    db.insert(schema.media).values({
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/test.jpg',
      createdAt: now,
    }).run();

    // Get the inserted ID
    const inserted = db.select().from(schema.media).all();
    const mediaId = inserted[0].id;

    const response = await testApp.handle(new Request(`http://test/api/admin/media/${mediaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }));

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.message).toBe('Media deleted');
    expect(json.id).toBe(mediaId);

    // Verify soft delete
    const media = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();
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
