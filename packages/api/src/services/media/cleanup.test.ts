/**
 * Cleanup Service Tests
 *
 * Tests for soft-delete cleanup functionality.
 * Uses PostgreSQL with shared test database.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { eq } from 'drizzle-orm';
import { mkdir, rm, writeFile, access } from 'fs/promises';
import { join } from 'path';
import type postgres from 'postgres';
import { createTestDatabase, resetDatabase, closeDatabase } from '../../db/test-utils';
import * as schema from '../../db/schema';
import { cleanupExpiredMedia, getCleanupCount } from './cleanup';

const TEST_UPLOADS_PATH = './test-cleanup-uploads';

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe('Cleanup Service', () => {
  let client: ReturnType<typeof postgres>;
  let db: ReturnType<typeof createTestDatabase>['db'];

  beforeAll(async () => {
    // Create test uploads directory
    await mkdir(TEST_UPLOADS_PATH, { recursive: true });
  });

  afterAll(async () => {
    try {
      await rm(TEST_UPLOADS_PATH, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    // Set up test database
    const testDb = createTestDatabase();
    client = testDb.client;
    db = testDb.db;
    await resetDatabase(db);

    // Clear uploads directory
    try {
      await rm(TEST_UPLOADS_PATH, { recursive: true, force: true });
      await mkdir(TEST_UPLOADS_PATH, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  afterAll(async () => {
    await closeDatabase(client);
  });

  test('cleanup finds records with deletedAt older than 30 days', async () => {
    const now = Date.now();
    const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;
    const twentyDaysAgo = now - 20 * 24 * 60 * 60 * 1000;

    // Insert expired record (31 days old)
    await db.insert(schema.media).values({
      filename: 'expired.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/expired.jpg',
      createdAt: new Date(thirtyOneDaysAgo - 1000),
      deletedAt: new Date(thirtyOneDaysAgo),
    });

    // Insert recent record (20 days old, should NOT be cleaned)
    await db.insert(schema.media).values({
      filename: 'recent.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/recent.jpg',
      createdAt: new Date(twentyDaysAgo - 1000),
      deletedAt: new Date(twentyDaysAgo),
    });

    // Insert active record (not deleted)
    await db.insert(schema.media).values({
      filename: 'active.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/active.jpg',
      createdAt: new Date(),
    });

    // Check cleanup count
    const count = await getCleanupCount(db, 30);
    expect(count).toBe(1);
  });

  test('cleanup deletes physical files (original + variants)', async () => {
    const now = Date.now();
    const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;

    // Create directory structure
    const fileDir = join(TEST_UPLOADS_PATH, '2025', '01');
    await mkdir(fileDir, { recursive: true });

    // Create test files
    const originalPath = join(fileDir, 'test.jpg');
    const thumbPath = join(fileDir, 'test-thumb.webp');
    const mediumPath = join(fileDir, 'test-medium.webp');
    const largePath = join(fileDir, 'test-large.webp');

    await writeFile(originalPath, 'original content');
    await writeFile(thumbPath, 'thumb content');
    await writeFile(mediumPath, 'medium content');
    await writeFile(largePath, 'large content');

    // Insert record with variants
    const variants = JSON.stringify({
      thumb: { path: '2025/01/test-thumb.webp', width: 400, height: 300 },
      medium: { path: '2025/01/test-medium.webp', width: 800, height: 600 },
      large: { path: '2025/01/test-large.webp', width: 1200, height: 900 },
    });

    await db.insert(schema.media).values({
      filename: 'test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/test.jpg',
      createdAt: new Date(thirtyOneDaysAgo - 1000),
      deletedAt: new Date(thirtyOneDaysAgo),
      variants,
      width: 1920,
      height: 1080,
    });

    // Verify files exist before cleanup
    expect(await fileExists(originalPath)).toBe(true);
    expect(await fileExists(thumbPath)).toBe(true);

    // Run cleanup
    const result = await cleanupExpiredMedia(db, TEST_UPLOADS_PATH, 30);

    expect(result.cleaned).toBe(1);
    expect(result.failed).toBe(0);

    // Verify files are deleted
    expect(await fileExists(originalPath)).toBe(false);
    expect(await fileExists(thumbPath)).toBe(false);
    expect(await fileExists(mediumPath)).toBe(false);
    expect(await fileExists(largePath)).toBe(false);
  });

  test('cleanup removes database record after file deletion', async () => {
    const now = Date.now();
    const thirtyOneDaysAgo = now - 31 * 24 * 60 * 60 * 1000;

    // Insert expired record
    await db.insert(schema.media).values({
      filename: 'expired.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/expired.jpg',
      createdAt: new Date(thirtyOneDaysAgo - 1000),
      deletedAt: new Date(thirtyOneDaysAgo),
    });

    // Verify record exists
    let record = await db.select().from(schema.media).where(eq(schema.media.storageKey, '2025/01/expired.jpg'));
    expect(record.length).toBe(1);

    // Run cleanup
    const result = await cleanupExpiredMedia(db, TEST_UPLOADS_PATH, 30);

    expect(result.cleaned).toBe(1);
    expect(result.failed).toBe(0);

    // Verify record is deleted
    record = await db.select().from(schema.media).where(eq(schema.media.storageKey, '2025/01/expired.jpg'));
    expect(record.length).toBe(0);
  });

  test('cleanup skips records newer than threshold', async () => {
    const now = Date.now();
    const twentyDaysAgo = now - 20 * 24 * 60 * 60 * 1000;

    // Insert recent record (20 days old, should NOT be cleaned)
    await db.insert(schema.media).values({
      filename: 'recent.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/recent.jpg',
      createdAt: new Date(twentyDaysAgo - 1000),
      deletedAt: new Date(twentyDaysAgo),
    });

    // Run cleanup
    const result = await cleanupExpiredMedia(db, TEST_UPLOADS_PATH, 30);

    expect(result.cleaned).toBe(0);
    expect(result.failed).toBe(0);

    // Verify record still exists
    const record = await db.select().from(schema.media).where(eq(schema.media.storageKey, '2025/01/recent.jpg'));
    expect(record.length).toBe(1);
    expect(record[0].deletedAt).not.toBeNull();
  });
});
