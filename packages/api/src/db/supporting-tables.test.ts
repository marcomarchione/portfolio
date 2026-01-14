/**
 * Supporting Tables and Junction Tables Tests
 *
 * Tests for technologies, tags, media, project_technologies, and news_tags tables.
 * Uses PostgreSQL with shared test database.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { eq, sql } from 'drizzle-orm';
import type postgres from 'postgres';
import { createTestDatabase, resetDatabase, closeDatabase } from './test-utils';
import { technologies } from './schema/technologies';
import { tags } from './schema/tags';
import { media } from './schema/media';
import { contentBase } from './schema/content-base';
import { projects } from './schema/projects';
import { news } from './schema/news';
import { projectTechnologies } from './schema/project-technologies';
import { newsTags } from './schema/news-tags';

describe('Supporting Tables and Junction Tables', () => {
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

  test('technologies table unique constraint on name field', async () => {
    // Insert first technology
    await db.insert(technologies).values({
      name: 'TypeScript',
      icon: 'typescript-icon',
      color: '#3178c6',
    });

    const result = await db.select().from(technologies);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('TypeScript');

    // Inserting duplicate name should fail
    let error: Error | null = null;
    try {
      await db.insert(technologies).values({
        name: 'TypeScript',
        icon: 'different-icon',
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();

    // Different name should work
    await db.insert(technologies).values({
      name: 'React',
      color: '#61dafb',
    });

    const allTech = await db.select().from(technologies);
    expect(allTech).toHaveLength(2);
  });

  test('tags table unique constraint on slug field', async () => {
    // Insert first tag
    await db.insert(tags).values({
      name: 'Web Development',
      slug: 'web-dev',
    });

    const result = await db.select().from(tags);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('web-dev');

    // Inserting duplicate slug should fail
    let error: Error | null = null;
    try {
      await db.insert(tags).values({
        name: 'Web Developer',
        slug: 'web-dev',
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();

    // Different slug should work (same name is allowed)
    await db.insert(tags).values({
      name: 'Web Development',
      slug: 'web-development',
    });

    const allTags = await db.select().from(tags);
    expect(allTags).toHaveLength(2);
  });

  test('media table required fields and storage_key uniqueness', async () => {
    const now = new Date();

    // Insert valid media
    await db.insert(media).values({
      filename: 'image.png',
      mimeType: 'image/png',
      size: 1024,
      storageKey: 'uploads/2024/01/image.png',
      createdAt: now,
    });

    const result = await db.select().from(media);
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('image.png');
    expect(result[0].mimeType).toBe('image/png');
    expect(result[0].size).toBe(1024);

    // Duplicate storage_key should fail
    let error1: Error | null = null;
    try {
      await db.insert(media).values({
        filename: 'another-image.png',
        mimeType: 'image/png',
        size: 2048,
        storageKey: 'uploads/2024/01/image.png',
        createdAt: now,
      });
    } catch (e) {
      error1 = e as Error;
    }
    expect(error1).not.toBeNull();

    // Required fields missing should fail (mime_type is NOT NULL)
    let error2: Error | null = null;
    try {
      await db.execute(
        sql`INSERT INTO media (filename, storage_key, size, created_at)
            VALUES ('test.jpg', 'unique-key', 1024, NOW())`
      );
    } catch (e) {
      error2 = e as Error;
    }
    expect(error2).not.toBeNull();
  });

  test('project_technologies junction table composite primary key', async () => {
    const now = new Date();

    // Create project content
    const [content] = await db.insert(contentBase).values({
      type: 'project',
      slug: 'test-project',
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Create project extension
    const [project] = await db.insert(projects).values({
      contentId: content.id,
      projectStatus: 'in-progress',
    }).returning();

    // Create technologies
    const [tech1] = await db.insert(technologies).values({ name: 'TypeScript' }).returning();
    const [tech2] = await db.insert(technologies).values({ name: 'React' }).returning();

    // Link project to technologies
    await db.insert(projectTechnologies).values({
      projectId: project.id,
      technologyId: tech1.id,
    });

    await db.insert(projectTechnologies).values({
      projectId: project.id,
      technologyId: tech2.id,
    });

    const links = await db.select().from(projectTechnologies);
    expect(links).toHaveLength(2);

    // Duplicate link should fail (composite primary key)
    let error: Error | null = null;
    try {
      await db.insert(projectTechnologies).values({
        projectId: project.id,
        technologyId: tech1.id,
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();
  });

  test('news_tags junction table composite primary key', async () => {
    const now = new Date();

    // Create news content
    const [content] = await db.insert(contentBase).values({
      type: 'news',
      slug: 'test-news',
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Create news extension
    const [newsItem] = await db.insert(news).values({
      contentId: content.id,
      readingTime: 5,
    }).returning();

    // Create tags
    const [tag1] = await db.insert(tags).values({ name: 'Tech', slug: 'tech' }).returning();
    const [tag2] = await db.insert(tags).values({ name: 'Tutorial', slug: 'tutorial' }).returning();

    // Link news to tags
    await db.insert(newsTags).values({
      newsId: newsItem.id,
      tagId: tag1.id,
    });

    await db.insert(newsTags).values({
      newsId: newsItem.id,
      tagId: tag2.id,
    });

    const links = await db.select().from(newsTags);
    expect(links).toHaveLength(2);

    // Duplicate link should fail (composite primary key)
    let error: Error | null = null;
    try {
      await db.insert(newsTags).values({
        newsId: newsItem.id,
        tagId: tag1.id,
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();
  });

  test('CASCADE DELETE behavior on junction table foreign keys', async () => {
    const now = new Date();

    // Create project with technology links
    const [content] = await db.insert(contentBase).values({
      type: 'project',
      slug: 'cascade-test',
      createdAt: now,
      updatedAt: now,
    }).returning();

    const [project] = await db.insert(projects).values({
      contentId: content.id,
    }).returning();

    const [tech] = await db.insert(technologies).values({ name: 'Node.js' }).returning();

    await db.insert(projectTechnologies).values({
      projectId: project.id,
      technologyId: tech.id,
    });

    // Verify link exists
    let links = await db.select().from(projectTechnologies);
    expect(links).toHaveLength(1);

    // Delete project should cascade to junction table
    await db.delete(projects).where(eq(projects.id, project.id));

    links = await db.select().from(projectTechnologies);
    expect(links).toHaveLength(0);

    // Technology should still exist (only junction record deleted)
    const remainingTech = await db.select().from(technologies);
    expect(remainingTech).toHaveLength(1);

    // Also test deleting technology cascades to junction
    // First recreate the setup
    const [newProject] = await db.insert(projects).values({
      contentId: content.id,
    }).returning();

    await db.insert(projectTechnologies).values({
      projectId: newProject.id,
      technologyId: tech.id,
    });

    links = await db.select().from(projectTechnologies);
    expect(links).toHaveLength(1);

    // Delete technology should cascade to junction table
    await db.delete(technologies).where(eq(technologies.id, tech.id));

    links = await db.select().from(projectTechnologies);
    expect(links).toHaveLength(0);
  });
});
