/**
 * API Types Barrel Export
 *
 * Exports all types, error classes, and validation schemas.
 */

// Error classes and types
export {
  ApiError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  InternalError,
  isApiError,
  ERROR_CODES,
  type ErrorCode,
} from './errors';

// Response types and helpers
export {
  type ApiResponse,
  type ApiErrorResponse,
  type PaginatedResponse,
  type PaginationMeta,
  type HealthResponse,
  createResponse,
  createPaginatedResponse,
  createErrorResponse,
} from './responses';

// Validation schemas
export {
  LANGUAGES,
  LangSchema,
  PaginationSchema,
  SlugSchema,
  IdSchema,
  FeaturedSchema,
  ListQuerySchema,
  BooleanStringSchema,
  DbCheckSchema,
  type Lang,
  type Pagination,
  type Slug,
  type Id,
  type Featured,
  type ListQuery,
  type DbCheck,
} from './validation';

// Content-specific schemas
export {
  // Status and category enums
  CONTENT_STATUSES,
  PROJECT_STATUSES,
  MATERIAL_CATEGORIES,
  ContentStatusSchema,
  ProjectStatusSchema,
  MaterialCategorySchema,
  // Query schemas
  ProjectQuerySchema,
  MaterialQuerySchema,
  NewsQuerySchema,
  AdminListQuerySchema,
  AdminIdParamSchema,
  SlugParamSchema,
  TranslationLangParamSchema,
  JunctionIdParamSchema,
  // Request body schemas - Projects
  CreateProjectBodySchema,
  UpdateProjectBodySchema,
  // Request body schemas - Materials
  CreateMaterialBodySchema,
  UpdateMaterialBodySchema,
  // Request body schemas - News
  CreateNewsBodySchema,
  UpdateNewsBodySchema,
  // Request body schemas - Translations
  TranslationBodySchema,
  // Request body schemas - Technologies
  CreateTechnologyBodySchema,
  UpdateTechnologyBodySchema,
  // Request body schemas - Tags
  CreateTagBodySchema,
  UpdateTagBodySchema,
  // Request body schemas - Assignments
  AssignTechnologiesBodySchema,
  AssignTagsBodySchema,
  // Response schemas
  TranslationResponseSchema,
  TechnologyResponseSchema,
  TagResponseSchema,
  ProjectResponseSchema,
  MaterialResponseSchema,
  NewsResponseSchema,
  AdminProjectResponseSchema,
  AdminMaterialResponseSchema,
  AdminNewsResponseSchema,
  ApiResponseSchema,
  PaginationMetaSchema,
  PaginatedResponseSchema,
  // Types
  type ContentStatus,
  type ProjectStatus,
  type MaterialCategory,
  type ProjectQuery,
  type MaterialQuery,
  type NewsQuery,
  type AdminListQuery,
  type AdminIdParam,
  type SlugParam,
  type TranslationLangParam,
  type CreateProjectBody,
  type UpdateProjectBody,
  type CreateMaterialBody,
  type UpdateMaterialBody,
  type CreateNewsBody,
  type UpdateNewsBody,
  type TranslationBody,
  type CreateTechnologyBody,
  type UpdateTechnologyBody,
  type CreateTagBody,
  type UpdateTagBody,
  type AssignTechnologiesBody,
  type AssignTagsBody,
} from './content-schemas';
