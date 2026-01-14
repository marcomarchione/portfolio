/**
 * Database Schema Integrity Tests
 *
 * Tests for database schema validation, CHECK constraints, foreign key cascades,
 * and data integrity across all 10 tables.
 * Uses PostgreSQL with shared test database.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { eq, sql } from 'drizzle-orm';
import type postgres from 'postgres';
import { createTestDatabase, resetDatabase, closeDatabase } from './test-utils';

// Import all schemas
import { contentBase } from './schema/content-base';
import { contentTranslations } from './schema/content-translations';
import { projects } from './schema/projects';
import { materials } from './schema/materials';
import { news } from './schema/news';
import { technologies } from './schema/technologies';
import { tags } from './schema/tags';
import { media } from './schema/media';
import { projectTechnologies } from './schema/project-technologies';
import { newsTags } from './schema/news-tags';

describe('Database Schema Integrity', () => {
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

  test('all 10 tables exist in the database', async () => {
    const result = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tableNames = result.map((r: { table_name: string }) => r.table_name);

    expect(tableNames).toContain('content_base');
    expect(tableNames).toContain('content_translations');
    expect(tableNames).toContain('projects');
    expect(tableNames).toContain('materials');
    expect(tableNames).toContain('news');
    expect(tableNames).toContain('technologies');
    expect(tableNames).toContain('tags');
    expect(tableNames).toContain('media');
    expect(tableNames).toContain('project_technologies');
    expect(tableNames).toContain('news_tags');
  });

  test('content_base type column stores valid type values', async () => {
    const now = new Date();

    // All valid types should work
    for (const type of ['project', 'material', 'news'] as const) {
      await db.insert(contentBase).values({
        type,
        slug: `${type}-test`,
        createdAt: now,
        updatedAt: now,
      });
    }

    const result = await db.select().from(contentBase);
    expect(result).toHaveLength(3);
    expect(result.map(r => r.type).sort()).toEqual(['material', 'news', 'project']);
  });

  test('content_base status column stores valid status values', async () => {
    const now = new Date();

    // All valid statuses should work
    const validStatuses: Array<'draft' | 'published' | 'archived'> = ['draft', 'published', 'archived'];

    for (const status of validStatuses) {
      await db.insert(contentBase).values({
        type: 'project',
        slug: `status-${status}`,
        status,
        createdAt: now,
        updatedAt: now,
      });
    }

    const results = await db.select().from(contentBase);
    expect(results).toHaveLength(3);
    expect(results.map(r => r.status).sort()).toEqual(['archived', 'draft', 'published']);
  });

  test('content_translations composite unique prevents duplicate (content_id, lang)', async () => {
    const now = new Date();

    // Create base content
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

    // Duplicate (content_id, lang) should fail
    let error: Error | null = null;
    try {
      await db.insert(contentTranslations).values({
        contentId: content.id,
        lang: 'it',
        title: 'Another Italian Title',
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();

    // Different language for same content should work
    await db.insert(contentTranslations).values({
      contentId: content.id,
      lang: 'en',
      title: 'English Title',
    });

    const translations = await db.select().from(contentTranslations);
    expect(translations).toHaveLength(2);
  });

  test('foreign key CASCADE DELETE removes content_translations when content_base deleted', async () => {
    const now = new Date();

    // Create content with translations
    const [content] = await db.insert(contentBase).values({
      type: 'project',
      slug: 'cascade-test',
      createdAt: now,
      updatedAt: now,
    }).returning();

    await db.insert(contentTranslations).values({ contentId: content.id, lang: 'it', title: 'Italian' });
    await db.insert(contentTranslations).values({ contentId: content.id, lang: 'en', title: 'English' });

    // Verify translations exist
    let translations = await db.select().from(contentTranslations);
    expect(translations).toHaveLength(2);

    // Delete content_base
    await db.delete(contentBase).where(eq(contentBase.id, content.id));

    // Translations should be deleted via CASCADE
    translations = await db.select().from(contentTranslations);
    expect(translations).toHaveLength(0);
  });

  test('foreign key CASCADE DELETE removes project_technologies when project deleted', async () => {
    const now = new Date();

    // Create project with technologies
    const [content] = await db.insert(contentBase).values({
      type: 'project',
      slug: 'project-cascade',
      createdAt: now,
      updatedAt: now,
    }).returning();

    const [project] = await db.insert(projects).values({ contentId: content.id }).returning();

    const [tech1] = await db.insert(technologies).values({ name: 'React' }).returning();
    const [tech2] = await db.insert(technologies).values({ name: 'TypeScript' }).returning();

    await db.insert(projectTechnologies).values({ projectId: project.id, technologyId: tech1.id });
    await db.insert(projectTechnologies).values({ projectId: project.id, technologyId: tech2.id });

    // Verify links exist
    let links = await db.select().from(projectTechnologies);
    expect(links).toHaveLength(2);

    // Delete project
    await db.delete(projects).where(eq(projects.id, project.id));

    // Links should be deleted via CASCADE
    links = await db.select().from(projectTechnologies);
    expect(links).toHaveLength(0);

    // Technologies should still exist
    const remainingTech = await db.select().from(technologies);
    expect(remainingTech).toHaveLength(2);
  });

  test('projects content_id UNIQUE constraint prevents duplicate extensions', async () => {
    const now = new Date();

    // Create content
    const [content] = await db.insert(contentBase).values({
      type: 'project',
      slug: 'unique-project',
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Create first project extension
    await db.insert(projects).values({
      contentId: content.id,
      projectStatus: 'in-progress',
    });

    // Attempting to create second project for same content should fail
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
  });

  test('inserting and querying data across related tables', async () => {
    const now = new Date();

    // Create a complete project with translations and technologies
    const [content] = await db.insert(contentBase).values({
      type: 'project',
      slug: 'full-project',
      status: 'published',
      featured: true,
      createdAt: now,
      updatedAt: now,
      publishedAt: now,
    }).returning();

    // Add translations
    await db.insert(contentTranslations).values({
      contentId: content.id,
      lang: 'it',
      title: 'Progetto Completo',
      description: 'Descrizione del progetto',
      body: '# Markdown content',
      metaTitle: 'SEO Title IT',
      metaDescription: 'SEO Description IT',
    });

    await db.insert(contentTranslations).values({
      contentId: content.id,
      lang: 'en',
      title: 'Full Project',
      description: 'Project description',
      body: '# Markdown content EN',
      metaTitle: 'SEO Title EN',
      metaDescription: 'SEO Description EN',
    });

    // Add project extension
    const [project] = await db.insert(projects).values({
      contentId: content.id,
      githubUrl: 'https://github.com/user/repo',
      demoUrl: 'https://demo.example.com',
      projectStatus: 'completed',
      startDate: new Date(now.getTime() - 86400000),
      endDate: now,
    }).returning();

    // Add technologies
    const [tech1] = await db.insert(technologies).values({ name: 'TypeScript', color: '#3178c6' }).returning();
    const [tech2] = await db.insert(technologies).values({ name: 'React', color: '#61dafb' }).returning();

    // Link technologies
    await db.insert(projectTechnologies).values({ projectId: project.id, technologyId: tech1.id });
    await db.insert(projectTechnologies).values({ projectId: project.id, technologyId: tech2.id });

    // Query and verify all data
    const contentResult = await db.select().from(contentBase);
    expect(contentResult).toHaveLength(1);
    expect(contentResult[0].type).toBe('project');
    expect(contentResult[0].status).toBe('published');
    expect(contentResult[0].featured).toBe(true);

    const translationsResult = await db.select().from(contentTranslations);
    expect(translationsResult).toHaveLength(2);

    const projectResult = await db.select().from(projects);
    expect(projectResult).toHaveLength(1);
    expect(projectResult[0].projectStatus).toBe('completed');
    expect(projectResult[0].githubUrl).toBe('https://github.com/user/repo');

    const linksResult = await db.select().from(projectTechnologies);
    expect(linksResult).toHaveLength(2);
  });
});
