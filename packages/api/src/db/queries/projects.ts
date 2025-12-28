/**
 * Project Query Helpers
 *
 * Project-specific database operations including joins with technologies.
 */
import { eq, and, sql, desc, asc, inArray, like } from 'drizzle-orm';
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
import type { SQL } from 'drizzle-orm';
import * as schema from '../schema';
import type { ContentStatus, Language, ProjectStatus } from '../schema';
import { getContentById, type ListContentOptions, type ContentSortField, type SortOrder } from './content';

type DrizzleDB = BunSQLiteDatabase<typeof schema>;

/** Options for listing projects */
export interface ListProjectsOptions extends ListContentOptions {
  technology?: string;
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

/**
 * Gets project with single translation by slug.
 *
 * @param db - Drizzle database instance
 * @param slug - Project slug
 * @param lang - Language code
 * @returns Project with translation or null
 */
export function getProjectWithTranslation(db: DrizzleDB, slug: string, lang: Language) {
  const result = db
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
    .where(and(eq(schema.contentBase.slug, slug), eq(schema.contentBase.type, 'project')))
    .get();

  if (!result) return null;

  // Get technologies for project
  const technologies = db
    .select({ technology: schema.technologies })
    .from(schema.projectTechnologies)
    .innerJoin(
      schema.technologies,
      eq(schema.projectTechnologies.technologyId, schema.technologies.id)
    )
    .where(eq(schema.projectTechnologies.projectId, result.project.id))
    .all()
    .map((r) => r.technology);

  return {
    ...result.content,
    ...result.project,
    translation: result.translation,
    technologies,
  };
}

/**
 * Gets project with all translations by content ID.
 *
 * @param db - Drizzle database instance
 * @param id - Content ID
 * @returns Project with all translations or null
 */
export function getProjectWithAllTranslations(db: DrizzleDB, id: number) {
  const content = getContentById(db, id);
  if (!content || content.type !== 'project') return null;

  const project = db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.contentId, id))
    .get();

  if (!project) return null;

  const translations = db
    .select()
    .from(schema.contentTranslations)
    .where(eq(schema.contentTranslations.contentId, id))
    .all();

  const technologies = db
    .select({ technology: schema.technologies })
    .from(schema.projectTechnologies)
    .innerJoin(
      schema.technologies,
      eq(schema.projectTechnologies.technologyId, schema.technologies.id)
    )
    .where(eq(schema.projectTechnologies.projectId, project.id))
    .all()
    .map((r) => r.technology);

  return {
    ...content,
    ...project,
    translations,
    technologies,
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
      // When sorting by title, we need to have joined Italian translations
      if (hasItalianTitle) {
        return [orderFn(schema.contentTranslations.title)];
      }
      // Fallback to updatedAt if no title join
      return [orderFn(schema.contentBase.updatedAt)];
    case 'createdAt':
      return [orderFn(schema.contentBase.createdAt)];
    case 'updatedAt':
    default:
      return [orderFn(schema.contentBase.updatedAt)];
  }
}

/**
 * Lists projects with optional technology filter, search, and sorting.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Array of projects with translations
 */
