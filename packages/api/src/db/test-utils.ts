/**
 * Database Test Utilities
 *
 * Provides helper functions for testing database operations.
 * Uses PostgreSQL with connection pooling for test isolation.
 */
import postgres from 'postgres';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import * as schema from './schema';

type DrizzleDB = PostgresJsDatabase<typeof schema>;

/** Default test database URL */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'postgres://portfolio:portfolio_dev@localhost:5433/portfolio';

/**
 * Creates a test database connection.
 * Uses the test database URL from environment or defaults to dev database.
 *
 * @returns Object containing postgres client and Drizzle instance
 */
export function createTestDatabase(): { client: ReturnType<typeof postgres>; db: DrizzleDB } {
  const client = postgres(TEST_DATABASE_URL, { max: 1 });
  const db = drizzle(client, { schema });

  return { client, db };
}

/**
 * Resets all tables in the database by truncating them.
 * Uses TRUNCATE CASCADE to handle foreign key constraints.
 *
 * @param db - Drizzle database instance
 */
export async function resetDatabase(db: DrizzleDB): Promise<void> {
  // Truncate all tables in correct order with CASCADE
  await db.execute(sql`TRUNCATE TABLE
    news_tags,
    project_technologies,
    project_media,
    news,
    materials,
    projects,
    content_translations,
    content_base,
    technologies,
    tags,
    media
    RESTART IDENTITY CASCADE`);
}

/**
 * Closes the database connection and cleans up resources.
 *
 * @param client - postgres.js client instance
 */
export async function closeDatabase(client: ReturnType<typeof postgres>): Promise<void> {
  await client.end();
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
  const [content] = await db
    .insert(schema.contentBase)
    .values({
      type: 'project',
      slug: options.slug,
      status: options.status ?? 'draft',
      featured: options.featured ?? false,
      createdAt: now,
      updatedAt: now,
      publishedAt: options.status === 'published' ? now : null,
    })
    .returning();

  // Insert translations
  if (options.translations) {
    for (const trans of options.translations) {
      await db.insert(schema.contentTranslations).values({
        contentId: content.id,
        lang: trans.lang,
        title: trans.title,
        description: trans.description,
        body: trans.body,
      });
    }
  }

  // Insert project extension
  const [project] = await db
    .insert(schema.projects)
    .values({
      contentId: content.id,
      projectStatus: 'in-progress',
    })
    .returning();

  // Insert technologies and link to project
  const technologyIds: number[] = [];
  if (options.technologies) {
    for (const techName of options.technologies) {
      // Check if technology already exists
      const existing = await db
        .select()
        .from(schema.technologies)
        .where(eq(schema.technologies.name, techName));

      let techId: number;
      if (existing.length === 0) {
        const [newTech] = await db
          .insert(schema.technologies)
          .values({ name: techName })
          .returning();
        techId = newTech.id;
      } else {
        techId = existing[0].id;
      }

      // Only add if not already in the array (avoid duplicate links)
      if (!technologyIds.includes(techId)) {
        technologyIds.push(techId);

        // Link to project
        await db.insert(schema.projectTechnologies).values({
          projectId: project.id,
          technologyId: techId,
        });
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
  const [content] = await db
    .insert(schema.contentBase)
    .values({
      type: 'news',
      slug: options.slug,
      status: options.status ?? 'draft',
      createdAt: now,
      updatedAt: now,
      publishedAt: options.status === 'published' ? now : null,
    })
    .returning();

  // Insert translations
  if (options.translations) {
    for (const trans of options.translations) {
      await db.insert(schema.contentTranslations).values({
        contentId: content.id,
        lang: trans.lang,
        title: trans.title,
        description: trans.description,
        body: trans.body,
      });
    }
  }

  // Insert news extension
  const [newsItem] = await db
    .insert(schema.news)
    .values({
      contentId: content.id,
      readingTime: options.readingTime ?? 5,
    })
    .returning();

  // Insert tags
  const tagIds: number[] = [];
  if (options.tags) {
    for (const tagData of options.tags) {
      const [newTag] = await db
        .insert(schema.tags)
        .values({
          name: tagData.name,
          slug: tagData.slug,
        })
        .returning();

      tagIds.push(newTag.id);

      // Link to news
      await db.insert(schema.newsTags).values({
        newsId: newsItem.id,
        tagId: newTag.id,
      });
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
  const [content] = await db
    .insert(schema.contentBase)
    .values({
      type: 'material',
      slug: options.slug,
      status: options.status ?? 'draft',
      createdAt: now,
      updatedAt: now,
      publishedAt: options.status === 'published' ? now : null,
    })
    .returning();

  // Insert translations
  if (options.translations) {
    for (const trans of options.translations) {
      await db.insert(schema.contentTranslations).values({
        contentId: content.id,
        lang: trans.lang,
        title: trans.title,
        description: trans.description,
      });
    }
  }

  // Insert material extension
  const [material] = await db
    .insert(schema.materials)
    .values({
      contentId: content.id,
      category: options.category,
      downloadUrl: options.downloadUrl,
      fileSize: options.fileSize,
    })
    .returning();

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
  const [mediaItem] = await db
    .insert(schema.media)
    .values({
      filename: options.filename,
      mimeType: options.mimeType,
      size: options.size,
      storageKey: options.storageKey,
      altText: options.altText,
      createdAt: new Date(),
    })
    .returning();

  return {
    mediaId: mediaItem.id,
  };
}
