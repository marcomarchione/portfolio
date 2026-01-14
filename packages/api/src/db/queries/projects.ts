/**
 * Project Query Helpers
 *
 * Project-specific database operations including joins with technologies.
 */
import { eq, and, sql, desc, asc, inArray, like, ilike } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { DrizzleDB } from '../index';
import * as schema from '../schema';
import type { ContentStatus, Language, ProjectStatus } from '../schema';
import { getContentById, type ListContentOptions, type ContentSortField, type SortOrder } from './content';

/** Options for listing projects */
export interface ListProjectsOptions extends ListContentOptions {
  /** Filter by technology name */
  technology?: string;
  /** Filter by project development status (in-progress, completed, archived) */
  projectStatus?: ProjectStatus;
  /** Sort featured projects first (before applying other sort criteria) */
  featuredFirst?: boolean;
}

/** Data for creating a project */
export interface CreateProjectData {
  slug: string;
  status?: ContentStatus;
  featured?: boolean;
  githubUrl?: string | null;
  demoUrl?: string | null;
  projectStatus?: ProjectStatus;
  startDate?: Date | null;
  endDate?: Date | null;
}

/** Data for updating a project */
export interface UpdateProjectData {
  slug?: string;
  status?: ContentStatus;
  featured?: boolean;
  githubUrl?: string | null;
  demoUrl?: string | null;
  projectStatus?: ProjectStatus;
  startDate?: Date | null;
  endDate?: Date | null;
}

/** Gallery image structure for project detail response */
export interface GalleryImage {
  id: number;
  url: string;
  alt: string | null;
  displayOrder: number;
}

/**
 * Gets gallery images for a project.
 *
 * @param db - Drizzle database instance
 * @param projectId - Project ID (from projects table, not content_base)
 * @returns Array of gallery images ordered by displayOrder
 */
export async function getProjectGalleryImages(db: DrizzleDB, projectId: number): Promise<GalleryImage[]> {
  const results = await db
    .select({
      id: schema.media.id,
      storageKey: schema.media.storageKey,
      altText: schema.media.altText,
      displayOrder: schema.projectMedia.displayOrder,
    })
    .from(schema.projectMedia)
    .innerJoin(schema.media, eq(schema.projectMedia.mediaId, schema.media.id))
    .where(eq(schema.projectMedia.projectId, projectId))
    .orderBy(asc(schema.projectMedia.displayOrder));

  return results.map((r) => ({
    id: r.id,
    url: `/media/${r.storageKey}`,
    alt: r.altText,
    displayOrder: r.displayOrder,
  }));
}

/**
 * Gets project with single translation by slug.
 *
 * @param db - Drizzle database instance
 * @param slug - Project slug
 * @param lang - Language code
 * @returns Project with translation or null
 */
export async function getProjectWithTranslation(db: DrizzleDB, slug: string, lang: Language) {
  const [result] = await db
    .select({
      content: schema.contentBase,
      project: schema.projects,
      translation: schema.contentTranslations,
    })
    .from(schema.contentBase)
    .innerJoin(schema.projects, eq(schema.contentBase.id, schema.projects.contentId))
    .leftJoin(
      schema.contentTranslations,
      and(
        eq(schema.contentBase.id, schema.contentTranslations.contentId),
        eq(schema.contentTranslations.lang, lang)
      )
    )
    .where(and(eq(schema.contentBase.slug, slug), eq(schema.contentBase.type, 'project')));

  if (!result) return null;

  // Get technologies for project
  const techResults = await db
    .select({ technology: schema.technologies })
    .from(schema.projectTechnologies)
    .innerJoin(
      schema.technologies,
      eq(schema.projectTechnologies.technologyId, schema.technologies.id)
    )
    .where(eq(schema.projectTechnologies.projectId, result.project.id));

  const technologies = techResults.map((r) => r.technology);

  // Get gallery images for project
  const galleryImages = await getProjectGalleryImages(db, result.project.id);

  return {
    ...result.content,
    ...result.project,
    translation: result.translation,
    technologies,
    galleryImages,
  };
}

/**
 * Gets project with all translations by content ID.
 *
 * @param db - Drizzle database instance
 * @param id - Content ID
 * @returns Project with all translations or null
 */
