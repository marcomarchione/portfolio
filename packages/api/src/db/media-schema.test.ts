/**
 * Media Table Schema Tests
 *
 * Tests for media table schema changes including columns:
 * deletedAt, variants, width, height
 * Uses PostgreSQL with shared test database.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { eq, lt, isNotNull, sql } from 'drizzle-orm';
import type postgres from 'postgres';
import { createTestDatabase, resetDatabase, closeDatabase } from './test-utils';
import { media } from './schema/media';

describe('Media Table Schema', () => {
  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof createTestDatabase>['db'];

  beforeAll(() => {
    const testDb = createTestDatabase();
    client = testDb.client;
    db = testDb.db;
  });

  afterAll(async () => {
    await closeDatabase(client);
  });

  beforeEach(async () => {
    await resetDatabase(db);
  });

  test('deletedAt column is nullable and accepts timestamp values', async () => {
    const now = new Date();

    // Insert media with null deletedAt
    const [inserted] = await db.insert(media).values({
      filename: 'test-image.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/uuid-test-image.jpg',
      createdAt: now,
      deletedAt: null,
    }).returning();

    let result = await db.select().from(media).where(eq(media.id, inserted.id));
    expect(result).toHaveLength(1);
    expect(result[0].deletedAt).toBeNull();

    // Update with deletedAt timestamp
    const deleteTime = new Date(now.getTime() + 1000);
    await db.update(media)
      .set({ deletedAt: deleteTime })
      .where(eq(media.id, inserted.id));

    result = await db.select().from(media).where(eq(media.id, inserted.id));
    expect(result[0].deletedAt).toEqual(deleteTime);
  });

  test('variants column stores valid JSON data', async () => {
    const now = new Date();
    const variants = JSON.stringify({
      thumb: { path: '2025/01/uuid-test-thumb.webp', width: 400, height: 300 },
      medium: { path: '2025/01/uuid-test-medium.webp', width: 800, height: 600 },
      large: { path: '2025/01/uuid-test-large.webp', width: 1200, height: 900 },
    });

    await db.insert(media).values({
      filename: 'test-variants.jpg',
      mimeType: 'image/jpeg',
      size: 2048,
      storageKey: '2025/01/uuid-test-variants.jpg',
      createdAt: now,
      variants,
    });

    const result = await db.select().from(media).where(eq(media.storageKey, '2025/01/uuid-test-variants.jpg'));
    expect(result).toHaveLength(1);
    expect(result[0].variants).toBe(variants);

    // Parse and verify JSON structure
    const parsedVariants = JSON.parse(result[0].variants!);
    expect(parsedVariants.thumb.width).toBe(400);
    expect(parsedVariants.medium.width).toBe(800);
    expect(parsedVariants.large.width).toBe(1200);
  });

  test('width and height columns are nullable integers', async () => {
    const now = new Date();

    // Insert with width/height
    await db.insert(media).values({
      filename: 'image-with-dimensions.jpg',
      mimeType: 'image/jpeg',
      size: 4096,
      storageKey: '2025/01/uuid-dimensions.jpg',
      createdAt: now,
      width: 1920,
      height: 1080,
    });

    let result = await db.select().from(media).where(eq(media.storageKey, '2025/01/uuid-dimensions.jpg'));
    expect(result).toHaveLength(1);
    expect(result[0].width).toBe(1920);
    expect(result[0].height).toBe(1080);

    // Insert without width/height (null)
    await db.insert(media).values({
      filename: 'pdf-no-dimensions.pdf',
      mimeType: 'application/pdf',
      size: 8192,
      storageKey: '2025/01/uuid-pdf.pdf',
      createdAt: now,
      width: null,
      height: null,
    });

    result = await db.select().from(media).where(eq(media.storageKey, '2025/01/uuid-pdf.pdf'));
    expect(result).toHaveLength(1);
    expect(result[0].width).toBeNull();
    expect(result[0].height).toBeNull();
  });

  test('deletedAt supports cleanup queries', async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Insert multiple records with various deletedAt values
    await db.insert(media).values({
      filename: 'active.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: 'active',
      createdAt: now,
      deletedAt: null,
    });

    await db.insert(media).values({
      filename: 'recent-delete.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: 'recent',
      createdAt: now,
      deletedAt: new Date(now.getTime() - 1000),
    });

    await db.insert(media).values({
      filename: 'old-delete.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: 'old',
      createdAt: now,
      deletedAt: new Date(thirtyDaysAgo.getTime() - 1000),
    });

    // Query for cleanup candidates (deletedAt before threshold)
    const cleanupCandidates = await db
      .select()
      .from(media)
      .where(lt(media.deletedAt, thirtyDaysAgo));

    expect(cleanupCandidates).toHaveLength(1);
    expect(cleanupCandidates[0].storageKey).toBe('old');
  });

  test('storage_key remains unique across records', async () => {
    const now = new Date();

    await db.insert(media).values({
      filename: 'unique-test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/unique-key.jpg',
      createdAt: now,
    });

    // Attempting to insert duplicate storage_key should fail
    let error: Error | null = null;
    try {
      await db.insert(media).values({
        filename: 'another-file.jpg',
        mimeType: 'image/jpeg',
        size: 2048,
        storageKey: '2025/01/unique-key.jpg',
        createdAt: now,
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();
    expect(error?.message).toContain('unique');
  });

  test('all required fields are enforced', async () => {
    // Missing filename should fail
    let error1: Error | null = null;
    try {
      await db.execute(
        sql`INSERT INTO media (mime_type, size, storage_key, created_at)
            VALUES ('image/jpeg', 1024, 'key1', NOW())`
      );
    } catch (e) {
      error1 = e as Error;
    }
    expect(error1).not.toBeNull();

    // Missing mimeType should fail
    let error2: Error | null = null;
    try {
      await db.execute(
        sql`INSERT INTO media (filename, size, storage_key, created_at)
            VALUES ('test.jpg', 1024, 'key2', NOW())`
      );
    } catch (e) {
      error2 = e as Error;
    }
    expect(error2).not.toBeNull();

    // Missing size should fail
    let error3: Error | null = null;
    try {
      await db.execute(
        sql`INSERT INTO media (filename, mime_type, storage_key, created_at)
            VALUES ('test.jpg', 'image/jpeg', 'key3', NOW())`
      );
    } catch (e) {
      error3 = e as Error;
    }
    expect(error3).not.toBeNull();
  });
});
