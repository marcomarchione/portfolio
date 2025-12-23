# Task Breakdown: Content CRUD APIs

## Overview

**Spec Size:** M (1 week)
**Total Task Groups:** 6
**Dependencies Completed:** Database Schema, API Foundation, Authentication System

This spec implements complete REST API endpoints for content management:
- **Public endpoints** (read-only): GET for projects, materials, news, technologies
- **Admin endpoints** (authenticated): Full CRUD for all content types plus tags
- **Features:** Pagination, filtering, soft delete, per-language translations, junction table management

## Task List

---

### Shared Utilities Layer

#### Task Group 1: TypeBox Schemas and Response Types
**Dependencies:** None
**Estimated Effort:** 2-3 hours

- [x] 1.0 Complete shared validation schemas and response types
  - [x] 1.1 Write 4-6 focused tests for validation schemas
    - Test content status enum validation (draft, published, archived)
    - Test project-specific query schema (technology filter)
    - Test material category validation (guide, template, resource, tool)
    - Test admin ID parameter validation
    - Test translation body schema required fields
  - [x] 1.2 Create content-specific TypeBox schemas in `src/api/types/content-schemas.ts`
    - `ContentStatusSchema` - validates draft/published/archived enum
    - `ProjectQuerySchema` - extends ListQuerySchema with `technology` filter
    - `MaterialQuerySchema` - extends ListQuerySchema with `category` filter
    - `NewsQuerySchema` - extends ListQuerySchema with `tag` filter
    - `AdminListQuerySchema` - adds `status` filter for admin endpoints
    - Follow pattern from existing `src/api/types/validation.ts`
  - [x] 1.3 Create request body schemas in `src/api/types/content-schemas.ts`
    - `CreateProjectBodySchema` - slug, status, featured, extension fields
    - `UpdateProjectBodySchema` - partial update fields
    - `CreateMaterialBodySchema` - slug, status, featured, category, downloadUrl, fileSize
    - `UpdateMaterialBodySchema` - partial update fields
    - `CreateNewsBodySchema` - slug, status, featured, coverImage, readingTime
    - `UpdateNewsBodySchema` - partial update fields
    - `TranslationBodySchema` - lang, title, description, body, metaTitle, metaDescription
  - [x] 1.4 Create technology and tag body schemas
    - `CreateTechnologyBodySchema` - name (required), icon, color
    - `UpdateTechnologyBodySchema` - partial update
    - `CreateTagBodySchema` - name, slug (both required)
    - `UpdateTagBodySchema` - partial update
    - `AssignTechnologiesBodySchema` - array of technology IDs
    - `AssignTagsBodySchema` - array of tag IDs
  - [x] 1.5 Create response type schemas for OpenAPI documentation
    - `ProjectResponseSchema` - content_base + project extension + translation
    - `MaterialResponseSchema` - content_base + material extension + translation
    - `NewsResponseSchema` - content_base + news extension + translation
    - `TechnologyResponseSchema` - id, name, icon, color
    - `TagResponseSchema` - id, name, slug
    - `AdminProjectResponseSchema` - includes all translations array
  - [x] 1.6 Ensure validation schema tests pass
    - Run ONLY the 4-6 tests written in 1.1
    - Verify schema validation works correctly

**Acceptance Criteria:**
- All TypeBox schemas compile without TypeScript errors
- Schemas align with database table constraints
- The 4-6 tests written in 1.1 pass
- Schemas are reusable across public and admin endpoints

---

#### Task Group 2: Database Query Utilities
**Dependencies:** Task Group 1
**Estimated Effort:** 3-4 hours

