/**
 * Admin Media Trash Routes Tests
 *
 * Tests for trash listing, restore, and permanent delete endpoints.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Elysia, t } from 'elysia';
import jwt from '@elysiajs/jwt';
import { eq, isNull, isNotNull } from 'drizzle-orm';
import { createTestDatabase, resetDatabase, closeDatabase } from '../../db/test-utils';
import * as schema from '../../db/schema';

const TEST_JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

describe('Admin Media Trash Routes', () => {
  let db: ReturnType<typeof createTestDatabase>['db'];
  let client: ReturnType<typeof createTestDatabase>['client'];
  let testApp: any;
  let accessToken: string;

  beforeAll(async () => {
    // Set up test database
    const testDb = createTestDatabase();
    db = testDb.db;
    client = testDb.client;

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

            const results = await database.select().from(schema.media)
              .where(isNotNull(schema.media.deletedAt))
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
          // POST /:id/restore - Restore from trash
          .post('/:id/restore', async ({ params, db: database, set }) => {
            const id = parseInt(params.id, 10);
            const [media] = await database.select().from(schema.media)
              .where(eq(schema.media.id, id));

            if (!media) {
              set.status = 404;
              return { error: 'Not found', code: 'NOT_FOUND' };
            }

            if (!media.deletedAt) {
              set.status = 400;
              return { error: 'Media not in trash', code: 'VALIDATION_ERROR' };
            }

            await database.update(schema.media)
              .set({ deletedAt: null })
              .where(eq(schema.media.id, id));

            const [updated] = await database.select().from(schema.media)
              .where(eq(schema.media.id, id));

            return { message: 'Media restored', data: updated };
          })
          // DELETE /:id/permanent - Permanently delete
          .delete('/:id/permanent', async ({ params, db: database, set }) => {
            const id = parseInt(params.id, 10);
            const [media] = await database.select().from(schema.media)
              .where(eq(schema.media.id, id));

            if (!media) {
              set.status = 404;
              return { error: 'Not found', code: 'NOT_FOUND' };
            }

            if (!media.deletedAt) {
              set.status = 400;
              return { error: 'Media must be in trash first', code: 'VALIDATION_ERROR' };
            }

            await database.delete(schema.media)
              .where(eq(schema.media.id, id));

            return { message: 'Media permanently deleted', id };
          })
      );

    const tokenResponse = await testApp.handle(new Request('http://test/generate-token'));
    const tokenJson = await tokenResponse.json();
    accessToken = tokenJson.token;
  });

  afterAll(async () => {
    await closeDatabase(client);
  });

  beforeEach(async () => {
    // Reset database to clean state
    await resetDatabase(db);
  });

  test('GET /api/admin/media/trash returns only soft-deleted items', async () => {
    const now = new Date();
    const deletedAt = new Date();

    // Insert active media
    await db.insert(schema.media).values({
      filename: 'active.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/active.jpg',
      createdAt: now,
    });

    // Insert soft-deleted media
    await db.insert(schema.media).values({
      filename: 'deleted.jpg',
      mimeType: 'image/jpeg',
      size: 2048,
      storageKey: '2025/01/deleted.jpg',
      createdAt: now,
      deletedAt: deletedAt,
    });

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

    const [inserted] = await db.insert(schema.media).values({
      filename: 'deleted.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/deleted.jpg',
      createdAt: now,
      deletedAt: deletedAt,
    }).returning();

    const response = await testApp.handle(new Request(`http://test/api/admin/media/${inserted.id}/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }));

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.message).toBe('Media restored');

    // Verify deletedAt is cleared
    const [media] = await db.select().from(schema.media).where(eq(schema.media.id, inserted.id));
    expect(media?.deletedAt).toBeNull();
  });

  test('DELETE /api/admin/media/:id/permanent removes database record', async () => {
    const now = new Date();
    const deletedAt = new Date();

    const [inserted] = await db.insert(schema.media).values({
      filename: 'deleted.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/deleted.jpg',
      createdAt: now,
      deletedAt: deletedAt,
    }).returning();

    const response = await testApp.handle(new Request(`http://test/api/admin/media/${inserted.id}/permanent`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }));

    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.message).toBe('Media permanently deleted');
    expect(json.id).toBe(inserted.id);

    // Verify record is deleted
    const [media] = await db.select().from(schema.media).where(eq(schema.media.id, inserted.id));
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
