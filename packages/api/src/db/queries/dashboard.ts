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
 *
 * @param db - Drizzle database instance
 * @returns Statistics for all content types
 */
export function getContentStatistics(db: DrizzleDB): DashboardStats {
  // Query counts grouped by type and status
  const results = db
    .select({
      type: schema.contentBase.type,
      status: schema.contentBase.status,
      count: sql<number>`count(*)`,
    })
    .from(schema.contentBase)
    .groupBy(schema.contentBase.type, schema.contentBase.status)
    .all();

  // Initialize stats structure
  const stats: DashboardStats = {
    projects: { type: 'project', total: 0, draft: 0, published: 0, archived: 0 },
    materials: { type: 'material', total: 0, draft: 0, published: 0, archived: 0 },
    news: { type: 'news', total: 0, draft: 0, published: 0, archived: 0 },
  };

  // Map type to stats key
  const typeToKey: Record<ContentType, keyof DashboardStats> = {
    project: 'projects',
    material: 'materials',
    news: 'news',
  };

  // Populate stats from query results
  for (const row of results) {
    const key = typeToKey[row.type];
    if (key) {
      const statusKey = row.status as keyof Omit<ContentTypeStats, 'type' | 'total'>;
      stats[key][statusKey] = row.count;
      stats[key].total += row.count;
    }
  }

  return stats;
}

/**
 * Gets recent content items across all types.
 *
 * @param db - Drizzle database instance
 * @param limit - Maximum number of items to return (default: 10)
 * @returns Array of recent items with Italian title
 */
export function getRecentItems(db: DrizzleDB, limit: number = 10): RecentItem[] {
  // Query recent items with Italian translation
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
