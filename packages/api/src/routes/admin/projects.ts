/**
 * Admin Projects Routes
 *
 * CRUD endpoints for projects with authentication.
 * All routes require valid JWT access token.
 */
import { Elysia, t } from 'elysia';
import { createResponse, createPaginatedResponse } from '../../types/responses';
import { NotFoundError } from '../../types/errors';
import { authMiddleware } from '../../middleware/auth';
import {
  AdminListQuerySchema,
  AdminIdParamSchema,
  CreateProjectBodySchema,
  UpdateProjectBodySchema,
  TranslationBodySchema,
  TranslationLangParamSchema,
  AssignTechnologiesBodySchema,
} from '../../types/content-schemas';
import { LangSchema } from '../../types/validation';
import {
  getProjectWithAllTranslations,
  listProjects,
  countProjects,
  createProject,
  updateProject,
  archiveContent,
  upsertTranslation,
  getTranslation,
  getProjectByContentId,
  assignTechnologies,
  removeTechnology,
  getProjectTechnologies,
} from '../../db/queries';
import type { ContentStatus, Language } from '../../db/schema';
import type { ContentSortField, SortOrder } from '../../db/queries/content';

/**
 * Formats a project for admin API response.
 */
function formatAdminProjectResponse(
  project: NonNullable<ReturnType<typeof getProjectWithAllTranslations>>
) {
  return {
    id: project.id,
    type: project.type,
    slug: project.slug,
    status: project.status,
    featured: project.featured,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    publishedAt: project.publishedAt?.toISOString() ?? null,
    githubUrl: project.githubUrl,
    demoUrl: project.demoUrl,
    projectStatus: project.projectStatus,
    startDate: project.startDate?.toISOString() ?? null,
    endDate: project.endDate?.toISOString() ?? null,
    translations: project.translations.map((t) => ({
      id: t.id,
      contentId: t.contentId,
      lang: t.lang,
      title: t.title,
      description: t.description,
      body: t.body,
      metaTitle: t.metaTitle,
      metaDescription: t.metaDescription,
    })),
    technologies: project.technologies,
  };
}

/**
 * Admin projects routes plugin.
 */
