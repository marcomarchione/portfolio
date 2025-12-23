# Specification: Content CRUD APIs

## Goal

Build complete REST API endpoints for content management with public read-only access for the Astro frontend and authenticated admin endpoints for full CRUD operations, supporting per-language translation management and soft delete via archived status.

## User Stories

- As a website visitor, I want to browse published projects, materials, and news in my preferred language so that I can explore Marco's work and resources.
- As an admin, I want to create, update, and archive content with independent translations for each language so that I can manage the multilingual portfolio efficiently.

## Specific Requirements

**Public Projects Endpoint**
- GET `/api/v1/projects` returns paginated list of published projects only (status = 'published')
- Query params: `?lang=`, `?limit=`, `?offset=`, `?featured=`, `?technology=` (filter by technology slug)
- Response includes content_base fields, project extension fields, and single translation for requested language
- GET `/api/v1/projects/:slug` returns single project with translation for `?lang=` parameter
- Include associated technologies array in response
- Return 404 if project not found or not published

**Public Materials Endpoint**
- GET `/api/v1/materials` returns paginated list of published materials only
- Query params: `?lang=`, `?limit=`, `?offset=`, `?featured=`, `?category=` (filter by material category)
- Response includes content_base fields, material extension fields (category, downloadUrl, fileSize), and translation
- GET `/api/v1/materials/:slug` returns single material with translation for requested language
- Material categories: guide, template, resource, tool

**Public News Endpoint**
- GET `/api/v1/news` returns paginated list of published news articles only
- Query params: `?lang=`, `?limit=`, `?offset=`, `?featured=`, `?tag=` (filter by tag slug)
- Response includes content_base fields, news extension fields (coverImage, readingTime), and translation
- GET `/api/v1/news/:slug` returns single news article with translation for requested language
- Include associated tags array in response

**Public Technologies and Tags Endpoints**
- GET `/api/v1/technologies` returns all technologies (no auth required, no pagination needed)
- Response includes id, name, icon, color fields
- Technologies are standalone resources, not filtered by content status

**Admin Projects CRUD**
- POST `/api/v1/admin/projects` creates content_base (type='project') + projects extension in transaction
- PUT `/api/v1/admin/projects/:id` updates project metadata and extension fields
- PUT `/api/v1/admin/projects/:id/translations/:lang` creates or updates translation for specific language
- DELETE `/api/v1/admin/projects/:id` sets status to 'archived' (soft delete, not hard delete)
- GET `/api/v1/admin/projects` lists all projects including drafts and archived, with optional status filter
- GET `/api/v1/admin/projects/:id` returns project with all translations

**Admin Materials CRUD**
- POST `/api/v1/admin/materials` creates content_base (type='material') + materials extension in transaction
- PUT `/api/v1/admin/materials/:id` updates material metadata and extension fields
- PUT `/api/v1/admin/materials/:id/translations/:lang` creates or updates translation for specific language
- DELETE `/api/v1/admin/materials/:id` sets status to 'archived' (soft delete)
- GET `/api/v1/admin/materials` lists all materials with optional status filter
- GET `/api/v1/admin/materials/:id` returns material with all translations

**Admin News CRUD**
- POST `/api/v1/admin/news` creates content_base (type='news') + news extension in transaction
- PUT `/api/v1/admin/news/:id` updates news metadata and extension fields
- PUT `/api/v1/admin/news/:id/translations/:lang` creates or updates translation for specific language
- DELETE `/api/v1/admin/news/:id` sets status to 'archived' (soft delete)
- GET `/api/v1/admin/news` lists all news with optional status filter
- GET `/api/v1/admin/news/:id` returns news with all translations

**Admin Technologies CRUD**
- POST `/api/v1/admin/technologies` creates new technology (name required, icon and color optional)
- PUT `/api/v1/admin/technologies/:id` updates technology fields
- DELETE `/api/v1/admin/technologies/:id` hard deletes if not referenced by projects, else returns 409 Conflict
- GET `/api/v1/admin/technologies` lists all technologies
- POST `/api/v1/admin/projects/:id/technologies` assigns technologies to project (array of technology IDs)
- DELETE `/api/v1/admin/projects/:id/technologies/:techId` removes technology from project

**Admin Tags CRUD**
- POST `/api/v1/admin/tags` creates new tag (name and slug required)
- PUT `/api/v1/admin/tags/:id` updates tag fields
- DELETE `/api/v1/admin/tags/:id` hard deletes if not referenced by news, else returns 409 Conflict
- GET `/api/v1/admin/tags` lists all tags
- POST `/api/v1/admin/news/:id/tags` assigns tags to news article (array of tag IDs)
- DELETE `/api/v1/admin/news/:id/tags/:tagId` removes tag from news article

## Visual Design

No visual assets provided (confirmed as backend-only API specification).

## Existing Code to Leverage

**`src/api/routes/auth.ts` - Elysia Route Patterns**
- Follow the Elysia plugin pattern with `new Elysia({ name: 'route-name', prefix: '/prefix' })`
- Use TypeBox schemas for body, query, and response validation
- Include OpenAPI detail blocks with tags, summary, and description for each endpoint
- Use `createResponse()` helper for consistent response wrapping

**`src/api/middleware/auth.ts` - Authentication Middleware**
- Apply `authMiddleware` to all admin route groups using `.use(authMiddleware)`
- Middleware injects `admin` context with `sub` field for authenticated user
- Protects routes by requiring valid JWT Bearer token in Authorization header
- Throws `UnauthorizedError` for invalid or missing tokens

**`src/api/types/responses.ts` - Response Helpers**
- Use `createResponse<T>(data)` for single-item responses with `{ data: T }` structure
- Use `createPaginatedResponse<T>(data, total, offset, limit)` for list endpoints with pagination metadata
- Use `createErrorResponse()` for structured error responses

**`src/api/types/validation.ts` - TypeBox Schemas**
- Reuse `LangSchema`, `PaginationSchema`, `SlugSchema`, `IdSchema`, `FeaturedSchema`, `ListQuerySchema`
- Create content-specific schemas extending these base schemas
- Use TypeBox Type.Object(), Type.String(), Type.Optional() for request body validation

**`src/db/schema/` - Database Schema and Relations**
- Leverage existing table definitions: contentBase, contentTranslations, projects, materials, news, technologies, tags
- Use junction tables: projectTechnologies, newsTags for many-to-many relationships
- Use Drizzle's `db.transaction()` for atomic content creation (content_base + extension + initial translation)
- Query with joins using Drizzle's relation helpers

## Out of Scope

- Bulk operations (batch create, update, or delete multiple items)
- Import/export functionality (CSV, JSON data import)
- Content versioning or revision history
- Scheduled publishing (future publishedAt dates)
- Media upload endpoints (covered in separate spec #5)
- Full-text search (only basic filtering by explicit fields)
- Hard delete for content (only soft delete via archived status)
- Public endpoints for tags (only technologies are public)
- Translation deletion (translations can only be created or updated)
- Content cloning or duplication