- [x] 2.0 Complete database query helper functions
  - [x] 2.1 Write 5-7 focused tests for query utilities
    - Test getProjectWithTranslation returns correct structure
    - Test listProjects pagination (limit/offset)
    - Test listProjects filters by published status
    - Test createContentWithExtension uses transaction
    - Test updateContentStatus sets archived correctly
    - Test technology reference check before delete
  - [x] 2.2 Create content query helpers in `src/db/queries/content.ts`
    - `getContentById(db, id)` - base content lookup by ID
    - `getContentBySlug(db, slug, type)` - content lookup by slug and type
    - `listContent(db, type, options)` - paginated list with filters
    - `countContent(db, type, options)` - count for pagination
    - Use Drizzle ORM query patterns
  - [x] 2.3 Create project-specific query helpers in `src/db/queries/projects.ts`
    - `getProjectWithTranslation(db, slug, lang)` - project + single translation
    - `getProjectWithAllTranslations(db, id)` - project + all translations (admin)
    - `listProjects(db, options)` - with technology filter support
    - `createProject(db, data)` - transaction: content_base + projects
    - `updateProject(db, id, data)` - update project fields
  - [x] 2.4 Create material-specific query helpers in `src/db/queries/materials.ts`
    - `getMaterialWithTranslation(db, slug, lang)`
    - `getMaterialWithAllTranslations(db, id)`
    - `listMaterials(db, options)` - with category filter support
    - `createMaterial(db, data)` - transaction: content_base + materials
    - `updateMaterial(db, id, data)`
  - [x] 2.5 Create news-specific query helpers in `src/db/queries/news.ts`
    - `getNewsWithTranslation(db, slug, lang)`
    - `getNewsWithAllTranslations(db, id)`
    - `listNews(db, options)` - with tag filter support
    - `createNews(db, data)` - transaction: content_base + news
    - `updateNews(db, id, data)`
  - [x] 2.6 Create translation query helpers in `src/db/queries/translations.ts`
    - `getTranslation(db, contentId, lang)`
    - `upsertTranslation(db, contentId, lang, data)` - create or update
    - `getAllTranslations(db, contentId)`
  - [x] 2.7 Create junction table query helpers in `src/db/queries/relations.ts`
    - `getProjectTechnologies(db, projectId)` - get technologies for project
    - `assignTechnologies(db, projectId, techIds)` - replace technologies
    - `removeTechnology(db, projectId, techId)` - remove single technology
    - `getNewsTags(db, newsId)` - get tags for news
    - `assignTags(db, newsId, tagIds)` - replace tags
    - `removeTag(db, newsId, tagId)` - remove single tag
  - [x] 2.8 Create lookup table query helpers in `src/db/queries/lookups.ts`
    - `listTechnologies(db)` - all technologies
    - `getTechnologyById(db, id)`
    - `createTechnology(db, data)`
    - `updateTechnology(db, id, data)`
    - `deleteTechnology(db, id)` - with reference check
    - `listTags(db)` - all tags
    - `getTagById(db, id)`
    - `createTag(db, data)`
    - `updateTag(db, id, data)`
    - `deleteTag(db, id)` - with reference check
  - [x] 2.9 Create barrel export in `src/db/queries/index.ts`
  - [x] 2.10 Ensure query utility tests pass
    - Run ONLY the 5-7 tests written in 2.1
    - Verify database operations work correctly

**Acceptance Criteria:**
- All query functions handle errors appropriately
- Transaction-based operations roll back on failure
- The 5-7 tests written in 2.1 pass
- Functions return properly typed data

---

### Public API Layer

#### Task Group 3: Public Read-Only Endpoints
**Dependencies:** Task Groups 1, 2
**Estimated Effort:** 4-5 hours

