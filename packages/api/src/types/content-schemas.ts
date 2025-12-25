/**
 * Content-Specific TypeBox Validation Schemas
 *
 * Provides validation schemas for content CRUD operations.
 * Extends base validation schemas with content-specific fields.
 */
import { Type, type Static } from '@sinclair/typebox';
import { LangSchema, ListQuerySchema, SlugSchema, IdSchema, LANGUAGES } from './validation';

/** Content statuses from database schema */
export const CONTENT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

/** Project development statuses */
export const PROJECT_STATUSES = ['in-progress', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

/** Material categories from database schema */
export const MATERIAL_CATEGORIES = ['guide', 'template', 'resource', 'tool'] as const;
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

/**
 * Content status enum schema.
 * Validates draft/published/archived status values.
 */
export const ContentStatusSchema = Type.Union(
  CONTENT_STATUSES.map((status) => Type.Literal(status)),
  { description: 'Content publication status' }
);

/**
 * Project status enum schema.
 */
export const ProjectStatusSchema = Type.Union(
  PROJECT_STATUSES.map((status) => Type.Literal(status)),
  { description: 'Project development status' }
);

/**
 * Material category enum schema.
 */
export const MaterialCategorySchema = Type.Union(
  MATERIAL_CATEGORIES.map((cat) => Type.Literal(cat)),
  { description: 'Material category type' }
);

/** URL schema - uses pattern for basic validation */
export const UrlSchema = Type.String({
  pattern: '^https?://',
  description: 'Valid URL starting with http:// or https://',
});

/** Optional URL schema that allows null */
export const OptionalUrlSchema = Type.Union([UrlSchema, Type.Null()]);

/**
 * Project list query schema.
 * Extends ListQuerySchema with technology filter.
 */
export const ProjectQuerySchema = Type.Object({
  ...ListQuerySchema.properties,
  technology: Type.Optional(
    Type.String({
      description: 'Filter by technology slug',
    })
  ),
});
export type ProjectQuery = Static<typeof ProjectQuerySchema>;

/**
 * Material list query schema.
 * Extends ListQuerySchema with category filter.
 */
export const MaterialQuerySchema = Type.Object({
  ...ListQuerySchema.properties,
  category: Type.Optional(MaterialCategorySchema),
});
export type MaterialQuery = Static<typeof MaterialQuerySchema>;

/**
 * News list query schema.
 * Extends ListQuerySchema with tag filter.
 */
export const NewsQuerySchema = Type.Object({
  ...ListQuerySchema.properties,
  tag: Type.Optional(
    Type.String({
      description: 'Filter by tag slug',
    })
  ),
});
export type NewsQuery = Static<typeof NewsQuerySchema>;

/**
 * Admin list query schema.
 * Adds status filter for admin endpoints.
 */
export const AdminListQuerySchema = Type.Object({
  limit: Type.Optional(
    Type.Integer({
      minimum: 1,
      maximum: 100,
      default: 20,
      description: 'Number of items per page (1-100)',
    })
  ),
  offset: Type.Optional(
    Type.Integer({
      minimum: 0,
      default: 0,
      description: 'Number of items to skip',
    })
  ),
  status: Type.Optional(ContentStatusSchema),
});
export type AdminListQuery = Static<typeof AdminListQuerySchema>;

/**
 * Admin ID parameter schema.
 */
export const AdminIdParamSchema = Type.Object({
  id: Type.String({
    pattern: '^[0-9]+$',
    description: 'Resource ID',
  }),
});
export type AdminIdParam = Static<typeof AdminIdParamSchema>;

/**
 * Slug parameter schema.
 */
export const SlugParamSchema = Type.Object({
  slug: SlugSchema,
});
export type SlugParam = Static<typeof SlugParamSchema>;

/**
 * Translation language parameter schema.
 */
export const TranslationLangParamSchema = Type.Object({
  id: Type.String({
    pattern: '^[0-9]+$',
    description: 'Resource ID',
  }),
  lang: LangSchema,
});
export type TranslationLangParam = Static<typeof TranslationLangParamSchema>;

/**
 * Create project request body schema.
 */
export const CreateProjectBodySchema = Type.Object({
  slug: SlugSchema,
  status: Type.Optional(ContentStatusSchema),
  featured: Type.Optional(Type.Boolean({ default: false })),
  githubUrl: Type.Optional(UrlSchema),
  demoUrl: Type.Optional(UrlSchema),
  projectStatus: Type.Optional(ProjectStatusSchema),
  startDate: Type.Optional(Type.String()),
  endDate: Type.Optional(Type.String()),
});
export type CreateProjectBody = Static<typeof CreateProjectBodySchema>;

/**
 * Update project request body schema.
 */
export const UpdateProjectBodySchema = Type.Object({
  slug: Type.Optional(SlugSchema),
  status: Type.Optional(ContentStatusSchema),
  featured: Type.Optional(Type.Boolean()),
  githubUrl: Type.Optional(OptionalUrlSchema),
  demoUrl: Type.Optional(OptionalUrlSchema),
  projectStatus: Type.Optional(ProjectStatusSchema),
  startDate: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  endDate: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});
export type UpdateProjectBody = Static<typeof UpdateProjectBodySchema>;

/**
 * Create material request body schema.
 */
export const CreateMaterialBodySchema = Type.Object({
  slug: SlugSchema,
  category: MaterialCategorySchema,
  downloadUrl: UrlSchema,
  fileSize: Type.Optional(Type.Integer({ minimum: 0 })),
  status: Type.Optional(ContentStatusSchema),
  featured: Type.Optional(Type.Boolean({ default: false })),
});
export type CreateMaterialBody = Static<typeof CreateMaterialBodySchema>;

/**
 * Update material request body schema.
 */
export const UpdateMaterialBodySchema = Type.Object({
  slug: Type.Optional(SlugSchema),
  category: Type.Optional(MaterialCategorySchema),
  downloadUrl: Type.Optional(UrlSchema),
  fileSize: Type.Optional(Type.Union([Type.Integer({ minimum: 0 }), Type.Null()])),
  status: Type.Optional(ContentStatusSchema),
  featured: Type.Optional(Type.Boolean()),
});
export type UpdateMaterialBody = Static<typeof UpdateMaterialBodySchema>;

/**
 * Create news request body schema.
 */
export const CreateNewsBodySchema = Type.Object({
  slug: SlugSchema,
  coverImage: Type.Optional(Type.String()),
  readingTime: Type.Optional(Type.Integer({ minimum: 1 })),
  status: Type.Optional(ContentStatusSchema),
  featured: Type.Optional(Type.Boolean({ default: false })),
});
export type CreateNewsBody = Static<typeof CreateNewsBodySchema>;

/**
 * Update news request body schema.
 */
export const UpdateNewsBodySchema = Type.Object({
  slug: Type.Optional(SlugSchema),
  coverImage: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  readingTime: Type.Optional(Type.Union([Type.Integer({ minimum: 1 }), Type.Null()])),
  status: Type.Optional(ContentStatusSchema),
  featured: Type.Optional(Type.Boolean()),
});
export type UpdateNewsBody = Static<typeof UpdateNewsBodySchema>;

/**
 * Translation body schema for creating/updating translations.
 */
export const TranslationBodySchema = Type.Object({
  title: Type.String({ minLength: 1, maxLength: 255 }),
  description: Type.Optional(Type.String()),
  body: Type.Optional(Type.String()),
  metaTitle: Type.Optional(Type.String({ maxLength: 60 })),
  metaDescription: Type.Optional(Type.String({ maxLength: 160 })),
});
export type TranslationBody = Static<typeof TranslationBodySchema>;

/**
 * Create technology request body schema.
 */
export const CreateTechnologyBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  icon: Type.Optional(Type.String()),
  color: Type.Optional(
    Type.String({
      pattern: '^#[0-9A-Fa-f]{6}$',
      description: 'Hex color code (e.g., #3d7eff)',
    })
  ),
});
export type CreateTechnologyBody = Static<typeof CreateTechnologyBodySchema>;

