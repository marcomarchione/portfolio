/**
 * Translation Query Helpers
 *
 * Content translation database operations.
 */
import { eq, and } from 'drizzle-orm';
import type { DrizzleDB } from '../index';
import * as schema from '../schema';
import type { Language } from '../schema';

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
export async function getTranslation(db: DrizzleDB, contentId: number, lang: Language) {
  const [result] = await db
    .select()
    .from(schema.contentTranslations)
    .where(
      and(
        eq(schema.contentTranslations.contentId, contentId),
        eq(schema.contentTranslations.lang, lang)
      )
    );
  return result;
}

/**
 * Gets all translations for a content item.
 *
 * @param db - Drizzle database instance
 * @param contentId - Content ID
 * @returns Array of translations
 */
export async function getAllTranslations(db: DrizzleDB, contentId: number) {
  return db
    .select()
    .from(schema.contentTranslations)
    .where(eq(schema.contentTranslations.contentId, contentId));
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
export async function upsertTranslation(
  db: DrizzleDB,
  contentId: number,
  lang: Language,
  data: TranslationData
) {
  const existing = await getTranslation(db, contentId, lang);

  if (existing) {
    // Update existing translation
    await db.update(schema.contentTranslations)
      .set({
        title: data.title,
        description: data.description ?? null,
        body: data.body ?? null,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
      })
      .where(eq(schema.contentTranslations.id, existing.id));

    return (await getTranslation(db, contentId, lang))!;
  } else {
    // Create new translation
    const [result] = await db.insert(schema.contentTranslations)
      .values({
        contentId,
        lang,
        title: data.title,
        description: data.description ?? null,
        body: data.body ?? null,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
      })
      .returning();

    return result;
  }
}
