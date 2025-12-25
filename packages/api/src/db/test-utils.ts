/**
 * Database Test Utilities
 *
 * Provides helper functions for testing database operations.
 * Includes in-memory database initialization, reset functions, and seeding utilities.
 */
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq } from 'drizzle-orm';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import * as schema from './schema';

// Path to migrations directory (relative to this file)
const MIGRATIONS_DIR = join(import.meta.dir, 'migrations');

type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Creates an in-memory test database with all tables created.
 * Applies all migrations in order and enables foreign keys.
 *
 * @returns Object containing SQLite connection and Drizzle instance
 */
export function createTestDatabase(): { sqlite: Database; db: DrizzleDB } {
  const sqlite = new Database(':memory:');

  // Enable foreign keys
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec('PRAGMA synchronous = NORMAL');

  // Get all migration files sorted by name
  const migrationFiles = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  // Apply each migration in order
  for (const file of migrationFiles) {
    const migrationSql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    const statements = migrationSql
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      sqlite.exec(statement);
    }
  }

  const db = drizzle(sqlite, { schema });

  return { sqlite, db };
}

/**
 * Resets all tables in the database by deleting all rows.
 * Respects foreign key constraints by deleting in correct order.
 *
 * @param sqlite - SQLite database connection
 */
export function resetDatabase(sqlite: Database): void {
  // Delete in order respecting foreign keys
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
}

/**
 * Closes the database connection and cleans up resources.
 *
 * @param sqlite - SQLite database connection
 */
export function closeDatabase(sqlite: Database): void {
  sqlite.close();
}

/**
 * Seeds a project with all related data (translations, extension, technologies).
 *
 * @param db - Drizzle database instance
 * @param options - Seed options
 * @returns Created project data
 */
export async function seedProject(
  db: DrizzleDB,
  options: {
    slug: string;
    status?: 'draft' | 'published' | 'archived';
    featured?: boolean;
    translations?: Array<{
      lang: 'it' | 'en' | 'es' | 'de';
      title: string;
      description?: string;
      body?: string;
    }>;
    technologies?: string[];
  }
): Promise<{
  contentId: number;
  projectId: number;
  technologyIds: number[];
}> {
  const now = new Date();

  // Insert content_base
  db.insert(schema.contentBase)
    .values({
      type: 'project',
      slug: options.slug,
      status: options.status ?? 'draft',
      featured: options.featured ?? false,
      createdAt: now,
      updatedAt: now,
      publishedAt: options.status === 'published' ? now : null,
    })
    .run();

  const content = db.select().from(schema.contentBase).all().pop()!;

  // Insert translations
  if (options.translations) {
    for (const trans of options.translations) {
      db.insert(schema.contentTranslations)
        .values({
          contentId: content.id,
          lang: trans.lang,
          title: trans.title,
          description: trans.description,
          body: trans.body,
        })
        .run();
    }
  }

  // Insert project extension
  db.insert(schema.projects)
    .values({
      contentId: content.id,
      projectStatus: 'in-progress',
    })
    .run();

  const project = db.select().from(schema.projects).all().pop()!;

  // Insert technologies and link to project
  const technologyIds: number[] = [];
  if (options.technologies) {
    for (const techName of options.technologies) {
      // Check if technology already exists using proper Drizzle syntax
      const existing = db
        .select()
        .from(schema.technologies)
        .where(eq(schema.technologies.name, techName))
        .all();

      let techId: number;
      if (existing.length === 0) {
        db.insert(schema.technologies).values({ name: techName }).run();
        const newTech = db.select().from(schema.technologies).all().pop()!;
        techId = newTech.id;
      } else {
        techId = existing[0].id;
      }

      // Only add if not already in the array (avoid duplicate links)
      if (!technologyIds.includes(techId)) {
        technologyIds.push(techId);

        // Link to project
        db.insert(schema.projectTechnologies)
          .values({
            projectId: project.id,
            technologyId: techId,
          })
          .run();
      }
    }
  }

  return {
    contentId: content.id,
    projectId: project.id,
    technologyIds,
  };
}

/**
 * Seeds a news article with all related data (translations, extension, tags).
 *
 * @param db - Drizzle database instance
 * @param options - Seed options
 * @returns Created news data
 */
