/**
 * Dashboard Query Helpers
 *
 * Provides query functions for dashboard statistics and recent items.
 */
import { eq, and, sql, desc } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from '../schema';
import type { ContentType, ContentStatus } from '../schema';

type DrizzleDB = BunSQLiteDatabase<typeof schema>;

/**
 * Statistics for a single content type.
 */
export interface ContentTypeStats {
  type: ContentType;
  total: number;
  draft: number;
  published: number;
  archived: number;
}

/**
 * Dashboard statistics for all content types.
 */
export interface DashboardStats {
  projects: ContentTypeStats;
  materials: ContentTypeStats;
  news: ContentTypeStats;
}

/**
 * Recent content item.
 */
export interface RecentItem {
  id: number;
  type: ContentType;
  slug: string;
  status: ContentStatus;
  featured: boolean;
  title: string | null;
  updatedAt: Date;
}

/**
 * Gets content statistics grouped by type and status.
 * Only counts records that have corresponding extension records (projects, materials, news).
 *
 * @param db - Drizzle database instance
 * @returns Statistics for all content types
 */
export function getContentStatistics(db: DrizzleDB): DashboardStats {
  // Initialize stats structure
  const stats: DashboardStats = {
    projects: { type: 'project', total: 0, draft: 0, published: 0, archived: 0 },
    materials: { type: 'material', total: 0, draft: 0, published: 0, archived: 0 },
    news: { type: 'news', total: 0, draft: 0, published: 0, archived: 0 },
  };

  // Count projects (only those with extension record)
  const projectCounts = db
    .select({
      status: schema.contentBase.status,
      count: sql<number>`count(*)`,
    })
    .from(schema.contentBase)
    .innerJoin(schema.projects, eq(schema.contentBase.id, schema.projects.contentId))
    .where(eq(schema.contentBase.type, 'project'))
    .groupBy(schema.contentBase.status)
    .all();

  for (const row of projectCounts) {
    const statusKey = row.status as keyof Omit<ContentTypeStats, 'type' | 'total'>;
    stats.projects[statusKey] = row.count;
    stats.projects.total += row.count;
  }

  // Count materials (only those with extension record)
  const materialCounts = db
    .select({
      status: schema.contentBase.status,
      count: sql<number>`count(*)`,
    })
    .from(schema.contentBase)
    .innerJoin(schema.materials, eq(schema.contentBase.id, schema.materials.contentId))
    .where(eq(schema.contentBase.type, 'material'))
    .groupBy(schema.contentBase.status)
    .all();

  for (const row of materialCounts) {
    const statusKey = row.status as keyof Omit<ContentTypeStats, 'type' | 'total'>;
    stats.materials[statusKey] = row.count;
    stats.materials.total += row.count;
  }

  // Count news (only those with extension record)
  const newsCounts = db
    .select({
      status: schema.contentBase.status,
      count: sql<number>`count(*)`,
    })
    .from(schema.contentBase)
    .innerJoin(schema.news, eq(schema.contentBase.id, schema.news.contentId))
    .where(eq(schema.contentBase.type, 'news'))
    .groupBy(schema.contentBase.status)
    .all();

  for (const row of newsCounts) {
    const statusKey = row.status as keyof Omit<ContentTypeStats, 'type' | 'total'>;
    stats.news[statusKey] = row.count;
    stats.news.total += row.count;
  }

  return stats;
}

/**
 * Gets recent content items across all types.
 * Only returns records that have corresponding extension records.
 *
 * @param db - Drizzle database instance
 * @param limit - Maximum number of items to return (default: 10)
 * @returns Array of recent items with Italian title
 */
export function getRecentItems(db: DrizzleDB, limit: number = 10): RecentItem[] {
  // Get IDs of content that have valid extension records
  const projectIds = db
    .select({ id: schema.projects.contentId })
    .from(schema.projects)
    .all()
    .map((r) => r.id);

  const materialIds = db
    .select({ id: schema.materials.contentId })
    .from(schema.materials)
    .all()
    .map((r) => r.id);

  const newsIds = db
    .select({ id: schema.news.contentId })
    .from(schema.news)
    .all()
    .map((r) => r.id);

  const validContentIds = [...projectIds, ...materialIds, ...newsIds];

  if (validContentIds.length === 0) {
    return [];
  }

  // Query recent items with Italian translation, only for valid content
  const results = db
    .select({
      id: schema.contentBase.id,
      type: schema.contentBase.type,
      slug: schema.contentBase.slug,
      status: schema.contentBase.status,
      featured: schema.contentBase.featured,
      updatedAt: schema.contentBase.updatedAt,
      title: schema.contentTranslations.title,
    })
    .from(schema.contentBase)
    .leftJoin(
      schema.contentTranslations,
      and(
        eq(schema.contentBase.id, schema.contentTranslations.contentId),
        eq(schema.contentTranslations.lang, 'it')
      )
    )
    .where(sql`${schema.contentBase.id} IN (${sql.join(validContentIds.map(id => sql`${id}`), sql`, `)})`)
    .orderBy(desc(schema.contentBase.updatedAt))
    .limit(limit)
    .all();

  return results.map((row) => ({
    id: row.id,
    type: row.type,
    slug: row.slug,
    status: row.status,
    featured: row.featured,
    title: row.title,
    updatedAt: row.updatedAt,
  }));
}
