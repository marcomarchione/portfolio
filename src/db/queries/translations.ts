/**
 * Translation Query Helpers
 *
 * Content translation database operations.
 */
import { eq, and } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import * as schema from '../schema';
import type { Language } from '../schema';

type DrizzleDB = BunSQLiteDatabase<typeof schema>;

/** Data for creating/updating a translation */
export interface TranslationData {
  title: string;
  description?: string | null;
  body?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

/**
 * Gets a translation for a content item in a specific language.
 *
 * @param db - Drizzle database instance
 * @param contentId - Content ID
 * @param lang - Language code
 * @returns Translation or undefined
 */
export function getTranslation(db: DrizzleDB, contentId: number, lang: Language) {
  return db
    .select()
    .from(schema.contentTranslations)
    .where(
      and(
        eq(schema.contentTranslations.contentId, contentId),
        eq(schema.contentTranslations.lang, lang)
      )
    )
    .get();
}

/**
 * Gets all translations for a content item.
 *
 * @param db - Drizzle database instance
 * @param contentId - Content ID
 * @returns Array of translations
 */
export function getAllTranslations(db: DrizzleDB, contentId: number) {
  return db
    .select()
    .from(schema.contentTranslations)
    .where(eq(schema.contentTranslations.contentId, contentId))
    .all();
}

/**
 * Creates or updates a translation for a content item.
 *
 * @param db - Drizzle database instance
 * @param contentId - Content ID
 * @param lang - Language code
 * @param data - Translation data
 * @returns Created or updated translation
 */
export function upsertTranslation(
  db: DrizzleDB,
  contentId: number,
  lang: Language,
  data: TranslationData
) {
  const existing = getTranslation(db, contentId, lang);

  if (existing) {
    // Update existing translation
    db.update(schema.contentTranslations)
      .set({
        title: data.title,
        description: data.description ?? null,
        body: data.body ?? null,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
      })
      .where(eq(schema.contentTranslations.id, existing.id))
      .run();

    return getTranslation(db, contentId, lang)!;
  } else {
    // Create new translation
    db.insert(schema.contentTranslations)
      .values({
        contentId,
        lang,
        title: data.title,
        description: data.description ?? null,
        body: data.body ?? null,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
      })
      .run();

    return getTranslation(db, contentId, lang)!;
  }
}
