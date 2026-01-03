/**
 * Public Projects Routes
 *
 * Read-only endpoints for published projects.
 * No authentication required.
 */
import { Elysia, t } from 'elysia';
import { createResponse, createPaginatedResponse } from '../../types/responses';
import { NotFoundError } from '../../types/errors';
import {
  ProjectQuerySchema,
  SlugParamSchema,
} from '../../types/content-schemas';
import { LangSchema } from '../../types/validation';
import {
  getProjectWithTranslation,
  listProjects,
  countProjects,
  getTranslation,
} from '../../db/queries';
import type { Language } from '../../db/schema';
import type { DrizzleDB } from '../../db';

/**
 * Formats a project for API response.
 */
function formatProjectResponse(project: NonNullable<ReturnType<typeof getProjectWithTranslation>>) {
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
    translation: project.translation
      ? {
          id: project.translation.id,
          contentId: project.translation.contentId,
          lang: project.translation.lang,
          title: project.translation.title,
          description: project.translation.description,
          body: project.translation.body,
          metaTitle: project.translation.metaTitle,
          metaDescription: project.translation.metaDescription,
        }
      : null,
    technologies: project.technologies,
  };
}

/**
 * Public projects routes plugin.
 */
export const publicProjectsRoutes = new Elysia({ name: 'public-projects', prefix: '/projects' })
  .get(
    '/',
    async (ctx: any) => {
      const db = ctx.db as DrizzleDB;
      const query = ctx.query;
      const lang = (query.lang ?? 'it') as Language;
      const limit = Number(query.limit ?? 20);
      const offset = Number(query.offset ?? 0);
      const featured = query.featured === 'true' ? true : query.featured === 'false' ? false : query.featured;
      const technology = query.technology;

      const options = {
        limit,
        offset,
        featured,
        technology,
        publishedOnly: true,
      };

      const projects = listProjects(db, options);
      const total = countProjects(db, options);

      // Get translations for each project
      const projectsWithTranslations = projects.map((project) => {
        const translation = getTranslation(db, project.id, lang);
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
          translation: translation
            ? {
                id: translation.id,
                contentId: translation.contentId,
                lang: translation.lang,
                title: translation.title,
                description: translation.description,
                body: translation.body,
                metaTitle: translation.metaTitle,
                metaDescription: translation.metaDescription,
              }
            : null,
        };
      });

      return createPaginatedResponse(projectsWithTranslations, total, offset, limit);
    },
    {
      query: ProjectQuerySchema,
      detail: {
        tags: ['projects'],
        summary: 'List published projects',
        description:
          'Returns a paginated list of published projects with translations for the requested language.',
      },
    }
  )
  .get(
    '/:slug',
    async (ctx: any) => {
      const db = ctx.db as DrizzleDB;
      const lang = (ctx.query.lang ?? 'it') as Language;
      const project = getProjectWithTranslation(db, ctx.params.slug, lang);

      if (!project || project.status !== 'published') {
        throw new NotFoundError('Project not found');
      }

      return createResponse(formatProjectResponse(project));
    },
    {
      params: SlugParamSchema,
      query: t.Object({
        lang: t.Optional(LangSchema),
      }),
      detail: {
        tags: ['projects'],
        summary: 'Get project by slug',
        description:
          'Returns a single published project with translation for the requested language.',
      },
    }
  );
