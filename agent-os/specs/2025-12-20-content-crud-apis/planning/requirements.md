# Spec Requirements: Content CRUD APIs

## Initial Description

Build complete REST endpoints for content management: create, read, update, delete operations for projects, materials, and news with translation support and status management.

**Effort Estimate:** M (1 week)

**Dependencies (all completed):**
- Database Schema & Migrations
- Backend API Foundation
- Authentication System

## Requirements Discussion

### First Round Questions

**Q1:** The architecture document shows both public endpoints (GET /api/v1/projects, etc.) and admin endpoints (CRUD under /api/v1/admin/). I assume you want to build BOTH in this spec - public read-only endpoints for the Astro frontend AND authenticated admin endpoints for the CMS. Is that correct, or should we focus only on admin CRUD for now?

**Answer:** YES - build BOTH public read-only endpoints AND authenticated admin endpoints.

**Q2:** When creating or updating content, I assume the admin will provide translations for multiple languages in a single API call (e.g., create a project with IT, EN, ES, DE translations together). Is that correct, or do you prefer separate endpoints for managing translations independently?

**Answer:** Translations via language parameter - NOT all translations in one call. When creating/updating content, pass `language: IT` to manage the Italian translation. Each language is managed separately.

**Q3:** The schema includes junction tables for project-technologies and news-tags. I assume the CRUD endpoints should handle these associations. Should we also include full CRUD for the technologies and tags themselves in this spec, or defer that?

**Answer:** YES - include full CRUD for technologies and tags in this spec.

**Q4:** For DELETE operations, I assume hard delete with CASCADE (content and all translations removed permanently) is acceptable. Is that correct, or do you want soft delete (archived status) with a separate purge mechanism?

**Answer:** SOFT DELETE - use archived status instead of hard delete. Content is archived, not permanently removed.

**Q5:** Is there anything that should be explicitly OUT of scope for this spec?

**Answer:** Standard exclusions assumed (no bulk operations, no import/export, no versioning, no scheduled publishing).

### Existing Code to Reference

**Similar Features Identified:**
- Database schemas: `src/db/schema/` - All table definitions with relations
- Route patterns: `src/api/routes/auth.ts` - Elysia route structure and patterns
- Type definitions: `src/api/types/` - TypeBox schemas and response helpers
- Auth middleware: `src/api/middleware/auth.ts` - authMiddleware for protecting admin routes

### Follow-up Questions

None required - all answers were clear and complete.

## Visual Assets

### Files Provided:
No visual assets provided (confirmed as backend-only feature).

### Visual Insights:
Not applicable for API specification.

## Requirements Summary

### Functional Requirements

**Public API (Read-Only, No Authentication):**
- List published projects with pagination and filtering (by technology, featured status)
- Get single project by slug with translations for requested language
- List published materials with pagination and filtering (by category, featured status)
- Get single material by slug with translations for requested language
- List published news with pagination and filtering (by tag, featured status)
- Get single news item by slug with translations for requested language
- List all technologies
- List all tags

**Admin API (Authenticated via JWT):**

*Projects CRUD:*
- Create new project (content_base + projects extension)
- Create/update translation for a project in a specific language
- Update project metadata and extension fields
- Archive project (soft delete via status change)
- List all projects (including drafts and archived)
- Get project details with all translations

*Materials CRUD:*
- Create new material (content_base + materials extension)
- Create/update translation for a material in a specific language
- Update material metadata and extension fields
- Archive material (soft delete)
- List all materials (including drafts and archived)
- Get material details with all translations

*News CRUD:*
- Create new news item (content_base + news extension)
- Create/update translation for news in a specific language
- Update news metadata and extension fields
- Archive news (soft delete)
- List all news (including drafts and archived)
- Get news details with all translations

*Technologies CRUD:*
- Create technology (name, icon, color)
- Update technology
- Delete technology (hard delete if not referenced, or error)
- List all technologies
- Assign/remove technologies from projects

*Tags CRUD:*
- Create tag (name, slug)
- Update tag
- Delete tag (hard delete if not referenced, or error)
- List all tags
- Assign/remove tags from news items

**Translation Management:**
- Language specified via query parameter (e.g., `?lang=it`)
- Each language managed independently
- Supported languages: it, en, es, de
- Public endpoints return content in requested language only
- Admin endpoints can access all translations

**Status Management:**
- Statuses: draft, published, archived
- Only published content visible on public endpoints
- Admin endpoints see all statuses
- Archiving sets status to "archived" (soft delete)
- publishedAt timestamp set when status changes to "published"

### Reusability Opportunities

- Follow route patterns from `src/api/routes/auth.ts`
- Use TypeBox schemas from `src/api/types/` for validation
- Apply `authMiddleware` from `src/api/middleware/auth.ts` to admin routes
- Leverage Drizzle ORM patterns from existing schema relations

### Scope Boundaries

**In Scope:**
- Public read-only endpoints for all content types
- Admin CRUD endpoints for projects, materials, news
- Admin CRUD endpoints for technologies and tags
- Per-language translation management
- Soft delete via archived status
- Pagination and filtering on list endpoints
- Featured content filtering
- Status-based filtering (admin only)

**Out of Scope:**
- Bulk operations (batch create/update/delete)
- Import/export functionality
- Content versioning or revision history
- Scheduled publishing (future publishedAt)
- Media upload (separate spec #5)
- Full-text search (basic filtering only)

### Technical Considerations

**API Structure (from architecture document):**
- Public endpoints: `/api/v1/projects`, `/api/v1/materials`, `/api/v1/news`, `/api/v1/technologies`
- Admin endpoints: `/api/v1/admin/projects`, `/api/v1/admin/materials`, `/api/v1/admin/news`, `/api/v1/admin/technologies`, `/api/v1/admin/tags`

**Query Parameters:**
- `lang` - Language filter (it, en, es, de)
- `limit` - Pagination limit
- `offset` - Pagination offset
- `featured` - Filter by featured status (boolean)
- `status` - Filter by status (admin only)
- `technology` - Filter projects by technology slug
- `category` - Filter materials by category
- `tag` - Filter news by tag slug

**Response Patterns:**
- List responses include pagination metadata (total, limit, offset)
- Single item responses include full entity with requested translation
- Admin single item responses include all translations
- Error responses follow existing error handler patterns

**Database Transactions:**
- Content creation requires transaction (content_base + extension table + initial translation)
- Technology/tag assignment uses junction tables (project_technologies, news_tags)

**Validation:**
- Slug uniqueness enforced
- Language codes validated against LANGUAGES enum
- Status validated against CONTENT_STATUSES enum
- Required fields: type, slug, title (per translation)
