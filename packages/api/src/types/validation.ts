/**
 * Shared TypeBox Validation Schemas
 *
 * Reusable validation schemas for API request validation.
 * Aligns with database schema constraints.
 */
import { Type, type Static } from '@sinclair/typebox';

/** Supported languages from database schema */
export const LANGUAGES = ['it', 'en', 'es', 'de'] as const;

/**
 * Language parameter schema.
 * Validates language code against supported languages.
 */
export const LangSchema = Type.Union(
  LANGUAGES.map((lang) => Type.Literal(lang)),
  { description: 'Supported language code' }
);
export type Lang = Static<typeof LangSchema>;

/**
 * Integer or numeric string schema.
 * Query parameters come as strings, so we accept both.
 */
const IntegerOrString = (opts: { minimum?: number; maximum?: number; default?: number; description?: string }) =>
  Type.Transform(
    Type.Union([
      Type.Number(opts),
      Type.String({ pattern: '^-?[0-9]+$' }),
    ])
  )
    .Decode((value) => (typeof value === 'string' ? parseInt(value, 10) : value))
    .Encode((value) => value);

/**
 * Pagination query parameter schema.
 * Supports limit and offset for paginated endpoints.
 * Accepts both integer and string values (for URL query params).
 */
export const PaginationSchema = Type.Object({
  limit: Type.Optional(
    IntegerOrString({
      minimum: 1,
      maximum: 100,
      default: 20,
      description: 'Number of items per page (1-100)',
    })
  ),
  offset: Type.Optional(
    IntegerOrString({
      minimum: 0,
      default: 0,
      description: 'Number of items to skip',
    })
  ),
});
export type Pagination = Static<typeof PaginationSchema>;

/**
 * URL slug validation schema.
 * Validates URL-friendly strings: lowercase alphanumeric with hyphens.
 */
export const SlugSchema = Type.String({
  pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  minLength: 1,
  maxLength: 255,
  description: 'URL-friendly slug (lowercase letters, numbers, hyphens)',
});
export type Slug = Static<typeof SlugSchema>;

/**
 * Resource ID schema.
 * Validates positive integer IDs.
 */
export const IdSchema = Type.Integer({
  minimum: 1,
  description: 'Positive integer resource ID',
});
export type Id = Static<typeof IdSchema>;

/**
 * Boolean or boolean string schema for query params.
 * Accepts "true"/"false" strings or actual booleans.
 */
const BooleanOrString = Type.Transform(
  Type.Union([
    Type.Boolean(),
    Type.Literal('true'),
    Type.Literal('false'),
  ])
)
  .Decode((value) => {
    if (typeof value === 'boolean') return value;
    return value === 'true';
  })
  .Encode((value) => value);

/**
 * Featured filter schema.
 * Optional boolean to filter featured content.
 * Accepts both boolean and string "true"/"false" values.
 */
export const FeaturedSchema = Type.Optional(BooleanOrString);
export type Featured = Static<typeof FeaturedSchema>;

/**
 * Common query parameters for list endpoints.
 * Combines language, pagination, and featured filter.
 */
export const ListQuerySchema = Type.Object({
  lang: Type.Optional(LangSchema),
  ...PaginationSchema.properties,
  featured: FeaturedSchema,
});
export type ListQuery = Static<typeof ListQuerySchema>;

/**
 * Boolean query parameter that accepts string "true"/"false".
 * Useful for query params that come as strings.
 */
export const BooleanStringSchema = Type.Transform(Type.String())
  .Decode((value) => value === 'true')
  .Encode((value) => String(value));

/**
 * Database check query parameter for health endpoint.
 */
export const DbCheckSchema = Type.Optional(
  Type.Union([Type.Literal('true'), Type.Literal('false')], {
    description: 'Include database connectivity check',
  })
);
export type DbCheck = Static<typeof DbCheckSchema>;
