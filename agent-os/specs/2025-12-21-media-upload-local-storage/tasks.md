# Task Breakdown: Media Upload & Local Storage

## Overview

**Total Tasks:** 28 sub-tasks across 5 task groups
**Estimated Effort:** 3-4 development sessions
**Dependencies:** Database Schema & Migrations, Backend API Foundation, Authentication System, Content CRUD APIs

This spec implements file upload API endpoints with local VPS filesystem storage, including automatic WebP variant generation for responsive image delivery.

---

## Task List

### Database Layer

#### Task Group 1: Media Schema Migration
**Dependencies:** None
**Estimated Effort:** 1-2 hours

- [x] 1.0 Complete database schema updates for media table
  - [x] 1.1 Write 4-6 focused tests for media schema changes
    - Test new column constraints (deletedAt nullable, variants JSON)
    - Test index on deletedAt for cleanup queries
    - Test width/height nullable integer columns
    - Test variants column stores valid JSON
    - Use existing test patterns from `/src/db/core-tables.test.ts`
  - [x] 1.2 Update media table schema in `/src/db/schema/media.ts`
    - Add `deletedAt` column (integer timestamp_ms, nullable)
    - Add `variants` column (text for JSON storage, nullable)
    - Add `width` column (integer, nullable)
    - Add `height` column (integer, nullable)
    - Update comments: replace "Cloudflare R2" references with "local VPS filesystem"
    - Add index on `deletedAt` for cleanup queries
  - [x] 1.3 Create migration file for schema changes
    - Path: `/src/db/migrations/meta/NNNN_add_media_variants.sql`
    - Add columns with proper defaults
    - Create index `idx_media_deleted_at` on `deletedAt`
  - [x] 1.4 Update Media types (Media, NewMedia)
    - Export updated types from schema file
    - Ensure variants type supports JSON structure for variant metadata
  - [x] 1.5 Run migration and verify schema changes
    - Execute `bun run db:generate` and `bun run db:push`
    - Verify new columns exist in database
  - [x] 1.6 Ensure database layer tests pass
    - Run ONLY the tests written in 1.1
    - Verify migrations run successfully

**Acceptance Criteria:**
- Media table has new columns: `deletedAt`, `variants`, `width`, `height`
- Index exists on `deletedAt` column
- All 4-6 schema tests pass
- Migration runs without errors

---

### Configuration & Error Handling

#### Task Group 2: Config and Error Extensions
**Dependencies:** None (can run parallel to Task Group 1)
**Estimated Effort:** 30-45 minutes

- [x] 2.0 Complete configuration and error handling updates
  - [x] 2.1 Write 3-4 focused tests for new error types
    - Test PayloadTooLargeError returns 413 status
    - Test UnsupportedMediaTypeError returns 415 status
    - Test error response format matches existing pattern
  - [x] 2.2 Add UPLOADS_PATH configuration to `/src/api/config.ts`
    - Add to Config interface: `UPLOADS_PATH: string`
    - Default value: `./uploads` (relative to project root)
    - Parse from environment variable
    - Add to loadConfig function
  - [x] 2.3 Add new error classes to `/src/api/types/errors.ts`
    - Add error codes: `PAYLOAD_TOO_LARGE`, `UNSUPPORTED_MEDIA_TYPE`
    - Create `PayloadTooLargeError` class (413 status)
    - Create `UnsupportedMediaTypeError` class (415 status)
    - Follow existing ApiError pattern
  - [x] 2.4 Ensure config and error tests pass
    - Run ONLY the tests written in 2.1
    - Verify error classes instantiate correctly

**Acceptance Criteria:**
- `UPLOADS_PATH` configuration variable available
- PayloadTooLargeError returns HTTP 413
- UnsupportedMediaTypeError returns HTTP 415
- All 3-4 tests pass

---

### File Utilities & Image Processing

#### Task Group 3: File Upload Utilities and Image Processing
**Dependencies:** Task Group 2 (needs UPLOADS_PATH config)
**Estimated Effort:** 2-3 hours