- [x] 3.0 Complete public API endpoints (no authentication required)
  - [x] 3.1 Write 6-8 focused tests for public endpoints
    - Test GET /projects returns only published content
    - Test GET /projects/:slug with ?lang= returns correct translation
    - Test GET /projects/:slug returns 404 for non-published
    - Test GET /materials with ?category= filter
    - Test GET /news with pagination (limit/offset)
    - Test GET /technologies returns all technologies
    - Test 404 response for non-existent slug
  - [x] 3.2 Create public projects routes in `src/api/routes/public/projects.ts`
    - `GET /projects` - list published projects with pagination
      - Query params: lang, limit, offset, featured, technology
      - Response: paginated list with translation for requested language
      - Include technologies array in response
    - `GET /projects/:slug` - single published project
      - Query param: lang (defaults to 'it')
      - Response: project with translation, technologies
      - Return 404 if not found or not published
    - Follow Elysia plugin pattern from `auth.ts`
    - Add OpenAPI detail blocks (tags, summary, description)
  - [x] 3.3 Create public materials routes in `src/api/routes/public/materials.ts`
    - `GET /materials` - list published materials with pagination
      - Query params: lang, limit, offset, featured, category
      - Response: paginated list with translation
    - `GET /materials/:slug` - single published material
      - Query param: lang
      - Response: material with translation
      - Return 404 if not found or not published
  - [x] 3.4 Create public news routes in `src/api/routes/public/news.ts`
    - `GET /news` - list published news with pagination
      - Query params: lang, limit, offset, featured, tag
      - Response: paginated list with translation
      - Include tags array in response
    - `GET /news/:slug` - single published news
      - Query param: lang
      - Response: news with translation, tags
      - Return 404 if not found or not published
  - [x] 3.5 Create public technologies routes in `src/api/routes/public/technologies.ts`
    - `GET /technologies` - list all technologies (no pagination)
      - Response: array of { id, name, icon, color }
      - No authentication required
      - No status filtering (technologies are standalone)
  - [x] 3.6 Create barrel export in `src/api/routes/public/index.ts`
    - Export combined `publicRoutes` plugin
    - All routes mounted without prefix (parent adds /api/v1)
  - [x] 3.7 Register public routes in `src/api/routes/index.ts`
    - Import and `.use(publicRoutes)` in apiRoutes
  - [x] 3.8 Ensure public endpoint tests pass
    - Run ONLY the 6-8 tests written in 3.1
    - Verify correct response structures

**Acceptance Criteria:**
- All endpoints return proper JSON responses using `createResponse()` or `createPaginatedResponse()`
- Published-only filter enforced on content endpoints
- The 6-8 tests written in 3.1 pass
- OpenAPI documentation generated correctly
- Proper 404 handling for missing/non-published content

---

### Admin API Layer

#### Task Group 4: Admin Content CRUD Endpoints
**Dependencies:** Task Groups 1, 2, 3
**Estimated Effort:** 5-6 hours

- [x] 4.0 Complete admin content CRUD endpoints (authentication required)
  - [x] 4.1 Write 6-8 focused tests for admin content endpoints
    - Test admin routes require authentication (401 without token)
    - Test POST /admin/projects creates content_base + projects in transaction
    - Test PUT /admin/projects/:id updates project fields
    - Test PUT /admin/projects/:id/translations/:lang creates/updates translation
    - Test DELETE /admin/projects/:id sets status to archived (not hard delete)
    - Test GET /admin/projects includes drafts and archived
    - Test GET /admin/projects/:id returns all translations
  - [x] 4.2 Create admin projects routes in `src/api/routes/admin/projects.ts`
    - Apply `authMiddleware` to route group
    - `GET /admin/projects` - list all projects (any status)
      - Query params: limit, offset, status filter
      - Response: paginated list with all translations
    - `GET /admin/projects/:id` - single project with all translations
    - `POST /admin/projects` - create new project
      - Body: slug, status, featured, extension fields
      - Transaction: create content_base + projects
      - Response: created project with ID
    - `PUT /admin/projects/:id` - update project
      - Body: partial update of content_base + extension fields
      - Handle status changes (set publishedAt when publishing)
    - `PUT /admin/projects/:id/translations/:lang` - upsert translation
      - Body: title, description, body, metaTitle, metaDescription
      - Create if not exists, update if exists
    - `DELETE /admin/projects/:id` - soft delete (set status=archived)
  - [x] 4.3 Create admin materials routes in `src/api/routes/admin/materials.ts`
    - Apply `authMiddleware` to route group
    - `GET /admin/materials` - list all materials (any status)
    - `GET /admin/materials/:id` - single material with all translations
    - `POST /admin/materials` - create new material
      - Required fields: slug, category, downloadUrl
      - Transaction: create content_base + materials
    - `PUT /admin/materials/:id` - update material
    - `PUT /admin/materials/:id/translations/:lang` - upsert translation
    - `DELETE /admin/materials/:id` - soft delete
  - [x] 4.4 Create admin news routes in `src/api/routes/admin/news.ts`
    - Apply `authMiddleware` to route group
    - `GET /admin/news` - list all news (any status)
    - `GET /admin/news/:id` - single news with all translations
    - `POST /admin/news` - create new news
      - Optional fields: coverImage, readingTime
      - Transaction: create content_base + news
    - `PUT /admin/news/:id` - update news
    - `PUT /admin/news/:id/translations/:lang` - upsert translation
    - `DELETE /admin/news/:id` - soft delete
  - [x] 4.5 Implement status transition logic
    - When status changes to 'published', set publishedAt to current timestamp
    - When status changes from 'published' to 'draft', keep publishedAt
    - updatedAt always updates on any modification
  - [x] 4.6 Ensure admin content endpoint tests pass
    - Run ONLY the 6-8 tests written in 4.1
    - Verify authentication is enforced
    - Verify transaction integrity