/**
 * Update technology request body schema.
 */
export const UpdateTechnologyBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  icon: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  color: Type.Optional(
    Type.Union([
      Type.String({
        pattern: '^#[0-9A-Fa-f]{6}$',
      }),
      Type.Null(),
    ])
  ),
});
export type UpdateTechnologyBody = Static<typeof UpdateTechnologyBodySchema>;

/**
 * Create tag request body schema.
 */
export const CreateTagBodySchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  slug: SlugSchema,
});
export type CreateTagBody = Static<typeof CreateTagBodySchema>;

/**
 * Update tag request body schema.
 */
export const UpdateTagBodySchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
  slug: Type.Optional(SlugSchema),
});
export type UpdateTagBody = Static<typeof UpdateTagBodySchema>;

/**
 * Assign technologies to project body schema.
 */
export const AssignTechnologiesBodySchema = Type.Object({
  technologyIds: Type.Array(IdSchema, { minItems: 0 }),
});
export type AssignTechnologiesBody = Static<typeof AssignTechnologiesBodySchema>;

/**
 * Assign tags to news body schema.
 */
export const AssignTagsBodySchema = Type.Object({
  tagIds: Type.Array(IdSchema, { minItems: 0 }),
});
export type AssignTagsBody = Static<typeof AssignTagsBodySchema>;

/**
 * Technology/tag ID parameter for junction operations.
 */