- [x] 3.0 Complete file upload utilities and image processing service
  - [x] 3.1 Write 6-8 focused tests for file utilities and image processing
    - Test storage key generation: `{year}/{month}/{uuid}-{filename}`
    - Test file type validation (accepts JPEG, PNG, WebP, GIF, SVG, PDF)
    - Test file type rejection for unsupported types
    - Test file size validation (10MB images, 25MB PDFs)
    - Test image processing generates correct variant filenames
    - Test SVG and PDF files skip variant generation
    - Test path generation for variants (`{key}-thumb.webp`, `{key}-medium.webp`, `{key}-large.webp`)
  - [x] 3.2 Create file validation utilities at `/src/services/media/validation.ts`
    - Define allowed MIME types map with size limits:
      - Images: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/svg+xml` (10MB)
      - Documents: `application/pdf` (25MB)
    - `validateFileType(mimeType: string): boolean`
    - `validateFileSize(mimeType: string, size: number): boolean`
    - `isRasterImage(mimeType: string): boolean` (for variant processing)
  - [x] 3.3 Create storage key generator at `/src/services/media/storage.ts`
    - `generateStorageKey(filename: string): string`
      - Format: `{year}/{month}/{uuid}-{sanitized-filename}`
      - Sanitize filename (remove special chars, preserve extension)
    - `getVariantKey(storageKey: string, variant: 'thumb' | 'medium' | 'large'): string`
      - Returns: `{key-without-ext}-{variant}.webp`
    - `getPublicUrl(storageKey: string): string`
      - Returns: `/media/{storageKey}`
    - `getFilePath(uploadsPath: string, storageKey: string): string`
      - Returns absolute filesystem path
  - [x] 3.4 Create image processing service at `/src/services/media/image-processor.ts`
    - Use Sharp library for image processing
    - `async processImage(inputPath: string, outputDir: string, storageKey: string): Promise<VariantResult>`
    - Generate 3 WebP variants:
      - `thumb`: 400px width
      - `medium`: 800px width
      - `large`: 1200px width
    - Preserve aspect ratio
    - Extract dimensions (width, height) from original
    - Return variant metadata object
    - Skip processing for SVG and PDF (return empty variants)
  - [x] 3.5 Create upload service at `/src/services/media/upload-service.ts`
    - `async saveFile(file: File, uploadsPath: string): Promise<SaveResult>`
      - Generate storage key
      - Create directory structure if needed
      - Write file to disk
      - Return storage key and file metadata
    - `async deleteFile(uploadsPath: string, storageKey: string, variants?: string[]): Promise<void>`
      - Delete original file
      - Delete all variant files if provided
  - [x] 3.6 Create barrel export at `/src/services/media/index.ts`
    - Export all utilities and services
  - [x] 3.7 Ensure file utility and image processing tests pass
    - Run ONLY the 6-8 tests written in 3.1
    - Verify Sharp integration works correctly

**Acceptance Criteria:**
- Storage keys generated in correct format
- File validation correctly accepts/rejects file types and sizes
- Image processing generates 3 WebP variants at correct widths
- SVG and PDF files skip variant generation
- All 6-8 tests pass

---

### API Layer

#### Task Group 4: Admin Media API Endpoints
**Dependencies:** Task Groups 1, 2, 3
**Estimated Effort:** 2-3 hours

- [x] 4.0 Complete admin media API endpoints
  - [x] 4.1 Write 6-8 focused tests for media API endpoints
    - Test POST /api/admin/media/upload accepts valid file
    - Test POST /api/admin/media/upload returns 413 for oversized file
    - Test POST /api/admin/media/upload returns 415 for invalid type
    - Test GET /api/admin/media returns paginated list
    - Test GET /api/admin/media/:id returns single media with variants
    - Test PUT /api/admin/media/:id updates altText
    - Test DELETE /api/admin/media/:id sets deletedAt (soft delete)
    - Test endpoints require authentication (401 without token)
  - [x] 4.2 Create TypeBox validation schemas at `/src/api/types/media-schemas.ts`
    - `MediaQuerySchema` extending pagination with optional `mimeType` filter
    - `UpdateMediaBodySchema` for altText updates
    - `MediaIdParamSchema` for :id parameter
    - `MediaResponseSchema` for single media response
    - `MediaVariantsSchema` for variant metadata structure
    - Follow patterns from `/src/api/types/content-schemas.ts`
  - [x] 4.3 Create media query functions at `/src/db/queries/media.ts`
    - `insertMedia(db, data): Media`
    - `getMediaById(db, id): Media | undefined`
    - `listMedia(db, options): Media[]`
    - `countMedia(db, options): number`
    - `updateMediaAltText(db, id, altText): Media | undefined`
    - `softDeleteMedia(db, id): Media | undefined`
    - `getExpiredSoftDeletedMedia(db, daysOld): Media[]`
    - `permanentlyDeleteMedia(db, id): boolean`
    - Update barrel export at `/src/db/queries/index.ts`
  - [x] 4.4 Create admin media routes at `/src/api/routes/admin/media.ts`
    - Use Elysia plugin pattern from materials.ts
    - Apply `authMiddleware` for all routes
    - **POST /** - Upload file (multipart/form-data)
      - Validate file type and size
      - Save file using upload service
      - Process image variants asynchronously (fire-and-forget)
      - Insert media record
      - Return media with public URLs
    - **GET /** - List media with pagination
      - Support `limit`, `offset`, `mimeType` query params
      - Return paginated response with all media
    - **GET /:id** - Get single media
      - Return media with all variant URLs
      - 404 if not found or soft-deleted
    - **PUT /:id** - Update altText
      - Validate body with UpdateMediaBodySchema
      - Return updated media
    - **DELETE /:id** - Soft delete
      - Set deletedAt timestamp
      - Return success response
  - [x] 4.5 Create response formatter for media
    - `formatMediaResponse(media: Media): MediaResponse`
    - Include all variant URLs if variants exist
    - Use `getPublicUrl` for URL generation
  - [x] 4.6 Register media routes in admin routes index
    - Update `/src/api/routes/admin/index.ts`
    - Add `adminMediaRoutes` with prefix `/media`
  - [x] 4.7 Ensure API endpoint tests pass
    - Run ONLY the 6-8 tests written in 4.1
    - Verify all CRUD operations work correctly

**Acceptance Criteria:**
- POST /api/admin/media/upload accepts multipart file uploads
- Proper error responses for oversized (413) and invalid type (415) files
- GET endpoints return media with variant URLs
- PUT updates altText only
- DELETE performs soft-delete
- All endpoints require authentication
- All 6-8 tests pass

---

### Cleanup Utilities

#### Task Group 5: Soft-Delete Cleanup Utility
**Dependencies:** Task Groups 1, 3, 4
**Estimated Effort:** 1 hour

- [x] 5.0 Complete soft-delete cleanup utility
  - [x] 5.1 Write 3-4 focused tests for cleanup functionality
    - Test cleanup finds records with deletedAt older than 30 days
    - Test cleanup deletes physical files (original + variants)
    - Test cleanup removes database record after file deletion
    - Test cleanup skips records newer than 30 days
  - [x] 5.2 Create cleanup service at `/src/services/media/cleanup.ts`
    - `async cleanupExpiredMedia(db, uploadsPath, daysOld = 30): Promise<CleanupResult>`
      - Query for soft-deleted records older than threshold
      - For each record:
        - Delete physical files (original + all variants)
        - Permanently delete database record
      - Return count of cleaned records and any errors
    - Handle file deletion errors gracefully (log but continue)
  - [x] 5.3 Create cleanup CLI entry point at `/src/scripts/cleanup-media.ts`
    - Parse command-line arguments for optional days threshold
    - Initialize database connection
    - Run cleanup
    - Log results
    - Exit with appropriate code
  - [x] 5.4 Add cleanup script to package.json
    - Add script: `"media:cleanup": "bun run src/scripts/cleanup-media.ts"`
  - [x] 5.5 Ensure cleanup tests pass
    - Run ONLY the 3-4 tests written in 5.1
    - Verify files are properly cleaned up

**Acceptance Criteria:**
- Cleanup identifies records with deletedAt > 30 days old
- Physical files (original + variants) are deleted
- Database records are permanently removed after file deletion
- Script can be run via `bun run media:cleanup`
- All 3-4 tests pass

---

### Integration & Test Review

#### Task Group 6: Test Review & Gap Analysis
**Dependencies:** Task Groups 1-5
**Estimated Effort:** 1-1.5 hours

- [x] 6.0 Review existing tests and fill critical gaps only
  - [x] 6.1 Review tests from Task Groups 1-5
    - Review the 4-6 tests from database layer (Task 1.1)
    - Review the 3-4 tests from config/errors (Task 2.1)
    - Review the 6-8 tests from file utilities (Task 3.1)
    - Review the 6-8 tests from API endpoints (Task 4.1)
    - Review the 3-4 tests from cleanup (Task 5.1)
    - Total existing tests: approximately 22-30 tests
  - [x] 6.2 Analyze test coverage gaps for media upload feature only
    - Identify critical user workflows lacking coverage
    - Focus ONLY on gaps related to this spec's requirements
    - Prioritize end-to-end workflows:
      - Full upload flow (file -> storage -> DB -> response)
      - Full cleanup flow (soft-delete -> expire -> cleanup -> file gone)
  - [x] 6.3 Write up to 8 additional strategic tests maximum
    - Integration test: full upload flow with image processing
    - Integration test: upload followed by soft-delete and cleanup
    - Edge case: concurrent uploads with same filename
    - Edge case: upload when disk write fails
    - Edge case: image processing fails but original saved
    - Error handling: malformed multipart request
  - [x] 6.4 Run feature-specific tests only
    - Run ONLY tests related to media upload feature
    - Expected total: approximately 30-38 tests maximum
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (30-38 tests total)
- Full upload and cleanup workflows are covered
- No more than 8 additional tests added
- Testing focused exclusively on media upload feature

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Database Schema** - Foundation for all other work
2. **Task Group 2: Config & Errors** - Can run parallel to Group 1
3. **Task Group 3: File Utilities** - Depends on config (UPLOADS_PATH)
4. **Task Group 4: API Endpoints** - Depends on Groups 1, 2, 3
5. **Task Group 5: Cleanup Utility** - Depends on Groups 1, 3, 4
6. **Task Group 6: Test Review** - Final validation after all implementation

```
Timeline Visualization:

