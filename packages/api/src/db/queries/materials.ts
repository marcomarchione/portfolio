/**
 * Material Query Helpers
 *
 * Material-specific database operations.
 */
import { eq, and, sql, desc, asc, like } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import type { SQL } from 'drizzle-orm';
import * as schema from '../schema';
import type { ContentStatus, Language, MaterialCategory } from '../schema';
import { getContentById, type ListContentOptions, type ContentSortField, type SortOrder } from './content';

type DrizzleDB = BunSQLiteDatabase<typeof schema>;

/** Options for listing materials */
export interface ListMaterialsOptions extends ListContentOptions {
  category?: MaterialCategory;
}

/** Data for creating a material */
export interface CreateMaterialData {
  slug: string;
  category: MaterialCategory;
  downloadUrl: string;
  fileSize?: number | null;
  status?: ContentStatus;
  featured?: boolean;
}

/** Data for updating a material */
export interface UpdateMaterialData {
  slug?: string;
  category?: MaterialCategory;
  downloadUrl?: string;
  fileSize?: number | null;
  status?: ContentStatus;
  featured?: boolean;
}

/**
 * Gets material with single translation by slug.
 *
 * @param db - Drizzle database instance
 * @param slug - Material slug
 * @param lang - Language code
 * @returns Material with translation or null
 */
export function getMaterialWithTranslation(db: DrizzleDB, slug: string, lang: Language) {
  const result = db
    .select({
      content: schema.contentBase,
      material: schema.materials,
      translation: schema.contentTranslations,
    })
    .from(schema.contentBase)
    .innerJoin(schema.materials, eq(schema.contentBase.id, schema.materials.contentId))
    .leftJoin(
      schema.contentTranslations,
      and(
        eq(schema.contentBase.id, schema.contentTranslations.contentId),
        eq(schema.contentTranslations.lang, lang)
      )
    )
    .where(and(eq(schema.contentBase.slug, slug), eq(schema.contentBase.type, 'material')))
    .get();

  if (!result) return null;

  return {
    ...result.content,
    ...result.material,
    translation: result.translation,
  };
}

/**
 * Gets material with all translations by content ID.
 *
 * @param db - Drizzle database instance
 * @param id - Content ID
 * @returns Material with all translations or null
 */