export async function getProjectWithAllTranslations(db: DrizzleDB, id: number) {
  const content = await getContentById(db, id);
  if (!content || content.type !== 'project') return null;

  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.contentId, id));

  if (!project) return null;

  const translations = await db
    .select()
    .from(schema.contentTranslations)
    .where(eq(schema.contentTranslations.contentId, id));

  const techResults = await db
    .select({ technology: schema.technologies })
    .from(schema.projectTechnologies)
    .innerJoin(
      schema.technologies,
      eq(schema.projectTechnologies.technologyId, schema.technologies.id)
    )
    .where(eq(schema.projectTechnologies.projectId, project.id));

  const technologies = techResults.map((r) => r.technology);

  // Get gallery images for project
  const galleryImages = await getProjectGalleryImages(db, project.id);

  // Return with content.id as the primary id (not project.id)
  return {
    ...content,
    ...project,
    id: content.id, // Ensure content_base ID is used
    translations,
    technologies,
    galleryImages,
  };
}

/**
 * Builds sort clause based on options.
 * When featuredFirst is true, always prepends `featured DESC` to the sort order.
 */
function buildSortClause(
  sortBy: ContentSortField = 'updatedAt',
  sortOrder: SortOrder = 'desc',
  hasItalianTitle: boolean,
  featuredFirst: boolean = false
): SQL[] {
  const orderFn = sortOrder === 'asc' ? asc : desc;
  const clauses: SQL[] = [];

  // Always sort featured first when requested
  if (featuredFirst) {
    clauses.push(desc(schema.contentBase.featured));
  }

  switch (sortBy) {
    case 'title':
      // When sorting by title, we need to have joined Italian translations
      if (hasItalianTitle) {
        clauses.push(orderFn(schema.contentTranslations.title));
      } else {
        // Fallback to updatedAt if no title join
        clauses.push(orderFn(schema.contentBase.updatedAt));
      }
      break;
    case 'createdAt':
      clauses.push(orderFn(schema.contentBase.createdAt));
      break;
    case 'updatedAt':
    default:
      clauses.push(orderFn(schema.contentBase.updatedAt));
      break;
  }

  return clauses;
}

/**
 * Lists projects with optional technology filter, project status filter, search, and sorting.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Array of projects with translations
 */
