/**
 * Route Constants
 *
 * Defines all application routes as constants.
 */

/**
 * Application routes.
 */
export const ROUTES = {
  /** Root path - redirects to dashboard */
  ROOT: '/',

  /** Public routes */
  LOGIN: '/login',

  /** Protected routes */
  DASHBOARD: '/dashboard',

  /** Projects routes */
  PROJECTS: '/projects',
  PROJECTS_NEW: '/projects/new',
  PROJECTS_EDIT: '/projects/:id/edit',

  /** Materials routes */
  MATERIALS: '/materials',
  MATERIALS_NEW: '/materials/new',
  MATERIALS_EDIT: '/materials/:id/edit',

  /** News routes */
  NEWS: '/news',
  NEWS_NEW: '/news/new',
  NEWS_EDIT: '/news/:id/edit',

  /** Media routes */
  MEDIA: '/media',

  /** Settings routes */
  SETTINGS: '/settings',
} as const;

/**
 * Helper to generate edit route with id.
 */
export function getEditRoute(
  baseRoute: '/projects' | '/materials' | '/news',
  id: string
): string {
  return `${baseRoute}/${id}/edit`;
}

/**
 * Type for route values.
 */
export type RouteValue = (typeof ROUTES)[keyof typeof ROUTES];