export const JunctionIdParamSchema = Type.Object({
  id: Type.String({ pattern: '^[0-9]+$' }),
  techId: Type.Optional(Type.String({ pattern: '^[0-9]+$' })),
  tagId: Type.Optional(Type.String({ pattern: '^[0-9]+$' })),
});

// Response type schemas for OpenAPI documentation

/**
 * Translation response schema.
 */
export const TranslationResponseSchema = Type.Object({
  id: Type.Integer(),
  contentId: Type.Integer(),
  lang: LangSchema,
  title: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  body: Type.Union([Type.String(), Type.Null()]),
  metaTitle: Type.Union([Type.String(), Type.Null()]),
  metaDescription: Type.Union([Type.String(), Type.Null()]),
});

/**
 * Technology response schema.
 */
export const TechnologyResponseSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String(),
  icon: Type.Union([Type.String(), Type.Null()]),
  color: Type.Union([Type.String(), Type.Null()]),
});

/**
 * Tag response schema.
 */
export const TagResponseSchema = Type.Object({
  id: Type.Integer(),
  name: Type.String(),
  slug: Type.String(),
});

/**
 * Base content response schema.
 */
const ContentBaseResponseSchema = Type.Object({
  id: Type.Integer(),
  type: Type.String(),
  slug: Type.String(),
  status: ContentStatusSchema,
  featured: Type.Boolean(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  publishedAt: Type.Union([Type.String(), Type.Null()]),
});

/**
 * Project response schema for public endpoints.
 */
export const ProjectResponseSchema = Type.Object({
  ...ContentBaseResponseSchema.properties,
  githubUrl: Type.Union([Type.String(), Type.Null()]),
  demoUrl: Type.Union([Type.String(), Type.Null()]),
  projectStatus: Type.String(),
  startDate: Type.Union([Type.String(), Type.Null()]),
  endDate: Type.Union([Type.String(), Type.Null()]),
  translation: Type.Union([TranslationResponseSchema, Type.Null()]),
  technologies: Type.Array(TechnologyResponseSchema),
});

/**
 * Material response schema for public endpoints.
 */
export const MaterialResponseSchema = Type.Object({
  ...ContentBaseResponseSchema.properties,
  category: MaterialCategorySchema,
  downloadUrl: Type.String(),
  fileSize: Type.Union([Type.Integer(), Type.Null()]),
  translation: Type.Union([TranslationResponseSchema, Type.Null()]),
});

/**
 * News response schema for public endpoints.
 */
export const NewsResponseSchema = Type.Object({
  ...ContentBaseResponseSchema.properties,
  coverImage: Type.Union([Type.String(), Type.Null()]),
  readingTime: Type.Union([Type.Integer(), Type.Null()]),
  translation: Type.Union([TranslationResponseSchema, Type.Null()]),
  tags: Type.Array(TagResponseSchema),
});

/**
 * Admin project response schema (includes all translations).
 */
export const AdminProjectResponseSchema = Type.Object({
  ...ContentBaseResponseSchema.properties,
  githubUrl: Type.Union([Type.String(), Type.Null()]),
  demoUrl: Type.Union([Type.String(), Type.Null()]),
  projectStatus: Type.String(),
  startDate: Type.Union([Type.String(), Type.Null()]),
  endDate: Type.Union([Type.String(), Type.Null()]),
  translations: Type.Array(TranslationResponseSchema),
  technologies: Type.Array(TechnologyResponseSchema),
});

/**
 * Admin material response schema (includes all translations).
 */
export const AdminMaterialResponseSchema = Type.Object({
  ...ContentBaseResponseSchema.properties,
  category: MaterialCategorySchema,
  downloadUrl: Type.String(),
  fileSize: Type.Union([Type.Integer(), Type.Null()]),
  translations: Type.Array(TranslationResponseSchema),
});

/**
 * Admin news response schema (includes all translations).
 */
export const AdminNewsResponseSchema = Type.Object({
  ...ContentBaseResponseSchema.properties,
  coverImage: Type.Union([Type.String(), Type.Null()]),
  readingTime: Type.Union([Type.Integer(), Type.Null()]),
  translations: Type.Array(TranslationResponseSchema),
  tags: Type.Array(TagResponseSchema),
});

/**
 * Generic API response wrapper for single items.
 */
export const ApiResponseSchema = <T extends ReturnType<typeof Type.Object>>(schema: T) =>
  Type.Object({
    data: schema,
  });

/**
 * Pagination metadata schema.
 */
export const PaginationMetaSchema = Type.Object({
  total: Type.Integer(),
  offset: Type.Integer(),
  limit: Type.Integer(),
  hasMore: Type.Boolean(),
});

/**
 * Generic paginated response wrapper.
 */
export const PaginatedResponseSchema = <T extends ReturnType<typeof Type.Object>>(schema: T) =>
  Type.Object({
    data: Type.Array(schema),
    pagination: PaginationMetaSchema,
  });
