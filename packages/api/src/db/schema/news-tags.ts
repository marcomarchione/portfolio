/**
 * News Tags Junction Table Schema
 *
 * Many-to-many relationship between news and tags.
 */
import { sqliteTable, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
import { news } from './news';
import { tags } from './tags';

/**
 * News Tags Junction Table
 *
 * Links news articles to their associated tags.
 * Uses composite primary key on (news_id, tag_id).
 */
export const newsTags = sqliteTable(
  'news_tags',
  {
    /** Foreign key to news table */
    newsId: integer('news_id')
      .notNull()
      .references(() => news.id, { onDelete: 'cascade' }),

    /** Foreign key to tags table */
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.newsId, table.tagId] }),
    index('idx_news_tags_news_id').on(table.newsId),
    index('idx_news_tags_tag_id').on(table.tagId),
  ]
);

/** Type for selecting from news_tags table */
export type NewsTag = typeof newsTags.$inferSelect;

/** Type for inserting into news_tags table */
export type NewNewsTag = typeof newsTags.$inferInsert;