export async function seedNews(
  db: DrizzleDB,
  options: {
    slug: string;
    status?: 'draft' | 'published' | 'archived';
    translations?: Array<{
      lang: 'it' | 'en' | 'es' | 'de';
      title: string;
      description?: string;
      body?: string;
    }>;
    tags?: Array<{ name: string; slug: string }>;
    readingTime?: number;
  }
): Promise<{
  contentId: number;
  newsId: number;
  tagIds: number[];
}> {
  const now = new Date();

  // Insert content_base
  db.insert(schema.contentBase)
    .values({
      type: 'news',
      slug: options.slug,
      status: options.status ?? 'draft',
      createdAt: now,
      updatedAt: now,
      publishedAt: options.status === 'published' ? now : null,
    })
    .run();

  const content = db.select().from(schema.contentBase).all().pop()!;

  // Insert translations
  if (options.translations) {
    for (const trans of options.translations) {
      db.insert(schema.contentTranslations)
        .values({
          contentId: content.id,
          lang: trans.lang,
          title: trans.title,
          description: trans.description,
          body: trans.body,
        })
        .run();
    }
  }

  // Insert news extension
  db.insert(schema.news)
    .values({
      contentId: content.id,
      readingTime: options.readingTime ?? 5,
    })
    .run();

  const newsItem = db.select().from(schema.news).all().pop()!;

  // Insert tags
  const tagIds: number[] = [];
  if (options.tags) {
    for (const tagData of options.tags) {
      db.insert(schema.tags)
        .values({
          name: tagData.name,
          slug: tagData.slug,
        })
        .run();

      const newTag = db.select().from(schema.tags).all().pop()!;
      tagIds.push(newTag.id);

      // Link to news
      db.insert(schema.newsTags)
        .values({
          newsId: newsItem.id,
          tagId: newTag.id,
        })
        .run();
    }
  }

  return {
    contentId: content.id,
    newsId: newsItem.id,
    tagIds,
  };
}

/**
 * Seeds a material with all related data.
 *
 * @param db - Drizzle database instance
 * @param options - Seed options
 * @returns Created material data
 */
export async function seedMaterial(
  db: DrizzleDB,
  options: {
    slug: string;
    category: 'guide' | 'template' | 'resource' | 'tool';
    downloadUrl: string;
    fileSize?: number;
    status?: 'draft' | 'published' | 'archived';
    translations?: Array<{
      lang: 'it' | 'en' | 'es' | 'de';
      title: string;
      description?: string;
    }>;
  }
): Promise<{
  contentId: number;
  materialId: number;
}> {
  const now = new Date();

  // Insert content_base
  db.insert(schema.contentBase)
    .values({
      type: 'material',
      slug: options.slug,
      status: options.status ?? 'draft',
      createdAt: now,
      updatedAt: now,
      publishedAt: options.status === 'published' ? now : null,
    })
    .run();

  const content = db.select().from(schema.contentBase).all().pop()!;

  // Insert translations
  if (options.translations) {
    for (const trans of options.translations) {
      db.insert(schema.contentTranslations)
        .values({
          contentId: content.id,
          lang: trans.lang,
          title: trans.title,
          description: trans.description,
        })
        .run();
    }
  }

  // Insert material extension
  db.insert(schema.materials)
    .values({
      contentId: content.id,
      category: options.category,
      downloadUrl: options.downloadUrl,
      fileSize: options.fileSize,
    })
    .run();

  const material = db.select().from(schema.materials).all().pop()!;

  return {
    contentId: content.id,
    materialId: material.id,
  };
}

/**
 * Seeds a media item.
 *
 * @param db - Drizzle database instance
 * @param options - Seed options
 * @returns Created media data
 */
export async function seedMedia(
  db: DrizzleDB,
  options: {
    filename: string;
    mimeType: string;
    size: number;
    storageKey: string;
    altText?: string;
  }
): Promise<{
  mediaId: number;
}> {
  db.insert(schema.media)
    .values({
      filename: options.filename,
      mimeType: options.mimeType,
      size: options.size,
      storageKey: options.storageKey,
      altText: options.altText,
      createdAt: new Date(),
    })
    .run();

  const mediaItem = db.select().from(schema.media).all().pop()!;

  return {
    mediaId: mediaItem.id,
  };
}
