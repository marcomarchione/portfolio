/**
 * Media Table Schema Tests
 *
 * Tests for media table schema changes including new columns:
 * deletedAt, variants, width, height
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq } from 'drizzle-orm';
import { media } from './schema/media';

// SQL to create media table with new columns
const CREATE_MEDIA_TABLE_SQL = `
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

describe('Media Table Schema', () => {
  let sqlite: Database;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    sqlite = new Database(':memory:');
    sqlite.exec(CREATE_MEDIA_TABLE_SQL);
    db = drizzle(sqlite);
  });

  afterAll(() => {
    sqlite.close();
  });

  beforeEach(() => {
    sqlite.exec('DELETE FROM media');
  });

  test('deletedAt column is nullable and accepts timestamp values', () => {
    const now = Date.now();

    // Insert media with null deletedAt
    db.insert(media).values({
      filename: 'test-image.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/uuid-test-image.jpg',
      createdAt: new Date(now),
      deletedAt: null,
    }).run();

    let result = db.select().from(media).where(eq(media.storageKey, '2025/01/uuid-test-image.jpg')).get();
    expect(result).toBeDefined();
    expect(result!.deletedAt).toBeNull();

    // Update with deletedAt timestamp
    const deleteTime = new Date(now + 1000);
    db.update(media)
      .set({ deletedAt: deleteTime })
      .where(eq(media.id, result!.id))
      .run();

    result = db.select().from(media).where(eq(media.id, result!.id)).get();
    expect(result!.deletedAt).toEqual(deleteTime);
  });

  test('variants column stores valid JSON data', () => {
    const now = Date.now();
    const variants = JSON.stringify({
      thumb: { path: '2025/01/uuid-test-thumb.webp', width: 400, height: 300 },
      medium: { path: '2025/01/uuid-test-medium.webp', width: 800, height: 600 },
      large: { path: '2025/01/uuid-test-large.webp', width: 1200, height: 900 },
    });

    db.insert(media).values({
      filename: 'test-variants.jpg',
      mimeType: 'image/jpeg',
      size: 2048,
      storageKey: '2025/01/uuid-test-variants.jpg',
      createdAt: new Date(now),
      variants,
    }).run();

    const result = db.select().from(media).where(eq(media.storageKey, '2025/01/uuid-test-variants.jpg')).get();
    expect(result).toBeDefined();
    expect(result!.variants).toBe(variants);

    // Parse and verify JSON structure
    const parsedVariants = JSON.parse(result!.variants!);
    expect(parsedVariants.thumb.width).toBe(400);
    expect(parsedVariants.medium.width).toBe(800);
    expect(parsedVariants.large.width).toBe(1200);
  });

  test('width and height columns are nullable integers', () => {
    const now = Date.now();

    // Insert with width/height
    db.insert(media).values({
      filename: 'image-with-dimensions.jpg',
      mimeType: 'image/jpeg',
      size: 4096,
      storageKey: '2025/01/uuid-dimensions.jpg',
      createdAt: new Date(now),
      width: 1920,
      height: 1080,
    }).run();

    let result = db.select().from(media).where(eq(media.storageKey, '2025/01/uuid-dimensions.jpg')).get();
    expect(result).toBeDefined();
    expect(result!.width).toBe(1920);
    expect(result!.height).toBe(1080);

    // Insert without width/height (null)
    db.insert(media).values({
      filename: 'pdf-no-dimensions.pdf',
      mimeType: 'application/pdf',
      size: 8192,
      storageKey: '2025/01/uuid-pdf.pdf',
      createdAt: new Date(now),
      width: null,
      height: null,
    }).run();

    result = db.select().from(media).where(eq(media.storageKey, '2025/01/uuid-pdf.pdf')).get();
    expect(result).toBeDefined();
    expect(result!.width).toBeNull();
    expect(result!.height).toBeNull();
  });

  test('index on deletedAt exists and supports cleanup queries', () => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Insert multiple records with various deletedAt values
    const testData = [
      { filename: 'active.jpg', storageKey: 'active', deletedAt: null },
      { filename: 'recent-delete.jpg', storageKey: 'recent', deletedAt: new Date(now - 1000) },
      { filename: 'old-delete.jpg', storageKey: 'old', deletedAt: new Date(thirtyDaysAgo - 1000) },
    ];

    for (const item of testData) {
      db.insert(media).values({
        filename: item.filename,
        mimeType: 'image/jpeg',
        size: 1024,
        storageKey: item.storageKey,
        createdAt: new Date(now),
        deletedAt: item.deletedAt,
      }).run();
    }

    // Query for cleanup candidates (deletedAt before threshold)
    const thresholdDate = new Date(thirtyDaysAgo);

    // Using raw SQL to test index usage
    const cleanupCandidates = sqlite.query(`
      SELECT * FROM media
      WHERE deleted_at IS NOT NULL
      AND deleted_at < ?
    `).all(thresholdDate.getTime());

    expect(cleanupCandidates).toHaveLength(1);
    expect((cleanupCandidates[0] as { storage_key: string }).storage_key).toBe('old');

    // Verify index exists
    const indexes = sqlite.query(`
      SELECT name FROM sqlite_master
      WHERE type = 'index' AND tbl_name = 'media' AND name = 'idx_media_deleted_at'
    `).all();
    expect(indexes).toHaveLength(1);
  });

  test('storage_key remains unique across records', () => {
    const now = Date.now();

    db.insert(media).values({
      filename: 'unique-test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      storageKey: '2025/01/unique-key.jpg',
      createdAt: new Date(now),
    }).run();

    // Attempting to insert duplicate storage_key should fail
    expect(() => {
      db.insert(media).values({
        filename: 'another-file.jpg',
        mimeType: 'image/jpeg',
        size: 2048,
        storageKey: '2025/01/unique-key.jpg',
        createdAt: new Date(now),
      }).run();
    }).toThrow();
  });

  test('all required fields are enforced', () => {
    // Missing filename should fail
    expect(() => {
      sqlite.exec(`
        INSERT INTO media (mime_type, size, storage_key, created_at)
        VALUES ('image/jpeg', 1024, 'key1', ${Date.now()})
      `);
    }).toThrow();

    // Missing mimeType should fail
    expect(() => {
      sqlite.exec(`
        INSERT INTO media (filename, size, storage_key, created_at)
        VALUES ('test.jpg', 1024, 'key2', ${Date.now()})
      `);
    }).toThrow();

    // Missing size should fail
    expect(() => {
      sqlite.exec(`
        INSERT INTO media (filename, mime_type, storage_key, created_at)
        VALUES ('test.jpg', 'image/jpeg', 'key3', ${Date.now()})
      `);
    }).toThrow();
  });
});
