/**
 * Content Form Validation Schemas
 *
 * Zod validation schemas for content editor forms including
 * slug validation, URL validation, and translation requirements.
 */
import z4 from 'zod/v4';
import { CONTENT_STATUSES, PROJECT_STATUSES, MATERIAL_CATEGORIES } from '@marcomarchione/shared';

// Use the default export from zod/v4
const z = z4;

/**
 * Slug validation pattern.
 * Only lowercase letters, numbers, and hyphens.
 * Must not start or end with a hyphen.
 */
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Base slug validation schema.
 */
export const slugSchema = z.string()
  .min(1, 'Slug is required')
  .regex(SLUG_PATTERN, 'Slug must contain only lowercase letters, numbers, and hyphens');

/**
 * URL validation schema (optional).
 * Must start with http:// or https:// if provided.
 */
export const urlSchema = z.string()
  .refine(
    (value) => !value || value.startsWith('http://') || value.startsWith('https://'),
    'URL must start with http:// or https://'
  )
  .optional()
  .nullable();

/**
 * Required URL validation schema.
 */
export const requiredUrlSchema = z.string()
  .min(1, 'URL is required')
  .refine(
    (value) => value.startsWith('http://') || value.startsWith('https://'),
    'URL must start with http:// or https://'
  );

/**
 * Translation validation schema for a single language.
 */
export const translationSchema = z.object({
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
});

/**
 * Italian translation validation schema (title required).
 */
export const italianTranslationSchema = z.object({
  title: z.string().min(1, 'Italian title is required'),
  description: z.string().optional().nullable(),
  body: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
});

/**
 * All translations schema with Italian required.
 */
export const translationsSchema = z.object({
  it: italianTranslationSchema,
  en: translationSchema.optional(),
  es: translationSchema.optional(),
  de: translationSchema.optional(),
});

/**
 * Content status validation.
 */
export const contentStatusSchema = z.enum(CONTENT_STATUSES);

/**
 * Shared content fields schema (used by all content types).
 */
export const sharedFieldsSchema = z.object({
  slug: slugSchema,
  status: contentStatusSchema.optional().default('draft'),
  featured: z.boolean().optional().default(false),
});

/**
 * Project-specific fields schema.
 */
export const projectFieldsSchema = z.object({
  githubUrl: urlSchema,
  demoUrl: urlSchema,
  projectStatus: z.enum(PROJECT_STATUSES).optional().default('in-progress'),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  technologyIds: z.array(z.number()).optional().default([]),
});

/**
 * Material-specific fields schema.
 */
export const materialFieldsSchema = z.object({
  category: z.enum(MATERIAL_CATEGORIES).optional().default('resource'),
  downloadUrl: requiredUrlSchema,
  fileSize: z.number().optional().nullable(),
});

/**
 * News-specific fields schema.
 */
export const newsFieldsSchema = z.object({
  coverImage: z.string().optional().nullable(),
  readingTime: z.number().optional().nullable(),
  tagIds: z.array(z.number()).optional().default([]),
});

/**
 * Complete project form schema.
 */
export const projectFormSchema = sharedFieldsSchema
  .merge(projectFieldsSchema)
  .extend({
    translations: translationsSchema,
  });

/**
 * Complete material form schema.
 */
export const materialFormSchema = sharedFieldsSchema
  .merge(materialFieldsSchema)
  .extend({
    translations: translationsSchema,
  });

/**
 * Complete news form schema.
 */
export const newsFormSchema = sharedFieldsSchema
  .merge(newsFieldsSchema)
  .extend({
    translations: translationsSchema,
  });

/**
 * Type exports for form data.
 */
export type SlugInput = z4.infer<typeof slugSchema>;
export type TranslationData = z4.infer<typeof translationSchema>;
export type TranslationsData = z4.infer<typeof translationsSchema>;
export type SharedFieldsData = z4.infer<typeof sharedFieldsSchema>;
export type ProjectFieldsData = z4.infer<typeof projectFieldsSchema>;
export type MaterialFieldsData = z4.infer<typeof materialFieldsSchema>;
export type NewsFieldsData = z4.infer<typeof newsFieldsSchema>;
export type ProjectFormData = z4.infer<typeof projectFormSchema>;
export type MaterialFormData = z4.infer<typeof materialFormSchema>;
export type NewsFormData = z4.infer<typeof newsFormSchema>;

/**
 * Validation result type.
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * Validates data against a schema and returns a formatted result.
 */
export function validateFormData<T>(
  schema: z4.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Convert Zod errors to flat object
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  }

  return { success: false, errors };
}

/**
 * Validates only slug field.
 */
export function validateSlug(slug: string): { valid: boolean; error?: string } {
  const result = slugSchema.safeParse(slug);
  if (result.success) {
    return { valid: true };
  }
  return { valid: false, error: result.error.issues[0]?.message };
}

/**
 * Validates only URL field.
 */
export function validateUrl(url: string | null | undefined): { valid: boolean; error?: string } {
  if (!url) return { valid: true };
  const result = requiredUrlSchema.safeParse(url);
  if (result.success) {
    return { valid: true };
  }
  return { valid: false, error: result.error.issues[0]?.message };
}