export function getMaterialWithAllTranslations(db: DrizzleDB, id: number) {
  const content = getContentById(db, id);
  if (!content || content.type !== 'material') return null;

  const material = db
    .select()
    .from(schema.materials)
    .where(eq(schema.materials.contentId, id))
    .get();

  if (!material) return null;

  const translations = db
    .select()
    .from(schema.contentTranslations)
    .where(eq(schema.contentTranslations.contentId, id))
    .all();

  return {
    ...content,
    ...material,
    translations,
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
 * Lists materials with optional category filter, search, and sorting.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Array of materials
 */
export function listMaterials(db: DrizzleDB, options: ListMaterialsOptions = {}) {
  const {
    limit = 20,
    offset = 0,
    status,
    featured,
    publishedOnly = false,
    category,
    search,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  } = options;

  const conditions: SQL[] = [eq(schema.contentBase.type, 'material')];

  if (status) {
    conditions.push(eq(schema.contentBase.status, status));
  } else if (publishedOnly) {
    conditions.push(eq(schema.contentBase.status, 'published'));
  }

  if (featured !== undefined) {
    conditions.push(eq(schema.contentBase.featured, featured));
  }

  if (category) {
    conditions.push(eq(schema.materials.category, category));
  }

  // Determine if we need to join Italian translations (for search or title sort)
  const needsItalianJoin = search || sortBy === 'title';

  if (needsItalianJoin) {
    if (search) {
      conditions.push(like(schema.contentTranslations.title, `%${search}%`));
    }

    const results = db
      .select({
        content: schema.contentBase,
        material: schema.materials,
      })
      .from(schema.contentBase)
      .innerJoin(schema.materials, eq(schema.contentBase.id, schema.materials.contentId))
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
      .offset(offset)
      .all();

    return results.map((r) => ({
      ...r.content,
      ...r.material,
    }));
  }

  const results = db
    .select({
      content: schema.contentBase,
      material: schema.materials,
    })
    .from(schema.contentBase)
    .innerJoin(schema.materials, eq(schema.contentBase.id, schema.materials.contentId))
    .where(and(...conditions))
    .orderBy(...buildSortClause(sortBy, sortOrder, false))
    .limit(limit)
    .offset(offset)
    .all();

  return results.map((r) => ({
    ...r.content,
    ...r.material,
  }));
}

/**
 * Counts materials with optional filters.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Total count
 */
export function countMaterials(db: DrizzleDB, options: ListMaterialsOptions = {}) {
  const { status, featured, publishedOnly = false, category, search } = options;

  const conditions: SQL[] = [eq(schema.contentBase.type, 'material')];

  if (status) {
    conditions.push(eq(schema.contentBase.status, status));
  } else if (publishedOnly) {
    conditions.push(eq(schema.contentBase.status, 'published'));
  }

  if (featured !== undefined) {
    conditions.push(eq(schema.contentBase.featured, featured));
  }

  if (category) {
    conditions.push(eq(schema.materials.category, category));
  }

  if (search) {
    conditions.push(like(schema.contentTranslations.title, `%${search}%`));

    const result = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.contentBase)
      .innerJoin(schema.materials, eq(schema.contentBase.id, schema.materials.contentId))
      .leftJoin(
        schema.contentTranslations,
        and(
          eq(schema.contentBase.id, schema.contentTranslations.contentId),
          eq(schema.contentTranslations.lang, 'it')
        )
      )
      .where(and(...conditions))
      .get();

    return result?.count ?? 0;
  }

  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.contentBase)
    .innerJoin(schema.materials, eq(schema.contentBase.id, schema.materials.contentId))
    .where(and(...conditions))
    .get();

  return result?.count ?? 0;
}

/**
 * Creates a new material with content_base.
 *
 * @param db - Drizzle database instance
 * @param data - Material data
 * @returns Created material
 */
export function createMaterial(db: DrizzleDB, data: CreateMaterialData) {
  const now = new Date();
  const status = data.status ?? 'draft';

  // Insert content_base
  db.insert(schema.contentBase)
    .values({
      type: 'material',
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

  // Insert material extension
  db.insert(schema.materials)
    .values({
      contentId: content.id,
      category: data.category,
      downloadUrl: data.downloadUrl,
      fileSize: data.fileSize ?? null,
    })
    .run();

  const material = db
    .select()
    .from(schema.materials)
    .where(eq(schema.materials.contentId, content.id))
    .get()!;

  return {
    ...content,
    ...material,
    translations: [],
  };
}

/**
 * Updates a material.
 *
 * @param db - Drizzle database instance
 * @param id - Content ID
 * @param data - Update data
 * @returns Updated material or null
 */
export function updateMaterial(db: DrizzleDB, id: number, data: UpdateMaterialData) {
  const now = new Date();
  const content = getContentById(db, id);
  if (!content || content.type !== 'material') return null;

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

  // Update material extension
  const material = db
    .select()
    .from(schema.materials)
    .where(eq(schema.materials.contentId, id))
    .get();

  if (material) {
    const materialUpdates: Record<string, unknown> = {};
    if (data.category !== undefined) materialUpdates.category = data.category;
    if (data.downloadUrl !== undefined) materialUpdates.downloadUrl = data.downloadUrl;
    if (data.fileSize !== undefined) materialUpdates.fileSize = data.fileSize;

    if (Object.keys(materialUpdates).length > 0) {
      db.update(schema.materials)
        .set(materialUpdates)
        .where(eq(schema.materials.id, material.id))
        .run();
    }
  }

  return getMaterialWithAllTranslations(db, id);
}
