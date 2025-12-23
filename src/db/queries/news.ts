/**
 * News Query Helpers
 *
 * News-specific database operations including joins with tags.
 */
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from '../schema';
import type { ContentStatus, Language } from '../schema';
import { getContentById, type ListContentOptions } from './content';

type DrizzleDB = BunSQLiteDatabase<typeof schema>;

/** Options for listing news */
export interface ListNewsOptions extends ListContentOptions {
  tag?: string;
}

/** Data for creating news */
export interface CreateNewsData {
  slug: string;
  coverImage?: string | null;
  readingTime?: number | null;
  status?: ContentStatus;
  featured?: boolean;
}

/** Data for updating news */
export interface UpdateNewsData {
  slug?: string;
  coverImage?: string | null;
  readingTime?: number | null;
  status?: ContentStatus;
  featured?: boolean;
}

/**
 * Gets news with single translation by slug.
 *
 * @param db - Drizzle database instance
 * @param slug - News slug
 * @param lang - Language code
 * @returns News with translation or null
 */
export function getNewsWithTranslation(db: DrizzleDB, slug: string, lang: Language) {
  const result = db
    .select({
      content: schema.contentBase,
      news: schema.news,
      translation: schema.contentTranslations,
    })
    .from(schema.contentBase)
    .innerJoin(schema.news, eq(schema.contentBase.id, schema.news.contentId))
    .leftJoin(
      schema.contentTranslations,
      and(
        eq(schema.contentBase.id, schema.contentTranslations.contentId),
        eq(schema.contentTranslations.lang, lang)
      )
    )
    .where(and(eq(schema.contentBase.slug, slug), eq(schema.contentBase.type, 'news')))
    .get();

  if (!result) return null;

  // Get tags for news
  const tags = db
    .select({ tag: schema.tags })
    .from(schema.newsTags)
    .innerJoin(schema.tags, eq(schema.newsTags.tagId, schema.tags.id))
    .where(eq(schema.newsTags.newsId, result.news.id))
    .all()
    .map((r) => r.tag);

  return {
    ...result.content,
    ...result.news,
    translation: result.translation,
    tags,
  };
}

/**
 * Gets news with all translations by content ID.
 *
 * @param db - Drizzle database instance
 * @param id - Content ID
 * @returns News with all translations or null
 */
export function getNewsWithAllTranslations(db: DrizzleDB, id: number) {
  const content = getContentById(db, id);
  if (!content || content.type !== 'news') return null;

  const newsItem = db
    .select()
    .from(schema.news)
    .where(eq(schema.news.contentId, id))
    .get();

  if (!newsItem) return null;

  const translations = db
    .select()
    .from(schema.contentTranslations)
    .where(eq(schema.contentTranslations.contentId, id))
    .all();

  const tags = db
    .select({ tag: schema.tags })
    .from(schema.newsTags)
    .innerJoin(schema.tags, eq(schema.newsTags.tagId, schema.tags.id))
    .where(eq(schema.newsTags.newsId, newsItem.id))
    .all()
    .map((r) => r.tag);

  return {
    ...content,
    ...newsItem,
    translations,
    tags,
  };
}

/**
 * Lists news with optional tag filter.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Array of news items
 */