export const adminProjectsRoutes = new Elysia({ name: 'admin-projects', prefix: '/projects' })
  .use(authMiddleware)
  .get(
    '/',
    async ({ query, db }) => {
      const limit = query.limit ?? 20;
      const offset = query.offset ?? 0;
      const status = query.status as ContentStatus | undefined;
      const search = query.search;
      const sortBy = query.sortBy as ContentSortField | undefined;
      const sortOrder = query.sortOrder as SortOrder | undefined;

      const options = {
        limit,
        offset,
        status,
        publishedOnly: false,
        search,
        sortBy,
        sortOrder,
      };

      const projects = listProjects(db, options);
      const total = countProjects(db, options);

      // Get all translations for each project
      const projectsWithAllTranslations = projects.map((project) => {
        const fullProject = getProjectWithAllTranslations(db, project.id);
        if (!fullProject) return null;
        return formatAdminProjectResponse(fullProject);
      }).filter(Boolean);

      return createPaginatedResponse(projectsWithAllTranslations, total, offset, limit);
    },
    {
      query: AdminListQuerySchema,
      detail: {
        tags: ['admin', 'projects'],
        summary: 'List all projects (admin)',
        description:
          'Returns a paginated list of all projects with all translations. Supports search by Italian title and sorting.',
      },
    }
  )
  .get(
    '/:id',
    async ({ params, db }) => {
      const id = parseInt(params.id, 10);
      const project = getProjectWithAllTranslations(db, id);

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      return createResponse(formatAdminProjectResponse(project));
    },
    {
      params: AdminIdParamSchema,
      detail: {
        tags: ['admin', 'projects'],
        summary: 'Get project by ID (admin)',
        description: 'Returns a single project with all translations.',
      },
    }
  )
  .post(
    '/',
    async ({ body, db, set }) => {
      const project = createProject(db, {
        slug: body.slug,
        status: body.status as ContentStatus | undefined,
        featured: body.featured,
        githubUrl: body.githubUrl,
        demoUrl: body.demoUrl,
        projectStatus: body.projectStatus as 'in-progress' | 'completed' | 'archived' | undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
      });

      set.status = 201;
      return createResponse(formatAdminProjectResponse(project));
    },
    {
      body: CreateProjectBodySchema,
      detail: {
        tags: ['admin', 'projects'],
        summary: 'Create project',
        description:
          'Creates a new project with content_base and project extension in a transaction.',
      },
    }
  )
  .put(
    '/:id',
    async ({ params, body, db }) => {
      const id = parseInt(params.id, 10);

      const project = updateProject(db, id, {
        slug: body.slug,
        status: body.status as ContentStatus | undefined,
        featured: body.featured,
        githubUrl: body.githubUrl,
        demoUrl: body.demoUrl,
        projectStatus: body.projectStatus as 'in-progress' | 'completed' | 'archived' | undefined,
        startDate: body.startDate !== undefined
          ? (body.startDate === null ? null : new Date(body.startDate))
          : undefined,
        endDate: body.endDate !== undefined
          ? (body.endDate === null ? null : new Date(body.endDate))
          : undefined,
      });

      if (!project) {
        throw new NotFoundError('Project not found');
      }

      return createResponse(formatAdminProjectResponse(project));
    },
    {
      params: AdminIdParamSchema,
      body: UpdateProjectBodySchema,
      detail: {
        tags: ['admin', 'projects'],
        summary: 'Update project',
        description:
          'Updates a project. When status changes to published, sets publishedAt timestamp.',
      },
    }
  )
  .put(
    '/:id/translations/:lang',
    async ({ params, body, db }) => {
      const id = parseInt(params.id, 10);
      const lang = params.lang as Language;

      // Verify project exists
      const project = getProjectWithAllTranslations(db, id);
      if (!project) {
        throw new NotFoundError('Project not found');
      }

      const translation = upsertTranslation(db, id, lang, {
        title: body.title,
        description: body.description,
        body: body.body,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
      });

      return createResponse({
        id: translation.id,
        contentId: translation.contentId,
        lang: translation.lang,
        title: translation.title,
        description: translation.description,
        body: translation.body,
        metaTitle: translation.metaTitle,
        metaDescription: translation.metaDescription,
      });
    },
    {
      params: TranslationLangParamSchema,
      body: TranslationBodySchema,
      detail: {
        tags: ['admin', 'projects'],
        summary: 'Upsert project translation',
        description:
          'Creates or updates a translation for a project in the specified language.',
      },
    }
  )
  .delete(
    '/:id',
    async ({ params, db }) => {
      const id = parseInt(params.id, 10);

      const archived = archiveContent(db, id);
      if (!archived) {
        throw new NotFoundError('Project not found');
      }

      // Get updated project with all translations
      const project = getProjectWithAllTranslations(db, id);
      if (!project) {
        throw new NotFoundError('Project not found');
      }

      return createResponse(formatAdminProjectResponse(project));
    },
    {
      params: AdminIdParamSchema,
      detail: {
        tags: ['admin', 'projects'],
        summary: 'Archive project',
        description: 'Soft deletes a project by setting its status to archived.',
      },
    }
  )
  .post(
    '/:id/technologies',
    async ({ params, body, db }) => {
      const id = parseInt(params.id, 10);

      // Get project record
      const projectRecord = getProjectByContentId(db, id);
      if (!projectRecord) {
        throw new NotFoundError('Project not found');
      }

      // Assign technologies
      assignTechnologies(db, projectRecord.id, body.technologyIds);

      // Get updated project
      const project = getProjectWithAllTranslations(db, id);
      if (!project) {
        throw new NotFoundError('Project not found');
      }

      return createResponse(formatAdminProjectResponse(project));
    },
    {
      params: AdminIdParamSchema,
      body: AssignTechnologiesBodySchema,
      detail: {
        tags: ['admin', 'projects'],
        summary: 'Assign technologies to project',
        description:
          'Replaces all project technologies with the provided list of technology IDs.',
      },
    }
  )
  .delete(
    '/:id/technologies/:techId',
    async ({ params, db }) => {
      const id = parseInt(params.id, 10);
      const techId = parseInt(params.techId, 10);

      // Get project record
      const projectRecord = getProjectByContentId(db, id);
      if (!projectRecord) {
        throw new NotFoundError('Project not found');
      }

      // Remove technology
      removeTechnology(db, projectRecord.id, techId);

      // Get updated project
      const project = getProjectWithAllTranslations(db, id);
      if (!project) {
        throw new NotFoundError('Project not found');
      }

      return createResponse(formatAdminProjectResponse(project));
    },
    {
      params: t.Object({
        id: t.String({ pattern: '^[0-9]+$' }),
        techId: t.String({ pattern: '^[0-9]+$' }),
      }),
      detail: {
        tags: ['admin', 'projects'],
        summary: 'Remove technology from project',
        description: 'Removes a single technology association from a project.',
      },
    }
  );
