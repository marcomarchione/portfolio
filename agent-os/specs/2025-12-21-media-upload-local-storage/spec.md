# Specification: Media Upload & Local Storage

## Goal

Implement file upload API endpoints with local VPS filesystem storage for images and documents, including automatic WebP variant generation for responsive image delivery.

## User Stories

- As an admin, I want to upload images and documents so that I can use them in portfolio content
- As a visitor, I want to view optimized images at appropriate sizes so that pages load quickly on any device

## Specific Requirements

**File Upload Endpoint**
- Accept multipart/form-data POST requests at `/api/admin/media/upload`
- Validate file types: JPEG, PNG, WebP, GIF, SVG (images), PDF (documents)
- Enforce size limits: 10MB for images, 25MB for PDFs
- Generate unique storage key: `{year}/{month}/{uuid}-{original-filename}`
- Store files at configurable `UPLOADS_PATH` (default: `/uploads/`)
- Return media metadata with generated public URLs

**Image Processing Pipeline**
- Use Sharp library for image processing (Bun-compatible)
- Generate 3 WebP variants for raster images (JPEG, PNG, WebP, GIF): 400px, 800px, 1200px width
- Preserve original file in source format
- Store variants with naming: `{key}-thumb.webp`, `{key}-medium.webp`, `{key}-large.webp`
- Skip processing for SVG and PDF files (serve originals only)
- Process images asynchronously after upload response

**File Serving Configuration**
- Public URL pattern: `/media/{storage-key}` (e.g., `/media/2025/12/abc123-photo.jpg`)
- Configure nginx to serve `/uploads/` directory at `/media/` path
- All files publicly accessible without authentication
- Include `_headers` or nginx config recommendations for caching

**Media CRUD Endpoints**
- `GET /api/admin/media` - List media with pagination (limit, offset)
- `GET /api/admin/media/:id` - Get single media with all variant URLs
- `PUT /api/admin/media/:id` - Update metadata (altText only)
- `DELETE /api/admin/media/:id` - Soft-delete (set deletedAt timestamp)
- All admin endpoints require JWT authentication

**Database Schema Updates**
- Update media table to reflect local storage (remove R2 references in comments)
- Add `deletedAt` column (integer timestamp_ms, nullable) for soft-delete
- Add `variants` column (text, JSON) to store variant paths/metadata
- Add `width` and `height` columns (integer, nullable) for dimensions
- Add index on `deletedAt` for cleanup queries

**Soft-Delete and Cleanup**
- DELETE endpoint sets `deletedAt` timestamp instead of removing records
- Implement cleanup function to find records with `deletedAt` older than 30 days
- Cleanup deletes physical files (original + variants) then removes database record
- Expose cleanup as callable function (cron/interval scheduling deferred)

**TypeBox Validation Schemas**
- Create `MediaUploadSchema` for file validation (type, size)
- Create `MediaQuerySchema` extending pagination with optional `mimeType` filter
- Create `UpdateMediaBodySchema` for altText updates
- Follow existing patterns in `/src/api/types/content-schemas.ts`

**Error Handling**
- Add `PayloadTooLargeError` (413) for file size limit violations
- Add `UnsupportedMediaTypeError` (415) for invalid file types
- Use existing `ValidationError` for missing/invalid form data
- Log processing failures but don't fail upload (store original, retry variants later)

## Visual Design

No visual assets provided. This is a backend-only spec with no UI implementation.

## Existing Code to Leverage

**`/src/db/schema/media.ts`**
- Existing media table with id, filename, mimeType, size, storageKey, altText, createdAt
- Extend with deletedAt, variants, width, height columns
- Update comments to reference local VPS storage instead of Cloudflare R2

**`/src/api/routes/admin/materials.ts`**
- Reference for admin route structure with Elysia plugins
- Pattern for using authMiddleware, TypeBox schemas, response helpers
- CRUD endpoint patterns: list with pagination, get by ID, create, update, delete
- Use `formatAdminResponse` pattern for consistent response structure

**`/src/api/middleware/auth.ts`**
- Import and use existing `authMiddleware` for all admin media routes
- Follows JWT Bearer token pattern with `AdminContext` injection
- No modifications needed, just import and `.use(authMiddleware)`

**`/src/api/types/responses.ts`**
- Use `createResponse` for single item responses
- Use `createPaginatedResponse` for list endpoints
- Extend error types in `/src/api/types/errors.ts` for new error codes

**`/src/api/config.ts`**
- Add `UPLOADS_PATH` environment variable with default value
- Follow existing patterns for parsing and validating config
- Add to Config interface and loadConfig function

## Out of Scope

- Drag-and-drop upload UI (deferred to spec #8: Media Manager UI)
- Admin panel UI components (deferred to spec #8)
- Playwright/E2E testing (no UI in this spec)
- Video file support
- Image cropping or editing functionality
- Bulk upload operations
- Signed or expiring URLs
- CDN integration (Cloudflare handles edge caching transparently)
- Scheduled cron job setup (cleanup function only, scheduling separate)
- Cloud storage backup (R2 backup strategy is separate infrastructure concern)
