/**
 * Supporting Tables and Junction Tables Tests
 *
 * Tests for technologies, tags, media, project_technologies, and news_tags tables.
 */
import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq } from 'drizzle-orm';
import { technologies } from './schema/technologies';
import { tags } from './schema/tags';
import { media } from './schema/media';
import { contentBase } from './schema/content-base';
import { projects } from './schema/projects';
import { news } from './schema/news';
import { projectTechnologies } from './schema/project-technologies';
import { newsTags } from './schema/news-tags';

// SQL to create all tables with proper constraints
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

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL UNIQUE REFERENCES content_base(id) ON DELETE CASCADE,
    github_url TEXT,
    demo_url TEXT,
    project_status TEXT NOT NULL DEFAULT 'in-progress' CHECK (project_status IN ('in-progress', 'completed', 'archived')),
    start_date INTEGER,
    end_date INTEGER
  );

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL UNIQUE REFERENCES content_base(id) ON DELETE CASCADE,
    cover_image TEXT,
    reading_time INTEGER
  );

  CREATE TABLE IF NOT EXISTS technologies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
  );

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

  CREATE TABLE IF NOT EXISTS project_technologies (
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    technology_id INTEGER NOT NULL REFERENCES technologies(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, technology_id)
  );

  CREATE TABLE IF NOT EXISTS news_tags (
    news_id INTEGER NOT NULL REFERENCES news(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (news_id, tag_id)
  );
`;

describe('Supporting Tables and Junction Tables', () => {
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
    // Clean tables in correct order (respecting foreign keys)
    sqlite.exec('DELETE FROM news_tags');
    sqlite.exec('DELETE FROM project_technologies');
    sqlite.exec('DELETE FROM news');
    sqlite.exec('DELETE FROM projects');
    sqlite.exec('DELETE FROM content_base');
    sqlite.exec('DELETE FROM technologies');
    sqlite.exec('DELETE FROM tags');
    sqlite.exec('DELETE FROM media');
  });

  test('technologies table unique constraint on name field', () => {
    // Insert first technology
    db.insert(technologies).values({
      name: 'TypeScript',
      icon: 'typescript-icon',
      color: '#3178c6',
    }).run();

    const result = db.select().from(technologies).all();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('TypeScript');

    // Inserting duplicate name should fail
    expect(() => {
      db.insert(technologies).values({
        name: 'TypeScript',
        icon: 'different-icon',
      }).run();
    }).toThrow();

    // Different name should work
    db.insert(technologies).values({
      name: 'React',
      color: '#61dafb',
    }).run();

    const allTech = db.select().from(technologies).all();
    expect(allTech).toHaveLength(2);
  });

  test('tags table unique constraint on slug field', () => {
    // Insert first tag
    db.insert(tags).values({
      name: 'Web Development',
      slug: 'web-dev',
    }).run();

    const result = db.select().from(tags).all();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('web-dev');

    // Inserting duplicate slug should fail
    expect(() => {
      db.insert(tags).values({
        name: 'Web Developer',
        slug: 'web-dev',
      }).run();
    }).toThrow();

    // Different slug should work (same name is allowed)
    db.insert(tags).values({
      name: 'Web Development',
      slug: 'web-development',
    }).run();

    const allTags = db.select().from(tags).all();
    expect(allTags).toHaveLength(2);
  });

  test('media table required fields and storage_key uniqueness', () => {
    const now = Date.now();

    // Insert valid media
    db.insert(media).values({
      filename: 'image.png',
      mimeType: 'image/png',
      size: 1024,
      storageKey: 'uploads/2024/01/image.png',
      createdAt: new Date(now),
    }).run();

    const result = db.select().from(media).all();
    expect(result).toHaveLength(1);
    expect(result[0].filename).toBe('image.png');
    expect(result[0].mimeType).toBe('image/png');
    expect(result[0].size).toBe(1024);

    // Duplicate storage_key should fail
    expect(() => {
      db.insert(media).values({
        filename: 'another-image.png',
        mimeType: 'image/png',
        size: 2048,
        storageKey: 'uploads/2024/01/image.png',
        createdAt: new Date(now),
      }).run();
    }).toThrow();

    // Required fields missing should fail
    expect(() => {
      sqlite.exec(`INSERT INTO media (filename, storage_key, created_at) VALUES ('test.jpg', 'unique-key', ${now})`);
    }).toThrow();
  });

  test('project_technologies junction table composite primary key', () => {
    const now = Date.now();

    // Create project content
    db.insert(contentBase).values({
      type: 'project',
      slug: 'test-project',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }).run();
    const content = db.select().from(contentBase).all()[0];

    // Create project extension
    db.insert(projects).values({
      contentId: content.id,
      projectStatus: 'in-progress',
    }).run();
    const project = db.select().from(projects).all()[0];

    // Create technologies
    db.insert(technologies).values({ name: 'TypeScript' }).run();
    db.insert(technologies).values({ name: 'React' }).run();
    const allTech = db.select().from(technologies).all();

    // Link project to technologies
    db.insert(projectTechnologies).values({
      projectId: project.id,
      technologyId: allTech[0].id,
    }).run();

    db.insert(projectTechnologies).values({
      projectId: project.id,
      technologyId: allTech[1].id,
    }).run();

    const links = db.select().from(projectTechnologies).all();
    expect(links).toHaveLength(2);

    // Duplicate link should fail (composite primary key)
    expect(() => {
      db.insert(projectTechnologies).values({
        projectId: project.id,
        technologyId: allTech[0].id,
      }).run();
    }).toThrow();
  });

  test('news_tags junction table composite primary key', () => {
    const now = Date.now();

    // Create news content
    db.insert(contentBase).values({
      type: 'news',
      slug: 'test-news',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }).run();
    const content = db.select().from(contentBase).all()[0];

    // Create news extension
    db.insert(news).values({
      contentId: content.id,
      readingTime: 5,
    }).run();
    const newsItem = db.select().from(news).all()[0];

    // Create tags
    db.insert(tags).values({ name: 'Tech', slug: 'tech' }).run();
    db.insert(tags).values({ name: 'Tutorial', slug: 'tutorial' }).run();
    const allTags = db.select().from(tags).all();

    // Link news to tags
    db.insert(newsTags).values({
      newsId: newsItem.id,
      tagId: allTags[0].id,
    }).run();

    db.insert(newsTags).values({
      newsId: newsItem.id,
      tagId: allTags[1].id,
    }).run();

    const links = db.select().from(newsTags).all();
    expect(links).toHaveLength(2);

    // Duplicate link should fail (composite primary key)
    expect(() => {
      db.insert(newsTags).values({
        newsId: newsItem.id,
        tagId: allTags[0].id,
      }).run();
    }).toThrow();
  });

  test('CASCADE DELETE behavior on junction table foreign keys', () => {
    const now = Date.now();

    // Create project with technology links
    db.insert(contentBase).values({
      type: 'project',
      slug: 'cascade-test',
      createdAt: new Date(now),
      updatedAt: new Date(now),
    }).run();
    const content = db.select().from(contentBase).all()[0];

    db.insert(projects).values({
      contentId: content.id,
    }).run();
    const project = db.select().from(projects).all()[0];

    db.insert(technologies).values({ name: 'Node.js' }).run();
    const tech = db.select().from(technologies).all()[0];

    db.insert(projectTechnologies).values({
      projectId: project.id,
      technologyId: tech.id,
    }).run();

    // Verify link exists
    let links = db.select().from(projectTechnologies).all();
    expect(links).toHaveLength(1);

    // Delete project should cascade to junction table
    db.delete(projects).where(eq(projects.id, project.id)).run();

    links = db.select().from(projectTechnologies).all();
    expect(links).toHaveLength(0);

    // Technology should still exist (only junction record deleted)
    const remainingTech = db.select().from(technologies).all();
    expect(remainingTech).toHaveLength(1);

    // Also test deleting technology cascades to junction
    // First recreate the setup
    db.insert(projects).values({
      contentId: content.id,
    }).run();
    const newProject = db.select().from(projects).all()[0];

    db.insert(projectTechnologies).values({
      projectId: newProject.id,
      technologyId: tech.id,
    }).run();

    links = db.select().from(projectTechnologies).all();
    expect(links).toHaveLength(1);

    // Delete technology should cascade to junction table
    db.delete(technologies).where(eq(technologies.id, tech.id)).run();

    links = db.select().from(projectTechnologies).all();
    expect(links).toHaveLength(0);
  });
});
