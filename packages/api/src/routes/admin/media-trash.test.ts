/**
 * Admin Media Trash Routes Tests
 *
 * Tests for trash listing, restore, and permanent delete endpoints.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Elysia, t } from 'elysia';
import jwt from '@elysiajs/jwt';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq, isNull, isNotNull } from 'drizzle-orm';
import * as schema from '../../db/schema';

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

describe('Admin Media Trash Routes', () => {
  let sqlite: Database;
  let db: ReturnType<typeof drizzle>;
  let testApp: Elysia;
  let accessToken: string;

  beforeAll(async () => {
    sqlite = new Database(':memory:');
    sqlite.exec(CREATE_TABLES_SQL);
    db = drizzle(sqlite);

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
            return { admin: { sub: (payload as { sub: string }).sub }, db };
          })
          .onError(({ code, set }) => {
            if (code === 'UNKNOWN') {
              set.status = 401;
              return { error: 'Unauthorized', code: 'UNAUTHORIZED' };
            }
          })
          // GET /trash - List soft-deleted media
          .get('/trash', async ({ db: database, query }) => {
            const limit = query.limit ? parseInt(query.limit as string) : 20;
            const offset = query.offset ? parseInt(query.offset as string) : 0;

            const results = database.select().from(schema.media)
              .where(isNotNull(schema.media.deletedAt))
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
          // POST /:id/restore - Restore from trash
          .post('/:id/restore', async ({ params, db: database, set }) => {
            const id = parseInt(params.id, 10);
            const media = database.select().from(schema.media)
              .where(eq(schema.media.id, id)).get();

            if (!media) {
              set.status = 404;
              return { error: 'Not found', code: 'NOT_FOUND' };
            }

            if (!media.deletedAt) {
              set.status = 400;
              return { error: 'Media not in trash', code: 'VALIDATION_ERROR' };
            }

            database.update(schema.media)
              .set({ deletedAt: null })
              .where(eq(schema.media.id, id)).run();

            const updated = database.select().from(schema.media)
              .where(eq(schema.media.id, id)).get();

            return { message: 'Media restored', data: updated };
          })
          // DELETE /:id/permanent - Permanently delete
          .delete('/:id/permanent', async ({ params, db: database, set }) => {
            const id = parseInt(params.id, 10);
            const media = database.select().from(schema.media)
              .where(eq(schema.media.id, id)).get();

            if (!media) {
              set.status = 404;
              return { error: 'Not found', code: 'NOT_FOUND' };
            }

            if (!media.deletedAt) {
              set.status = 400;
              return { error: 'Media must be in trash first', code: 'VALIDATION_ERROR' };
            }

            database.delete(schema.media)
              .where(eq(schema.media.id, id)).run();

            return { message: 'Media permanently deleted', id };
          })
      );

    const tokenResponse = await testApp.handle(new Request('http://test/generate-token'));
    const tokenJson = await tokenResponse.json();
    accessToken = tokenJson.token;
  });

  afterAll(() => {
    sqlite.close();
  });

  beforeEach(() => {
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

  test('GET /api/admin/media/trash returns only soft-deleted items', async () => {
    const now = new Date();
    const deletedAt = new Date();

    // Insert active media
    db.insert(schema.media).values({
      filename: 'active.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/active.jpg',
      createdAt: now,
    }).run();

    // Insert soft-deleted media
    db.insert(schema.media).values({
      filename: 'deleted.jpg',
      mimeType: 'image/jpeg',
      size: 2048,
      storageKey: '2025/01/deleted.jpg',
      createdAt: now,
      deletedAt: deletedAt,
    }).run();

    const response = await testApp.handle(new Request('http://test/api/admin/media/trash', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }));

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].filename).toBe('deleted.jpg');
    expect(json.data[0].deletedAt).not.toBeNull();
  });

  test('POST /api/admin/media/:id/restore clears deletedAt', async () => {
    const now = new Date();
    const deletedAt = new Date();

    db.insert(schema.media).values({
      filename: 'deleted.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/deleted.jpg',
      createdAt: now,
      deletedAt: deletedAt,
    }).run();

    const inserted = db.select().from(schema.media).all();
    const mediaId = inserted[0].id;

    const response = await testApp.handle(new Request(`http://test/api/admin/media/${mediaId}/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }));

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.message).toBe('Media restored');

    // Verify deletedAt is cleared
    const media = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();
    expect(media?.deletedAt).toBeNull();
  });

  test('DELETE /api/admin/media/:id/permanent removes database record', async () => {
    const now = new Date();
    const deletedAt = new Date();

    db.insert(schema.media).values({
      filename: 'deleted.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/deleted.jpg',
      createdAt: now,
      deletedAt: deletedAt,
    }).run();

    const inserted = db.select().from(schema.media).all();
    const mediaId = inserted[0].id;

    const response = await testApp.handle(new Request(`http://test/api/admin/media/${mediaId}/permanent`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }));

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.message).toBe('Media permanently deleted');
    expect(json.id).toBe(mediaId);

    // Verify record is deleted
    const media = db.select().from(schema.media).where(eq(schema.media.id, mediaId)).get();
    expect(media).toBeUndefined();
  });

  test('trash endpoints require authentication', async () => {
    // Test GET /trash without auth
    const trashResponse = await testApp.handle(new Request('http://test/api/admin/media/trash'));
    expect(trashResponse.status).toBe(401);

    // Test POST /restore without auth
    const restoreResponse = await testApp.handle(new Request('http://test/api/admin/media/1/restore', {
      method: 'POST',
    }));
    expect(restoreResponse.status).toBe(401);

    // Test DELETE /permanent without auth
    const permanentResponse = await testApp.handle(new Request('http://test/api/admin/media/1/permanent', {
      method: 'DELETE',
    }));
    expect(permanentResponse.status).toBe(401);
  });
});