**Acceptance Criteria:**
- All admin routes protected by `authMiddleware`
- The 6-8 tests written in 4.1 pass
- Transactions ensure atomic operations
- Soft delete properly sets status to 'archived'
- Translation upsert works correctly (create or update)

---

#### Task Group 5: Admin Lookup and Junction Table Endpoints
**Dependencies:** Task Groups 1, 2, 4
**Estimated Effort:** 3-4 hours

- [x] 5.0 Complete admin endpoints for technologies, tags, and associations
  - [x] 5.1 Write 5-7 focused tests for lookup and junction endpoints
    - Test POST /admin/technologies creates technology
    - Test DELETE /admin/technologies/:id returns 409 if referenced
    - Test POST /admin/projects/:id/technologies assigns technologies
    - Test DELETE /admin/projects/:id/technologies/:techId removes association
    - Test POST /admin/tags creates tag with slug
    - Test DELETE /admin/tags/:id returns 409 if referenced by news
  - [x] 5.2 Create admin technologies routes in `src/api/routes/admin/technologies.ts`
    - Apply `authMiddleware` to route group
    - `GET /admin/technologies` - list all technologies
    - `POST /admin/technologies` - create technology
      - Body: name (required), icon, color
      - Response: created technology with ID
    - `PUT /admin/technologies/:id` - update technology
    - `DELETE /admin/technologies/:id` - hard delete
      - Check if referenced by any projects
      - Return 409 Conflict if in use
      - Delete only if unreferenced
  - [x] 5.3 Create admin tags routes in `src/api/routes/admin/tags.ts`
    - Apply `authMiddleware` to route group
    - `GET /admin/tags` - list all tags
    - `POST /admin/tags` - create tag
      - Body: name, slug (both required)
    - `PUT /admin/tags/:id` - update tag
    - `DELETE /admin/tags/:id` - hard delete
      - Check if referenced by any news
      - Return 409 Conflict if in use
  - [x] 5.4 Add technology assignment routes to admin/projects
    - `POST /admin/projects/:id/technologies` - assign technologies
      - Body: { technologyIds: number[] }
      - Replace all project technologies with provided list
    - `DELETE /admin/projects/:id/technologies/:techId` - remove single
  - [x] 5.5 Add tag assignment routes to admin/news
    - `POST /admin/news/:id/tags` - assign tags
      - Body: { tagIds: number[] }
      - Replace all news tags with provided list
    - `DELETE /admin/news/:id/tags/:tagId` - remove single
  - [x] 5.6 Create barrel export in `src/api/routes/admin/index.ts`
    - Export combined `adminRoutes` plugin
    - All routes mounted under /admin prefix
  - [x] 5.7 Register admin routes in `src/api/routes/index.ts`
    - Import and `.use(adminRoutes)` in apiRoutes
  - [x] 5.8 Ensure lookup and junction tests pass
    - Run ONLY the 5-7 tests written in 5.1
    - Verify 409 conflict handling

**Acceptance Criteria:**
- Technologies and tags have full CRUD
- The 5-7 tests written in 5.1 pass
- Reference checks prevent orphaned data
- Junction table operations work correctly
- 409 Conflict returned when trying to delete referenced items

---

### Testing & Quality

#### Task Group 6: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-5
**Estimated Effort:** 2-3 hours

