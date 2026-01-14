/**
 * Junction Table Query Helpers
 *
 * Many-to-many relationship operations for project-technologies and news-tags.
 */
import { eq, and } from 'drizzle-orm';
import type { DrizzleDB } from '../index';
import * as schema from '../schema';

/**
 * Gets technologies for a project.
 *
 * @param db - Drizzle database instance
 * @param projectId - Project ID (from projects table)
 * @returns Array of technologies
 */
export async function getProjectTechnologies(db: DrizzleDB, projectId: number) {
  const results = await db
    .select({ technology: schema.technologies })
    .from(schema.projectTechnologies)
    .innerJoin(
      schema.technologies,
      eq(schema.projectTechnologies.technologyId, schema.technologies.id)
    )
    .where(eq(schema.projectTechnologies.projectId, projectId));

  return results.map((r) => r.technology);
}

/**
 * Assigns technologies to a project, replacing existing associations.
 *
 * @param db - Drizzle database instance
 * @param projectId - Project ID (from projects table)
 * @param technologyIds - Array of technology IDs
 */
export async function assignTechnologies(db: DrizzleDB, projectId: number, technologyIds: number[]) {
  // Remove existing associations
  await db.delete(schema.projectTechnologies)
    .where(eq(schema.projectTechnologies.projectId, projectId));

  // Add new associations
  for (const technologyId of technologyIds) {
    await db.insert(schema.projectTechnologies)
      .values({ projectId, technologyId });
  }
}

/**
 * Removes a single technology from a project.
 *
 * @param db - Drizzle database instance
 * @param projectId - Project ID
 * @param technologyId - Technology ID to remove
 */
export async function removeTechnology(db: DrizzleDB, projectId: number, technologyId: number) {
  await db.delete(schema.projectTechnologies)
    .where(
      and(
        eq(schema.projectTechnologies.projectId, projectId),
        eq(schema.projectTechnologies.technologyId, technologyId)
      )
    );
}

/**
 * Gets tags for a news item.
 *
 * @param db - Drizzle database instance
 * @param newsId - News ID (from news table)
 * @returns Array of tags
 */
export async function getNewsTags(db: DrizzleDB, newsId: number) {
  const results = await db
    .select({ tag: schema.tags })
    .from(schema.newsTags)
    .innerJoin(schema.tags, eq(schema.newsTags.tagId, schema.tags.id))
    .where(eq(schema.newsTags.newsId, newsId));

  return results.map((r) => r.tag);
}

/**
 * Assigns tags to a news item, replacing existing associations.
 *
 * @param db - Drizzle database instance
 * @param newsId - News ID (from news table)
 * @param tagIds - Array of tag IDs
 */
export async function assignTags(db: DrizzleDB, newsId: number, tagIds: number[]) {
  // Remove existing associations
  await db.delete(schema.newsTags)
    .where(eq(schema.newsTags.newsId, newsId));

  // Add new associations
  for (const tagId of tagIds) {
    await db.insert(schema.newsTags)
      .values({ newsId, tagId });
  }
}

/**
 * Removes a single tag from a news item.
 *
 * @param db - Drizzle database instance
 * @param newsId - News ID
 * @param tagId - Tag ID to remove
 */
export async function removeTag(db: DrizzleDB, newsId: number, tagId: number) {
  await db.delete(schema.newsTags)
    .where(
      and(
        eq(schema.newsTags.newsId, newsId),
        eq(schema.newsTags.tagId, tagId)
      )
    );
}

/**
 * Gets project by content ID.
 *
 * @param db - Drizzle database instance
 * @param contentId - Content ID
 * @returns Project or undefined
 */
export async function getProjectByContentId(db: DrizzleDB, contentId: number) {
  const [result] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.contentId, contentId));

  return result;
}

/**
 * Gets news by content ID.
 *
 * @param db - Drizzle database instance
 * @param contentId - Content ID
 * @returns News or undefined
 */
export async function getNewsByContentId(db: DrizzleDB, contentId: number) {
  const [result] = await db
    .select()
    .from(schema.news)
    .where(eq(schema.news.contentId, contentId));

  return result;
}

/**
 * Assigns media items to a project gallery, replacing existing associations.
 *
 * @param db - Drizzle database instance
 * @param projectId - Project ID (from projects table, NOT content_base)
 * @param mediaItems - Array of { mediaId, displayOrder } objects
 */
export async function assignProjectMedia(
  db: DrizzleDB,
  projectId: number,
  mediaItems: { mediaId: number; displayOrder: number }[]
) {
  // Remove existing associations
  await db.delete(schema.projectMedia)
    .where(eq(schema.projectMedia.projectId, projectId));

  // Add new associations with displayOrder
  for (const item of mediaItems) {
    await db.insert(schema.projectMedia)
      .values({
        projectId,
        mediaId: item.mediaId,
        displayOrder: item.displayOrder,
      });
  }
}

/**
 * Removes a single media item from a project gallery.
 *
 * @param db - Drizzle database instance
 * @param projectId - Project ID (from projects table)
 * @param mediaId - Media ID to remove
 */
export async function removeProjectMedia(
  db: DrizzleDB,
  projectId: number,
  mediaId: number
) {
  await db.delete(schema.projectMedia)
    .where(
      and(
        eq(schema.projectMedia.projectId, projectId),
        eq(schema.projectMedia.mediaId, mediaId)
      )
    );
}

/**
 * Updates the display order of gallery media items.
 * Only updates displayOrder, does not add/remove items.
 *
 * @param db - Drizzle database instance
 * @param projectId - Project ID (from projects table)
 * @param mediaItems - Array of { mediaId, displayOrder } objects
 */
export async function updateProjectMediaOrder(
  db: DrizzleDB,
  projectId: number,
  mediaItems: { mediaId: number; displayOrder: number }[]
) {
  for (const item of mediaItems) {
    await db.update(schema.projectMedia)
      .set({ displayOrder: item.displayOrder })
      .where(
        and(
          eq(schema.projectMedia.projectId, projectId),
          eq(schema.projectMedia.mediaId, item.mediaId)
        )
      );
  }
}
