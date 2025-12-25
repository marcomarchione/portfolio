/**
 * Query Key Factory
 *
 * Defines query keys for TanStack Query caching.
 * Uses factory pattern for parameterized keys.
 */

/**
 * Project query keys.
 */
export const projectKeys = {
  /** All project-related queries */
  all: ['projects'] as const,
  /** Project list queries */
  lists: () => [...projectKeys.all, 'list'] as const,
  /** Filtered project list */
  list: (filters: Record<string, unknown>) =>
    [...projectKeys.lists(), filters] as const,
  /** Project detail queries */
  details: () => [...projectKeys.all, 'detail'] as const,
  /** Single project detail */
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

/**
 * Material query keys.
 */
export const materialKeys = {
  /** All material-related queries */
  all: ['materials'] as const,
  /** Material list queries */
  lists: () => [...materialKeys.all, 'list'] as const,
  /** Filtered material list */
  list: (filters: Record<string, unknown>) =>
    [...materialKeys.lists(), filters] as const,
  /** Material detail queries */
  details: () => [...materialKeys.all, 'detail'] as const,
  /** Single material detail */
  detail: (id: string) => [...materialKeys.details(), id] as const,
};

/**
 * News query keys.
 */
export const newsKeys = {
  /** All news-related queries */
  all: ['news'] as const,
  /** News list queries */
  lists: () => [...newsKeys.all, 'list'] as const,
  /** Filtered news list */
  list: (filters: Record<string, unknown>) =>
    [...newsKeys.lists(), filters] as const,
  /** News detail queries */
  details: () => [...newsKeys.all, 'detail'] as const,
  /** Single news detail */
  detail: (id: string) => [...newsKeys.details(), id] as const,
};

/**
 * Media query keys.
 */
export const mediaKeys = {
  /** All media-related queries */
  all: ['media'] as const,
  /** Media list queries */
  lists: () => [...mediaKeys.all, 'list'] as const,
  /** Filtered media list */
  list: (filters: Record<string, unknown>) =>
    [...mediaKeys.lists(), filters] as const,
  /** Media detail queries */
  details: () => [...mediaKeys.all, 'detail'] as const,
  /** Single media detail */
  detail: (id: string) => [...mediaKeys.details(), id] as const,
};

/**
 * Settings query keys.
 */
export const settingsKeys = {
  /** All settings-related queries */
  all: ['settings'] as const,
  /** Technology queries */
  technologies: () => [...settingsKeys.all, 'technologies'] as const,
  /** Tag queries */
  tags: () => [...settingsKeys.all, 'tags'] as const,
};