- [x] 6.0 Review existing tests and fill critical gaps
  - [x] 6.1 Review tests from Task Groups 1-5
    - Review 4-6 tests from Task 1.1 (validation schemas) - 16 tests in content-schemas.test.ts
    - Review 5-7 tests from Task 2.1 (query utilities) - 12 tests in queries.test.ts
    - Review 6-8 tests from Task 3.1 (public endpoints) - 10 tests in public-endpoints.test.ts
    - Review 6-8 tests from Task 4.1 (admin content endpoints) - 10 tests in admin-content.test.ts
    - Review 5-7 tests from Task 5.1 (lookups and junctions) - 8 tests in admin-lookups.test.ts
    - Total existing tests: 56 tests
  - [x] 6.2 Analyze test coverage gaps for Content CRUD feature
    - Identified need for end-to-end workflow tests
    - Identified need for error scenario coverage
    - Prioritized integration tests
  - [x] 6.3 Write up to 8 additional strategic tests to fill gaps
    - Integration test: full project lifecycle (create -> translate -> publish -> archive)
    - Integration test: full news lifecycle with tag assignments
    - Error handling: duplicate slug on create returns error
    - Error handling: invalid language code returns validation error
    - Error handling: update non-existent content returns 404
    - Edge case: list with no results returns empty array with pagination
    - Edge case: featured filter returns only featured items
    - Edge case: technology filter returns projects with that technology
  - [x] 6.4 Run feature-specific tests only
    - Ran all Content CRUD related tests
    - Total: 68 tests pass
    - Verified all critical workflows pass
  - [x] 6.5 Verify OpenAPI documentation completeness
    - All endpoints have proper detail blocks with tags, summary, description
    - Request/response schemas documented

**Acceptance Criteria:**
- All feature-specific tests pass (68 tests)
- Critical CRUD workflows are covered
- 8 additional tests added in content-integration.test.ts
- OpenAPI documentation complete and accurate
- Error responses follow consistent format

---

## Execution Order

**Recommended implementation sequence:**

```
Week 1 Implementation Plan:

Day 1-2: Foundation
  1. Task Group 1: TypeBox Schemas and Response Types
  2. Task Group 2: Database Query Utilities

Day 3: Public API
  3. Task Group 3: Public Read-Only Endpoints

Day 4: Admin Content API
  4. Task Group 4: Admin Content CRUD Endpoints

Day 5: Admin Lookups + Testing
  5. Task Group 5: Admin Lookup and Junction Table Endpoints
  6. Task Group 6: Test Review and Gap Analysis
```

## File Structure Summary

New files to create:

```
src/api/types/
  content-schemas.ts          # TypeBox validation schemas

src/db/queries/
  index.ts                    # Barrel export
  content.ts                  # Base content queries
  projects.ts                 # Project-specific queries
  materials.ts                # Material-specific queries
  news.ts                     # News-specific queries
  translations.ts             # Translation queries
  relations.ts                # Junction table queries
  lookups.ts                  # Technologies and tags queries

src/api/routes/public/
  index.ts                    # Public routes barrel
  projects.ts                 # GET /projects, /projects/:slug
  materials.ts                # GET /materials, /materials/:slug
  news.ts                     # GET /news, /news/:slug
  technologies.ts             # GET /technologies

src/api/routes/admin/
  index.ts                    # Admin routes barrel
  projects.ts                 # CRUD /admin/projects
  materials.ts                # CRUD /admin/materials
  news.ts                     # CRUD /admin/news
  technologies.ts             # CRUD /admin/technologies
  tags.ts                     # CRUD /admin/tags

src/api/routes/
  index.ts                    # UPDATE: register public + admin routes
```

## Technical Notes

**Patterns to Follow:**
- Elysia plugin pattern: `new Elysia({ name: 'route-name', prefix: '/prefix' })`
- TypeBox schemas for all request validation
- OpenAPI detail blocks on every endpoint
- `createResponse()` for single items, `createPaginatedResponse()` for lists
- `authMiddleware` on all admin route groups
- Drizzle `db.transaction()` for atomic multi-table operations

**Error Handling:**
- 400: Invalid request body/parameters
- 401: Missing or invalid authentication
- 404: Resource not found
- 409: Conflict (duplicate slug, referenced entity)
- 500: Internal server error

**Response Consistency:**
- Single items: `{ data: T }`
- Lists: `{ data: T[], pagination: { total, offset, limit, hasMore } }`
- Errors: `{ error, message, details, timestamp, path }`