export function listProjects(db: DrizzleDB, options: ListProjectsOptions = {}) {
  const {
    limit = 20,
    offset = 0,
    status,
    featured,
    publishedOnly = false,
    technology,
    search,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
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

  // Filter by technology if provided
  if (technology) {
    const tech = db
      .select()
      .from(schema.technologies)
      .where(eq(schema.technologies.name, technology))
      .get();

    if (tech) {
      const projectIds = db
        .select({ projectId: schema.projectTechnologies.projectId })
        .from(schema.projectTechnologies)
        .where(eq(schema.projectTechnologies.technologyId, tech.id))
        .all()
        .map((r) => r.projectId);

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
      conditions.push(like(schema.contentTranslations.title, `%${search}%`));
    }

    const results = db
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
      .orderBy(...buildSortClause(sortBy, sortOrder, true))
      .limit(limit)
      .offset(offset)
      .all();

    return results.map((r) => ({
      ...r.content,
      ...r.project,
    }));
  }

  // Standard query without Italian join
  const results = db
    .select({
      content: schema.contentBase,
      project: schema.projects,
    })
    .from(schema.contentBase)
    .innerJoin(schema.projects, eq(schema.contentBase.id, schema.projects.contentId))
    .where(and(...conditions))
    .orderBy(...buildSortClause(sortBy, sortOrder, false))
    .limit(limit)
    .offset(offset)
    .all();

  return results.map((r) => ({
    ...r.content,
    ...r.project,
  }));
}

/**
 * Counts projects with optional filters.
 *
 * @param db - Drizzle database instance
 * @param options - List options
 * @returns Total count
 */
export function countProjects(db: DrizzleDB, options: ListProjectsOptions = {}) {
  const { status, featured, publishedOnly = false, technology, search } = options;

  const conditions: SQL[] = [eq(schema.contentBase.type, 'project')];

  if (status) {
    conditions.push(eq(schema.contentBase.status, status));
  } else if (publishedOnly) {
    conditions.push(eq(schema.contentBase.status, 'published'));
  }

  if (featured !== undefined) {
    conditions.push(eq(schema.contentBase.featured, featured));
  }

  // Filter by technology if provided
  if (technology) {
    const tech = db
      .select()
      .from(schema.technologies)
      .where(eq(schema.technologies.name, technology))
      .get();

    if (tech) {
      const projectIds = db
        .select({ projectId: schema.projectTechnologies.projectId })
        .from(schema.projectTechnologies)
        .where(eq(schema.projectTechnologies.technologyId, tech.id))
        .all()
        .map((r) => r.projectId);

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
    conditions.push(like(schema.contentTranslations.title, `%${search}%`));

    const result = db
      .select({ count: sql<number>`count(*)` })
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
      .get();

    return result?.count ?? 0;
  }

  const result = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.contentBase)
    .innerJoin(schema.projects, eq(schema.contentBase.id, schema.projects.contentId))
    .where(and(...conditions))
    .get();

  return result?.count ?? 0;
}

/**
 * Creates a new project with content_base in a transaction.
 *
 * @param db - Drizzle database instance
 * @param data - Project data
 * @returns Created project with content ID
 */
export function createProject(db: DrizzleDB, data: CreateProjectData) {
  const now = new Date();
  const status = data.status ?? 'draft';

  // Insert content_base
  db.insert(schema.contentBase)
    .values({
      type: 'project',
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

  // Insert project extension
  db.insert(schema.projects)
    .values({
      contentId: content.id,
      githubUrl: data.githubUrl ?? null,
      demoUrl: data.demoUrl ?? null,
      projectStatus: data.projectStatus ?? 'in-progress',
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
    })
    .run();

  const project = db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.contentId, content.id))
    .get()!;

  return {
    ...content,
    ...project,
    translations: [],
    technologies: [],
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
export function updateProject(db: DrizzleDB, id: number, data: UpdateProjectData) {
  const now = new Date();
  const content = getContentById(db, id);
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

  db.update(schema.contentBase)
    .set(contentUpdates)
    .where(eq(schema.contentBase.id, id))
    .run();

  // Update project extension
  const project = db
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.contentId, id))
    .get();

  if (project) {
    const projectUpdates: Record<string, unknown> = {};
    if (data.githubUrl !== undefined) projectUpdates.githubUrl = data.githubUrl;
    if (data.demoUrl !== undefined) projectUpdates.demoUrl = data.demoUrl;
    if (data.projectStatus !== undefined) projectUpdates.projectStatus = data.projectStatus;
    if (data.startDate !== undefined) projectUpdates.startDate = data.startDate;
    if (data.endDate !== undefined) projectUpdates.endDate = data.endDate;

    if (Object.keys(projectUpdates).length > 0) {
      db.update(schema.projects)
        .set(projectUpdates)
        .where(eq(schema.projects.id, project.id))
        .run();
    }
  }

  return getProjectWithAllTranslations(db, id);
}