Day 1 (Session 1):
  [Task Group 1: DB Schema] ----+
  [Task Group 2: Config/Errors]-+---> [Task Group 3: File Utils]

Day 2 (Session 2):
  [Task Group 3: continued] ---> [Task Group 4: API Endpoints]

Day 3 (Session 3):
  [Task Group 4: continued] ---> [Task Group 5: Cleanup] ---> [Task Group 6: Tests]
```

---

## File Structure Summary

Files to be created or modified:

**Modified Files:**
- `/src/db/schema/media.ts` - Add new columns
- `/src/api/config.ts` - Add UPLOADS_PATH
- `/src/api/types/errors.ts` - Add new error classes
- `/src/db/queries/index.ts` - Export media queries
- `/src/api/routes/admin/index.ts` - Register media routes
- `package.json` - Add cleanup script

**New Files:**
- `/src/db/migrations/meta/NNNN_add_media_variants.sql`
- `/src/api/types/media-schemas.ts`
- `/src/db/queries/media.ts`
- `/src/api/routes/admin/media.ts`
- `/src/services/media/validation.ts`
- `/src/services/media/storage.ts`
- `/src/services/media/image-processor.ts`
- `/src/services/media/upload-service.ts`
- `/src/services/media/cleanup.ts`
- `/src/services/media/index.ts`
- `/src/scripts/cleanup-media.ts`

**Test Files:**
- `/src/db/schema/media.test.ts` (or extend existing)
- `/src/api/types/errors.test.ts` (or extend existing)
- `/src/services/media/media.test.ts`
- `/src/api/routes/admin/media.test.ts`
- `/src/services/media/cleanup.test.ts`

---

## Notes

- **Sharp Library:** Ensure Sharp is installed and compatible with Bun runtime
- **Async Processing:** Image variants are processed after upload response for better UX
- **Error Logging:** Processing failures are logged but don't fail the upload
- **nginx Configuration:** Document nginx config for serving `/uploads/` at `/media/` path
- **No Playwright Tests:** This is a backend-only spec; no E2E/UI tests required