export async function listProjects(db: DrizzleDB, options: ListProjectsOptions = {}) {
  const {
    limit = 20,
    offset = 0,
    status,
    featured,
    publishedOnly = false,
    technology,
    projectStatus,
    search,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
    featuredFirst = false,
  } = options;

  const conditions: SQL[] = [eq(schema.contentBase.type, 'project')];

  if (status) {
    conditions.push(eq(schema.contentBase.status, status));
  } else if (publishedOnly) {
    conditions.push(eq(schema.contentBase.status, 'published'));
  }

  if (featured !== undefined) {
    conditions.push(eq(schema.contentBase.featured, featured));
  }

  // Filter by project status if provided
  if (projectStatus) {
    conditions.push(eq(schema.projects.projectStatus, projectStatus));
  }

  // Filter by technology if provided
  if (technology) {
    const [tech] = await db
      .select()
      .from(schema.technologies)
      .where(eq(schema.technologies.name, technology));

    if (tech) {
      const projectIdsResults = await db
        .select({ projectId: schema.projectTechnologies.projectId })
        .from(schema.projectTechnologies)
        .where(eq(schema.projectTechnologies.technologyId, tech.id));

      const projectIds = projectIdsResults.map((r) => r.projectId);

      if (projectIds.length > 0) {
        conditions.push(inArray(schema.projects.id, projectIds));
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
    // Query with Italian translation join for search and title sort
    if (search) {
      conditions.push(ilike(schema.contentTranslations.title, `%${search}%`));
    }

    const results = await db
      .select({
        content: schema.contentBase,
        project: schema.projects,
      })
      .from(schema.contentBase)
      .innerJoin(schema.projects, eq(schema.contentBase.id, schema.projects.contentId))
      .leftJoin(
        schema.contentTranslations,
        and(
          eq(schema.contentBase.id, schema.contentTranslations.contentId),
          eq(schema.contentTranslations.lang, 'it')
        )
      )
      .where(and(...conditions))
      .orderBy(...buildSortClause(sortBy, sortOrder, true, featuredFirst))
      .limit(limit)
      .offset(offset);

    return results.map((r) => ({
      ...r.content,
      ...r.project,
      id: r.content.id, // Ensure content_base ID is used, not projects.id
    }));
  }

  // Standard query without Italian join
  const results = await db
    .select({
      content: schema.contentBase,
      project: schema.projects,
    })
    .from(schema.contentBase)
    .innerJoin(schema.projects, eq(schema.contentBase.id, schema.projects.contentId))
    .where(and(...conditions))
    .orderBy(...buildSortClause(sortBy, sortOrder, false, featuredFirst))
    .limit(limit)
    .offset(offset);

  return results.map((r) => ({
    ...r.content,
    ...r.project,
    id: r.content.id, // Ensure content_base ID is used, not projects.id
  }));
}

/**
 * Counts projects with optional filters.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Total count
 */
export async function countProjects(db: DrizzleDB, options: ListProjectsOptions = {}) {
  const { status, featured, publishedOnly = false, technology, projectStatus, search } = options;

  const conditions: SQL[] = [eq(schema.contentBase.type, 'project')];

  if (status) {
    conditions.push(eq(schema.contentBase.status, status));
  } else if (publishedOnly) {
    conditions.push(eq(schema.contentBase.status, 'published'));
  }

  if (featured !== undefined) {
    conditions.push(eq(schema.contentBase.featured, featured));
  }

  // Filter by project status if provided
  if (projectStatus) {
    conditions.push(eq(schema.projects.projectStatus, projectStatus));
  }

  // Filter by technology if provided
  if (technology) {
    const [tech] = await db
      .select()
      .from(schema.technologies)
      .where(eq(schema.technologies.name, technology));

    if (tech) {
      const projectIdsResults = await db
        .select({ projectId: schema.projectTechnologies.projectId })
        .from(schema.projectTechnologies)
        .where(eq(schema.projectTechnologies.technologyId, tech.id));

      const projectIds = projectIdsResults.map((r) => r.projectId);

      if (projectIds.length > 0) {
        conditions.push(inArray(schema.projects.id, projectIds));
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  }

  // If searching, need to join Italian translations
  if (search) {
    conditions.push(ilike(schema.contentTranslations.title, `%${search}%`));

    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.contentBase)
      .innerJoin(schema.projects, eq(schema.contentBase.id, schema.projects.contentId))
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
    .innerJoin(schema.projects, eq(schema.contentBase.id, schema.projects.contentId))
    .where(and(...conditions));

  return result?.count ?? 0;
}

/**
 * Creates a new project with content_base in a transaction.
 *
 * @param db - Drizzle database instance
 * @param data - Project data
 * @returns Created project with content ID
 */
export async function createProject(db: DrizzleDB, data: CreateProjectData) {
  const now = new Date();
  const status = data.status ?? 'draft';

  // Insert content_base
  const [content] = await db.insert(schema.contentBase)
    .values({
      type: 'project',
      slug: data.slug,
      status,
      featured: data.featured ?? false,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : null,
    })
    .returning();

  // Insert project extension
  const [project] = await db.insert(schema.projects)
    .values({
      contentId: content.id,
      githubUrl: data.githubUrl ?? null,
      demoUrl: data.demoUrl ?? null,
      projectStatus: data.projectStatus ?? 'in-progress',
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
    })
    .returning();

  // Return with content.id as the primary id (not project.id)
  return {
    ...content,
    ...project,
    id: content.id, // Ensure content_base ID is used
    translations: [],
    technologies: [],
    galleryImages: [],
  };
}

/**
 * Updates a project.
 *
 * @param db - Drizzle database instance
 * @param id - Content ID
 * @param data - Update data
 * @returns Updated project or null
 */
export async function updateProject(db: DrizzleDB, id: number, data: UpdateProjectData) {
  const now = new Date();
  const content = await getContentById(db, id);
  if (!content || content.type !== 'project') return null;

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

  // Update project extension
  const [project] = await db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.contentId, id));

  if (project) {
    const projectUpdates: Record<string, unknown> = {};
    if (data.githubUrl !== undefined) projectUpdates.githubUrl = data.githubUrl;
    if (data.demoUrl !== undefined) projectUpdates.demoUrl = data.demoUrl;
    if (data.projectStatus !== undefined) projectUpdates.projectStatus = data.projectStatus;
    if (data.startDate !== undefined) projectUpdates.startDate = data.startDate;
    if (data.endDate !== undefined) projectUpdates.endDate = data.endDate;

    if (Object.keys(projectUpdates).length > 0) {
      await db.update(schema.projects)
        .set(projectUpdates)
        .where(eq(schema.projects.id, project.id));
    }
  }

  return getProjectWithAllTranslations(db, id);
}