export function listNews(db: DrizzleDB, options: ListNewsOptions = {}) {
  const { limit = 20, offset = 0, status, featured, publishedOnly = false, tag } = options;

  const conditions = [eq(schema.contentBase.type, 'news')];

  if (status) {
    conditions.push(eq(schema.contentBase.status, status));
  } else if (publishedOnly) {
    conditions.push(eq(schema.contentBase.status, 'published'));
  }

  if (featured !== undefined) {
    conditions.push(eq(schema.contentBase.featured, featured));
  }

  // Filter by tag if provided
  if (tag) {
    const tagRecord = db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.slug, tag))
      .get();

    if (tagRecord) {
      const newsIds = db
        .select({ newsId: schema.newsTags.newsId })
        .from(schema.newsTags)
        .where(eq(schema.newsTags.tagId, tagRecord.id))
        .all()
        .map((r) => r.newsId);

      if (newsIds.length > 0) {
        conditions.push(inArray(schema.news.id, newsIds));
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  const results = db
    .select({
      content: schema.contentBase,
      news: schema.news,
    })
    .from(schema.contentBase)
    .innerJoin(schema.news, eq(schema.contentBase.id, schema.news.contentId))
    .where(and(...conditions))
    .orderBy(desc(schema.contentBase.publishedAt), desc(schema.contentBase.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  return results.map((r) => ({
    ...r.content,
    ...r.news,
  }));
}

/**
 * Counts news with optional filters.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Total count
 */
export function countNews(db: DrizzleDB, options: ListNewsOptions = {}) {
  const { status, featured, publishedOnly = false, tag } = options;

  const conditions = [eq(schema.contentBase.type, 'news')];

  if (status) {
    conditions.push(eq(schema.contentBase.status, status));
  } else if (publishedOnly) {
    conditions.push(eq(schema.contentBase.status, 'published'));
  }

  if (featured !== undefined) {
    conditions.push(eq(schema.contentBase.featured, featured));
  }

  // Filter by tag if provided
  if (tag) {
    const tagRecord = db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.slug, tag))
      .get();

    if (tagRecord) {
      const newsIds = db
        .select({ newsId: schema.newsTags.newsId })
        .from(schema.newsTags)
        .where(eq(schema.newsTags.tagId, tagRecord.id))
        .all()
        .map((r) => r.newsId);

      if (newsIds.length > 0) {
        conditions.push(inArray(schema.news.id, newsIds));
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  }

  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.contentBase)
    .innerJoin(schema.news, eq(schema.contentBase.id, schema.news.contentId))
    .where(and(...conditions))
    .get();

  return result?.count ?? 0;
}

/**
 * Creates a new news item with content_base.
 *
 * @param db - Drizzle database instance
 * @param data - News data
 * @returns Created news item
 */
export function createNews(db: DrizzleDB, data: CreateNewsData) {
  const now = new Date();
  const status = data.status ?? 'draft';

  // Insert content_base
  db.insert(schema.contentBase)
    .values({
      type: 'news',
      slug: data.slug,
      status,
      featured: data.featured ?? false,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : null,
    })
    .run();

  const content = db
    .select()
    .from(schema.contentBase)
    .where(eq(schema.contentBase.slug, data.slug))
    .get()!;

  // Insert news extension
  db.insert(schema.news)
    .values({
      contentId: content.id,
      coverImage: data.coverImage ?? null,
      readingTime: data.readingTime ?? null,
    })
    .run();

  const newsItem = db
    .select()
    .from(schema.news)
    .where(eq(schema.news.contentId, content.id))
    .get()!;

  return {
    ...content,
    ...newsItem,
    translations: [],
    tags: [],
  };
}

/**
 * Updates a news item.
 *
 * @param db - Drizzle database instance
 * @param id - Content ID
 * @param data - Update data
 * @returns Updated news item or null
 */
export function updateNews(db: DrizzleDB, id: number, data: UpdateNewsData) {
  const now = new Date();
  const content = getContentById(db, id);
  if (!content || content.type !== 'news') return null;

  // Update content_base
  const contentUpdates: Record<string, unknown> = { updatedAt: now };
  if (data.slug !== undefined) contentUpdates.slug = data.slug;
  if (data.status !== undefined) {
    contentUpdates.status = data.status;
    if (data.status === 'published' && !content.publishedAt) {
      contentUpdates.publishedAt = now;
    }
  }
  if (data.featured !== undefined) contentUpdates.featured = data.featured;

  db.update(schema.contentBase)
    .set(contentUpdates)
    .where(eq(schema.contentBase.id, id))
    .run();

  // Update news extension
  const newsItem = db
    .select()
    .from(schema.news)
    .where(eq(schema.news.contentId, id))
    .get();

  if (newsItem) {
    const newsUpdates: Record<string, unknown> = {};
    if (data.coverImage !== undefined) newsUpdates.coverImage = data.coverImage;
    if (data.readingTime !== undefined) newsUpdates.readingTime = data.readingTime;

    if (Object.keys(newsUpdates).length > 0) {
      db.update(schema.news)
        .set(newsUpdates)
        .where(eq(schema.news.id, newsItem.id))
        .run();
    }
  }

  return getNewsWithAllTranslations(db, id);
}
