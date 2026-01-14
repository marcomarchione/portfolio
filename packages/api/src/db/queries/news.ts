/**
 * News Query Helpers
 *
 * News-specific database operations including joins with tags.
 */
import { eq, and, sql, desc, asc, inArray, like, ilike } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { DrizzleDB } from '../index';
import * as schema from '../schema';
import type { ContentStatus, Language } from '../schema';
import { getContentById, type ListContentOptions, type ContentSortField, type SortOrder } from './content';

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
export async function getNewsWithTranslation(db: DrizzleDB, slug: string, lang: Language) {
  const [result] = await db
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
    .where(and(eq(schema.contentBase.slug, slug), eq(schema.contentBase.type, 'news')));

  if (!result) return null;

  // Get tags for news
  const tagResults = await db
    .select({ tag: schema.tags })
    .from(schema.newsTags)
    .innerJoin(schema.tags, eq(schema.newsTags.tagId, schema.tags.id))
    .where(eq(schema.newsTags.newsId, result.news.id));

  const tags = tagResults.map((r) => r.tag);

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
export async function getNewsWithAllTranslations(db: DrizzleDB, id: number) {
  const content = await getContentById(db, id);
  if (!content || content.type !== 'news') return null;

  const [newsItem] = await db
    .select()
    .from(schema.news)
    .where(eq(schema.news.contentId, id));

  if (!newsItem) return null;

  const translations = await db
    .select()
    .from(schema.contentTranslations)
    .where(eq(schema.contentTranslations.contentId, id));

  const tagResults = await db
    .select({ tag: schema.tags })
    .from(schema.newsTags)
    .innerJoin(schema.tags, eq(schema.newsTags.tagId, schema.tags.id))
    .where(eq(schema.newsTags.newsId, newsItem.id));

  const tags = tagResults.map((r) => r.tag);

  // Return with content.id as the primary id (not newsItem.id)
  return {
    ...content,
    ...newsItem,
    id: content.id, // Ensure content_base ID is used
    translations,
    tags,
  };
}

/**
 * Builds sort clause based on options.
 */
function buildSortClause(
  sortBy: ContentSortField = 'updatedAt',
  sortOrder: SortOrder = 'desc',
  hasItalianTitle: boolean
): SQL[] {
  const orderFn = sortOrder === 'asc' ? asc : desc;

  switch (sortBy) {
    case 'title':
      if (hasItalianTitle) {
        return [orderFn(schema.contentTranslations.title)];
      }
      return [orderFn(schema.contentBase.updatedAt)];
    case 'createdAt':
      return [orderFn(schema.contentBase.createdAt)];
    case 'updatedAt':
    default:
      return [orderFn(schema.contentBase.updatedAt)];
  }
}

/**
 * Lists news with optional tag filter, search, and sorting.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Array of news items
 */
export async function listNews(db: DrizzleDB, options: ListNewsOptions = {}) {
  const {
    limit = 20,
    offset = 0,
    status,
    featured,
    publishedOnly = false,
    tag,
    search,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = options;

  const conditions: SQL[] = [eq(schema.contentBase.type, 'news')];

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
    const [tagRecord] = await db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.slug, tag));

    if (tagRecord) {
      const newsIdsResults = await db
        .select({ newsId: schema.newsTags.newsId })
        .from(schema.newsTags)
        .where(eq(schema.newsTags.tagId, tagRecord.id));

      const newsIds = newsIdsResults.map((r) => r.newsId);

      if (newsIds.length > 0) {
        conditions.push(inArray(schema.news.id, newsIds));
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  // Determine if we need to join Italian translations (for search or title sort)
  const needsItalianJoin = search || sortBy === 'title';

  if (needsItalianJoin) {
    if (search) {
      conditions.push(ilike(schema.contentTranslations.title, `%${search}%`));
    }

    const results = await db
      .select({
        content: schema.contentBase,
        news: schema.news,
      })
      .from(schema.contentBase)
      .innerJoin(schema.news, eq(schema.contentBase.id, schema.news.contentId))
      .leftJoin(
        schema.contentTranslations,
        and(
          eq(schema.contentBase.id, schema.contentTranslations.contentId),
          eq(schema.contentTranslations.lang, 'it')
        )
      )
      .where(and(...conditions))
      .orderBy(...buildSortClause(sortBy, sortOrder, true))
      .limit(limit)
      .offset(offset);

    return results.map((r) => ({
      ...r.content,
      ...r.news,
      id: r.content.id, // Ensure content_base ID is used, not news.id
    }));
  }

  const results = await db
    .select({
      content: schema.contentBase,
      news: schema.news,
    })
    .from(schema.contentBase)
    .innerJoin(schema.news, eq(schema.contentBase.id, schema.news.contentId))
    .where(and(...conditions))
    .orderBy(...buildSortClause(sortBy, sortOrder, false))
    .limit(limit)
    .offset(offset);

  return results.map((r) => ({
    ...r.content,
    ...r.news,
    id: r.content.id, // Ensure content_base ID is used, not news.id
  }));
}

/**
 * Counts news with optional filters.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Total count
 */
export async function countNews(db: DrizzleDB, options: ListNewsOptions = {}) {
  const { status, featured, publishedOnly = false, tag, search } = options;

  const conditions: SQL[] = [eq(schema.contentBase.type, 'news')];

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
    const [tagRecord] = await db
      .select()
      .from(schema.tags)
      .where(eq(schema.tags.slug, tag));

    if (tagRecord) {
      const newsIdsResults = await db
        .select({ newsId: schema.newsTags.newsId })
        .from(schema.newsTags)
        .where(eq(schema.newsTags.tagId, tagRecord.id));

      const newsIds = newsIdsResults.map((r) => r.newsId);

      if (newsIds.length > 0) {
        conditions.push(inArray(schema.news.id, newsIds));
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  }

  if (search) {
    conditions.push(ilike(schema.contentTranslations.title, `%${search}%`));

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.contentBase)
      .innerJoin(schema.news, eq(schema.contentBase.id, schema.news.contentId))
      .leftJoin(
        schema.contentTranslations,
        and(
          eq(schema.contentBase.id, schema.contentTranslations.contentId),
          eq(schema.contentTranslations.lang, 'it')
        )
      )
      .where(and(...conditions));

    return result?.count ?? 0;
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.contentBase)
    .innerJoin(schema.news, eq(schema.contentBase.id, schema.news.contentId))
    .where(and(...conditions));

  return result?.count ?? 0;
}

/**
 * Creates a new news item with content_base.
 *
 * @param db - Drizzle database instance
 * @param data - News data
 * @returns Created news item
 */
export async function createNews(db: DrizzleDB, data: CreateNewsData) {
  const now = new Date();
  const status = data.status ?? 'draft';

  // Insert content_base
  const [content] = await db.insert(schema.contentBase)
    .values({
      type: 'news',
      slug: data.slug,
      status,
      featured: data.featured ?? false,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : null,
    })
    .returning();

  // Insert news extension
  const [newsItem] = await db.insert(schema.news)
    .values({
      contentId: content.id,
      coverImage: data.coverImage ?? null,
      readingTime: data.readingTime ?? null,
    })
    .returning();

  // Return with content.id as the primary id (not newsItem.id)
  return {
    ...content,
    ...newsItem,
    id: content.id, // Ensure content_base ID is used
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
export async function updateNews(db: DrizzleDB, id: number, data: UpdateNewsData) {
  const now = new Date();
  const content = await getContentById(db, id);
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

  await db.update(schema.contentBase)
    .set(contentUpdates)
    .where(eq(schema.contentBase.id, id));

  // Update news extension
  const [newsItem] = await db
    .select()
    .from(schema.news)
    .where(eq(schema.news.contentId, id));

  if (newsItem) {
    const newsUpdates: Record<string, unknown> = {};
    if (data.coverImage !== undefined) newsUpdates.coverImage = data.coverImage;
    if (data.readingTime !== undefined) newsUpdates.readingTime = data.readingTime;

    if (Object.keys(newsUpdates).length > 0) {
      await db.update(schema.news)
        .set(newsUpdates)
        .where(eq(schema.news.id, newsItem.id));
    }
  }

  return getNewsWithAllTranslations(db, id);
}
