/**
 * Core Table Schema Tests
 *
 * Tests for content_base, content_translations, projects, materials, and news tables.
 * Uses PostgreSQL with shared test database.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { eq, sql } from 'drizzle-orm';
import type postgres from 'postgres';
import { createTestDatabase, resetDatabase, closeDatabase } from './test-utils';
import { contentBase } from './schema/content-base';
import { contentTranslations } from './schema/content-translations';
import { projects } from './schema/projects';
import { materials } from './schema/materials';
import { news } from './schema/news';

describe('Core Table Schemas', () => {
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

  test('content_base table structure stores type and status correctly', async () => {
    const now = new Date();

    // Insert content with valid type and status
    await db.insert(contentBase).values({
      type: 'project',
      slug: 'test-project',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });

    const result = await db.select().from(contentBase);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('project');
    expect(result[0].status).toBe('draft');

    // All valid types should work
    for (const type of ['material', 'news'] as const) {
      await db.insert(contentBase).values({
        type,
        slug: `test-${type}`,
        status: 'published',
        createdAt: now,
        updatedAt: now,
      });
    }

    const allResults = await db.select().from(contentBase);
    expect(allResults).toHaveLength(3);
    expect(allResults.map(r => r.type).sort()).toEqual(['material', 'news', 'project']);
  });

  test('content_translations composite unique constraint prevents duplicates', async () => {
    const now = new Date();

    // Insert base content
    const [content] = await db.insert(contentBase).values({
      type: 'project',
      slug: 'unique-test',
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Insert first translation
    await db.insert(contentTranslations).values({
      contentId: content.id,
      lang: 'it',
      title: 'Titolo Italiano',
    });

    // Inserting duplicate (same content_id + lang) should fail
    let error: Error | null = null;
    try {
      await db.insert(contentTranslations).values({
        contentId: content.id,
        lang: 'it',
        title: 'Altro Titolo',
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();

    // Different language should work
    await db.insert(contentTranslations).values({
      contentId: content.id,
      lang: 'en',
      title: 'English Title',
    });

    const translations = await db.select().from(contentTranslations);
    expect(translations).toHaveLength(2);
  });

  test('projects table maintains one-to-one relationship with content_base', async () => {
    const now = new Date();

    // Insert base content
    const [content] = await db.insert(contentBase).values({
      type: 'project',
      slug: 'project-test',
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Insert project extension
    await db.insert(projects).values({
      contentId: content.id,
      projectStatus: 'in-progress',
    });

    // Trying to insert another project for the same content should fail (UNIQUE constraint)
    let error: Error | null = null;
    try {
      await db.insert(projects).values({
        contentId: content.id,
        projectStatus: 'completed',
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();

    const allProjects = await db.select().from(projects);
    expect(allProjects).toHaveLength(1);
    expect(allProjects[0].contentId).toBe(content.id);
  });

  test('materials table CHECK constraint validates category field', async () => {
    const now = new Date();

    // Insert base content
    const [content] = await db.insert(contentBase).values({
      type: 'material',
      slug: 'material-test',
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Valid category should work
    await db.insert(materials).values({
      contentId: content.id,
      category: 'guide',
      downloadUrl: 'https://example.com/file.pdf',
    });

    const result = await db.select().from(materials);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('guide');

    // Invalid category should fail CHECK constraint
    let error: Error | null = null;
    try {
      await db.execute(
        sql`INSERT INTO materials (content_id, category, download_url)
            VALUES (999, 'invalid_category', 'https://example.com/file.pdf')`
      );
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();
  });

  test('news table foreign key relationship works with CASCADE DELETE', async () => {
    const now = new Date();

    // Insert base content
    const [content] = await db.insert(contentBase).values({
      type: 'news',
      slug: 'news-test',
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Insert news extension
    await db.insert(news).values({
      contentId: content.id,
      readingTime: 5,
    });

    let newsItems = await db.select().from(news);
    expect(newsItems).toHaveLength(1);

    // Delete content_base should cascade to news
    await db.delete(contentBase).where(eq(contentBase.id, content.id));

    newsItems = await db.select().from(news);
    expect(newsItems).toHaveLength(0);
  });

  test('required fields are enforced and nullable fields accept null', async () => {
    const now = new Date();

    // Test that required fields are enforced (type is NOT NULL)
    let error: Error | null = null;
    try {
      await db.execute(
        sql`INSERT INTO content_base (slug, status, created_at, updated_at)
            VALUES ('missing-type', 'draft', NOW(), NOW())`
      );
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();

    // Insert valid content with all nullable fields as null
    const [content] = await db.insert(contentBase).values({
      type: 'project',
      slug: 'nullable-test',
      createdAt: now,
      updatedAt: now,
      publishedAt: null, // nullable
    }).returning();

    // Insert translation with nullable fields
    await db.insert(contentTranslations).values({
      contentId: content.id,
      lang: 'it',
      title: 'Required Title',
      description: null, // nullable
      body: null, // nullable
      metaTitle: null, // nullable
      metaDescription: null, // nullable
    });

    // Insert project with nullable fields
    await db.insert(projects).values({
      contentId: content.id,
      githubUrl: null, // nullable
      demoUrl: null, // nullable
      startDate: null, // nullable
      endDate: null, // nullable
    });

    const allContent = await db.select().from(contentBase);
    const allTranslations = await db.select().from(contentTranslations);
    const allProjects = await db.select().from(projects);

    expect(allContent).toHaveLength(1);
    expect(allContent[0].publishedAt).toBeNull();
    expect(allTranslations).toHaveLength(1);
    expect(allTranslations[0].description).toBeNull();
    expect(allProjects).toHaveLength(1);
    expect(allProjects[0].githubUrl).toBeNull();
  });
});
