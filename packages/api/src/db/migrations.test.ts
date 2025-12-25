/**
 * Migration and Database Integrity Tests
 *
 * Tests for migration validation, CHECK constraints, foreign key cascades,
 * and data integrity across all 10 tables.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

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

describe('Migration and Database Integrity', () => {
  let sqlite: Database;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    sqlite = new Database(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON');

    // Read and execute the migration SQL (relative to this file)
    const migrationPath = join(import.meta.dir, 'migrations', '0000_initial_schema.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');

    // Split by statement breakpoint and execute each statement
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      sqlite.exec(statement);
    }

    db = drizzle(sqlite);
  });

  afterAll(() => {
    sqlite.close();
  });

  beforeEach(() => {
    // Clean tables in correct order (respecting foreign keys)
    sqlite.exec('DELETE FROM news_tags');
    sqlite.exec('DELETE FROM project_technologies');
    sqlite.exec('DELETE FROM news');
    sqlite.exec('DELETE FROM materials');
    sqlite.exec('DELETE FROM projects');
    sqlite.exec('DELETE FROM content_translations');
    sqlite.exec('DELETE FROM content_base');
    sqlite.exec('DELETE FROM technologies');
    sqlite.exec('DELETE FROM tags');
    sqlite.exec('DELETE FROM media');
  });

  test('all 10 tables are created successfully after migration', () => {
    const tables = sqlite
      .query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as { name: string }[];

    const tableNames = tables.map((t) => t.name).sort();

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
    expect(tableNames.length).toBeGreaterThanOrEqual(10);
  });

  test('content_base CHECK constraint rejects invalid type values', () => {
    const now = Date.now();

    // Valid type should work
    db.insert(contentBase)
      .values({
        type: 'project',
        slug: 'valid-type',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      })
      .run();

    const validResult = db.select().from(contentBase).all();
    expect(validResult).toHaveLength(1);

    // Invalid type should fail CHECK constraint
    expect(() => {
      sqlite.exec(`
        INSERT INTO content_base (type, slug, status, featured, created_at, updated_at)
        VALUES ('invalid_type', 'invalid-slug', 'draft', 0, ${now}, ${now})
      `);
    }).toThrow();
  });

  test('content_base CHECK constraint rejects invalid status values', () => {
    const now = Date.now();

    // Valid status values
    const validStatuses = ['draft', 'published', 'archived'];

    for (const status of validStatuses) {
      db.insert(contentBase)
        .values({
          type: 'project',
          slug: `status-${status}`,
          status: status as 'draft' | 'published' | 'archived',
          createdAt: new Date(now),
          updatedAt: new Date(now),
        })
        .run();
    }

    const validResults = db.select().from(contentBase).all();
    expect(validResults).toHaveLength(3);

    // Invalid status should fail CHECK constraint
    expect(() => {
      sqlite.exec(`
        INSERT INTO content_base (type, slug, status, featured, created_at, updated_at)
        VALUES ('project', 'invalid-status-slug', 'pending', 0, ${now}, ${now})
      `);
    }).toThrow();
  });

  test('content_translations composite unique prevents duplicate (content_id, lang)', () => {
    const now = Date.now();

    // Create base content
    db.insert(contentBase)
      .values({
        type: 'project',
        slug: 'unique-test',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      })
      .run();

    const content = db.select().from(contentBase).all()[0];

    // Insert first translation
    db.insert(contentTranslations)
      .values({
        contentId: content.id,
        lang: 'it',
        title: 'Titolo Italiano',
      })
      .run();

    // Duplicate (content_id, lang) should fail
    expect(() => {
      db.insert(contentTranslations)
        .values({
          contentId: content.id,
          lang: 'it',
          title: 'Another Italian Title',
        })
        .run();
    }).toThrow();

    // Different language for same content should work
    db.insert(contentTranslations)
      .values({
        contentId: content.id,
        lang: 'en',
        title: 'English Title',
      })
      .run();

    const translations = db.select().from(contentTranslations).all();
    expect(translations).toHaveLength(2);
  });

  test('foreign key CASCADE DELETE removes content_translations when content_base deleted', () => {
    const now = Date.now();

    // Create content with translations
    db.insert(contentBase)
      .values({
        type: 'project',
        slug: 'cascade-test',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      })
      .run();

    const content = db.select().from(contentBase).all()[0];

    db.insert(contentTranslations)
      .values({ contentId: content.id, lang: 'it', title: 'Italian' })
      .run();
    db.insert(contentTranslations)
      .values({ contentId: content.id, lang: 'en', title: 'English' })
      .run();

    // Verify translations exist
    let translations = db.select().from(contentTranslations).all();
    expect(translations).toHaveLength(2);

    // Delete content_base
    db.delete(contentBase).where(eq(contentBase.id, content.id)).run();

    // Translations should be deleted via CASCADE
    translations = db.select().from(contentTranslations).all();
    expect(translations).toHaveLength(0);
  });

  test('foreign key CASCADE DELETE removes project_technologies when project deleted', () => {
    const now = Date.now();

    // Create project with technologies
    db.insert(contentBase)
      .values({
        type: 'project',
        slug: 'project-cascade',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      })
      .run();

    const content = db.select().from(contentBase).all()[0];

    db.insert(projects).values({ contentId: content.id }).run();

    const project = db.select().from(projects).all()[0];

    db.insert(technologies).values({ name: 'React' }).run();
    db.insert(technologies).values({ name: 'TypeScript' }).run();

    const allTech = db.select().from(technologies).all();

    db.insert(projectTechnologies)
      .values({ projectId: project.id, technologyId: allTech[0].id })
      .run();
    db.insert(projectTechnologies)
      .values({ projectId: project.id, technologyId: allTech[1].id })
      .run();

    // Verify links exist
    let links = db.select().from(projectTechnologies).all();
    expect(links).toHaveLength(2);

    // Delete project
    db.delete(projects).where(eq(projects.id, project.id)).run();

    // Links should be deleted via CASCADE
    links = db.select().from(projectTechnologies).all();
    expect(links).toHaveLength(0);

    // Technologies should still exist
    const remainingTech = db.select().from(technologies).all();
    expect(remainingTech).toHaveLength(2);
  });

  test('projects content_id UNIQUE constraint prevents duplicate extensions', () => {
    const now = Date.now();

    // Create content
    db.insert(contentBase)
      .values({
        type: 'project',
        slug: 'unique-project',
        createdAt: new Date(now),
        updatedAt: new Date(now),
      })
      .run();

    const content = db.select().from(contentBase).all()[0];

    // Create first project extension
    db.insert(projects)
      .values({
        contentId: content.id,
        projectStatus: 'in-progress',
      })
      .run();

    // Attempting to create second project for same content should fail
    expect(() => {
      db.insert(projects)
        .values({
          contentId: content.id,
          projectStatus: 'completed',
        })
        .run();
    }).toThrow();

    const allProjects = db.select().from(projects).all();
    expect(allProjects).toHaveLength(1);
  });

  test('inserting and querying data across related tables', () => {
    const now = Date.now();

    // Create a complete project with translations and technologies
    db.insert(contentBase)
      .values({
        type: 'project',
        slug: 'full-project',
        status: 'published',
        featured: true,
        createdAt: new Date(now),
        updatedAt: new Date(now),
        publishedAt: new Date(now),
      })
      .run();

    const content = db.select().from(contentBase).all()[0];

    // Add translations
    db.insert(contentTranslations)
      .values({
        contentId: content.id,
        lang: 'it',
        title: 'Progetto Completo',
        description: 'Descrizione del progetto',
        body: '# Markdown content',
        metaTitle: 'SEO Title IT',
        metaDescription: 'SEO Description IT',
      })
      .run();

    db.insert(contentTranslations)
      .values({
        contentId: content.id,
        lang: 'en',
        title: 'Full Project',
        description: 'Project description',
        body: '# Markdown content EN',
        metaTitle: 'SEO Title EN',
        metaDescription: 'SEO Description EN',
      })
      .run();

    // Add project extension
    db.insert(projects)
      .values({
        contentId: content.id,
        githubUrl: 'https://github.com/user/repo',
        demoUrl: 'https://demo.example.com',
        projectStatus: 'completed',
        startDate: new Date(now - 86400000),
        endDate: new Date(now),
      })
      .run();

    // Add technologies
    db.insert(technologies).values({ name: 'TypeScript', color: '#3178c6' }).run();
    db.insert(technologies).values({ name: 'React', color: '#61dafb' }).run();

    const project = db.select().from(projects).all()[0];
    const allTech = db.select().from(technologies).all();

    // Link technologies
    db.insert(projectTechnologies)
      .values({ projectId: project.id, technologyId: allTech[0].id })
      .run();
    db.insert(projectTechnologies)
      .values({ projectId: project.id, technologyId: allTech[1].id })
      .run();

    // Query and verify all data
    const contentResult = db.select().from(contentBase).all();
    expect(contentResult).toHaveLength(1);
    expect(contentResult[0].type).toBe('project');
    expect(contentResult[0].status).toBe('published');
    expect(contentResult[0].featured).toBe(true);

    const translationsResult = db.select().from(contentTranslations).all();
    expect(translationsResult).toHaveLength(2);

    const projectResult = db.select().from(projects).all();
    expect(projectResult).toHaveLength(1);
    expect(projectResult[0].projectStatus).toBe('completed');
    expect(projectResult[0].githubUrl).toBe('https://github.com/user/repo');

    const linksResult = db.select().from(projectTechnologies).all();
    expect(linksResult).toHaveLength(2);
  });
});
