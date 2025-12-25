/**
 * Core Table Schema Tests
 *
 * Tests for content_base, content_translations, projects, materials, and news tables.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq } from 'drizzle-orm';
import { contentBase } from './schema/content-base';
import { contentTranslations } from './schema/content-translations';
import { projects } from './schema/projects';
import { materials } from './schema/materials';
import { news } from './schema/news';

// SQL to create tables with CHECK constraints (simulating migration)
const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS content_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('project', 'material', 'news')),
    slug TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    featured INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    published_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS content_translations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL REFERENCES content_base(id) ON DELETE CASCADE,
    lang TEXT NOT NULL CHECK (lang IN ('it', 'en', 'es', 'de')),
    title TEXT NOT NULL,
    description TEXT,
    body TEXT,
    meta_title TEXT,
    meta_description TEXT,
    UNIQUE(content_id, lang)
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL UNIQUE REFERENCES content_base(id) ON DELETE CASCADE,
    github_url TEXT,
    demo_url TEXT,
    project_status TEXT NOT NULL DEFAULT 'in-progress' CHECK (project_status IN ('in-progress', 'completed', 'archived')),
    start_date INTEGER,
    end_date INTEGER
  );

  CREATE TABLE IF NOT EXISTS materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL UNIQUE REFERENCES content_base(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('guide', 'template', 'resource', 'tool')),
    download_url TEXT NOT NULL,
    file_size INTEGER
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL UNIQUE REFERENCES content_base(id) ON DELETE CASCADE,
    cover_image TEXT,
    reading_time INTEGER
  );
`;

describe('Core Table Schemas', () => {
  let sqlite: Database;
  let db: ReturnType<typeof drizzle>;

  beforeAll(() => {
    sqlite = new Database(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON');
    sqlite.exec(CREATE_TABLES_SQL);
    db = drizzle(sqlite);
  });

  afterAll(() => {
    sqlite.close();
  });

  beforeEach(() => {
    // Clean tables before each test
    sqlite.exec('DELETE FROM news');
    sqlite.exec('DELETE FROM materials');
    sqlite.exec('DELETE FROM projects');
    sqlite.exec('DELETE FROM content_translations');
    sqlite.exec('DELETE FROM content_base');
  });

  test('content_base table structure and CHECK constraints work correctly', () => {
    // Valid type values should work
    const now = Date.now();
    db.insert(contentBase).values({
      type: 'project',
      slug: 'test-project',
      status: 'draft',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }).run();

    const result = db.select().from(contentBase).all();
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('project');
    expect(result[0].status).toBe('draft');

    // Invalid type should fail CHECK constraint
    expect(() => {
      sqlite.exec(`
        INSERT INTO content_base (type, slug, status, created_at, updated_at)
        VALUES ('invalid_type', 'test-slug', 'draft', ${now}, ${now})
      `);
    }).toThrow();

    // Invalid status should fail CHECK constraint
    expect(() => {
      sqlite.exec(`
        INSERT INTO content_base (type, slug, status, created_at, updated_at)
        VALUES ('project', 'test-slug-2', 'invalid_status', ${now}, ${now})
      `);
    }).toThrow();
  });

  test('content_translations composite unique constraint prevents duplicates', () => {
    const now = Date.now();

    // Insert base content
    db.insert(contentBase).values({
      type: 'project',
      slug: 'unique-test',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }).run();

    const content = db.select().from(contentBase).all()[0];

    // Insert first translation
    db.insert(contentTranslations).values({
      contentId: content.id,
      lang: 'it',
      title: 'Titolo Italiano',
    }).run();

    // Inserting duplicate (same content_id + lang) should fail
    expect(() => {
      db.insert(contentTranslations).values({
        contentId: content.id,
        lang: 'it',
        title: 'Altro Titolo',
      }).run();
    }).toThrow();

    // Different language should work
    db.insert(contentTranslations).values({
      contentId: content.id,
      lang: 'en',
      title: 'English Title',
    }).run();

    const translations = db.select().from(contentTranslations).all();
    expect(translations).toHaveLength(2);
  });

  test('projects table maintains one-to-one relationship with content_base', () => {
    const now = Date.now();

    // Insert base content
    db.insert(contentBase).values({
      type: 'project',
      slug: 'project-test',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }).run();

    const content = db.select().from(contentBase).all()[0];

    // Insert project extension
    db.insert(projects).values({
      contentId: content.id,
      projectStatus: 'in-progress',
    }).run();

    // Trying to insert another project for the same content should fail (UNIQUE constraint)
    expect(() => {
      db.insert(projects).values({
        contentId: content.id,
        projectStatus: 'completed',
      }).run();
    }).toThrow();

    const allProjects = db.select().from(projects).all();
    expect(allProjects).toHaveLength(1);
    expect(allProjects[0].contentId).toBe(content.id);
  });

  test('materials table CHECK constraint validates category field', () => {
    const now = Date.now();

    // Insert base content
    db.insert(contentBase).values({
      type: 'material',
      slug: 'material-test',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }).run();

    const content = db.select().from(contentBase).all()[0];

    // Valid category should work
    db.insert(materials).values({
      contentId: content.id,
      category: 'guide',
      downloadUrl: 'https://example.com/file.pdf',
    }).run();

    const result = db.select().from(materials).all();
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('guide');

    // Invalid category should fail CHECK constraint
    expect(() => {
      sqlite.exec(`
        INSERT INTO materials (content_id, category, download_url)
        VALUES (999, 'invalid_category', 'https://example.com/file.pdf')
      `);
    }).toThrow();
  });

  test('news table foreign key relationship works with CASCADE DELETE', () => {
    const now = Date.now();

    // Insert base content
    db.insert(contentBase).values({
      type: 'news',
      slug: 'news-test',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }).run();

    const content = db.select().from(contentBase).all()[0];

    // Insert news extension
    db.insert(news).values({
      contentId: content.id,
      readingTime: 5,
    }).run();

    let newsItems = db.select().from(news).all();
    expect(newsItems).toHaveLength(1);

    // Delete content_base should cascade to news
    db.delete(contentBase).where(eq(contentBase.id, content.id)).run();

    newsItems = db.select().from(news).all();
    expect(newsItems).toHaveLength(0);
  });

  test('required fields are enforced and nullable fields accept null', () => {
    const now = Date.now();

    // Test that required fields are enforced
    expect(() => {
      sqlite.exec(`INSERT INTO content_base (slug, status) VALUES ('missing-type', 'draft')`);
    }).toThrow();

    // Insert valid content with all nullable fields as null
    db.insert(contentBase).values({
      type: 'project',
      slug: 'nullable-test',
      createdAt: new Date(now),
      updatedAt: new Date(now),
      publishedAt: null, // nullable
    }).run();

    const content = db.select().from(contentBase).all()[0];

    // Insert translation with nullable fields
    db.insert(contentTranslations).values({
      contentId: content.id,
      lang: 'it',
      title: 'Required Title',
      description: null, // nullable
      body: null, // nullable
      metaTitle: null, // nullable
      metaDescription: null, // nullable
    }).run();

    // Insert project with nullable fields
    db.insert(projects).values({
      contentId: content.id,
      githubUrl: null, // nullable
      demoUrl: null, // nullable
      startDate: null, // nullable
      endDate: null, // nullable
    }).run();

    const allContent = db.select().from(contentBase).all();
    const allTranslations = db.select().from(contentTranslations).all();
    const allProjects = db.select().from(projects).all();

    expect(allContent).toHaveLength(1);
    expect(allContent[0].publishedAt).toBeNull();
    expect(allTranslations).toHaveLength(1);
    expect(allTranslations[0].description).toBeNull();
    expect(allProjects).toHaveLength(1);
    expect(allProjects[0].githubUrl).toBeNull();
  });
});
