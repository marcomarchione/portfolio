# Spec Requirements: Media Upload & Local Storage

## Initial Description

Implement file upload endpoints with local VPS filesystem storage for images, documents, and assets with proper validation, size limits, and URL generation.

This feature is item #5 on the product roadmap, following the completion of:
- Database Schema & Migrations (including media table)
- Backend API Foundation (Elysia with TypeBox)
- Authentication System (JWT-based)
- Content CRUD APIs

The infrastructure is fully self-hosted on a Hetzner VPS with 80GB SSD storage.

## Requirements Discussion

### First Round Questions

**Q1:** I assume we should support common image formats (JPEG, PNG, WebP, GIF, SVG) and documents (PDF) for now. Should we also support other document types (DOC, DOCX, XLS) or archives (ZIP)? Or is images + PDF sufficient for the portfolio use case?
**Answer:** Confirmed - Images (JPEG, PNG, WebP, GIF, SVG) + PDF is sufficient

**Q2:** I'm thinking 10MB per file is a reasonable limit for images and 25MB for documents/PDFs. Does that work, or do you have specific size requirements?
**Answer:** Confirmed - 10MB for images, 25MB for documents/PDFs

**Q3:** Should we auto-generate thumbnails/resized versions on upload (e.g., 400px thumbnail, 1200px large), or serve originals and let the frontend/CDN handle optimization?
**Answer:** YES - Auto-generate thumbnails/resized versions on upload

**Q4:** I assume organizing files as `/uploads/{year}/{month}/{uuid}-{original-filename}` with URL serving at `/media/{storage-key}`. Is this structure acceptable?
**Answer:** Confirmed - `/uploads/{year}/{month}/{uuid}-{original-filename}`

**Q5:** Files will be served from the same VPS. I assume URLs should be relative paths like `/media/2025/12/abc123-photo.jpg` that nginx can serve directly. Should we also support signed/expiring URLs for any files, or are all media files publicly accessible?
**Answer:** Confirmed - Relative paths like `/media/2025/12/abc123-photo.jpg`, all publicly accessible (no signed URLs needed)

**Q6:** When deleting a media record, should we: (a) delete the physical file immediately, (b) soft-delete and clean up files on a schedule, or (c) keep orphaned files until manual cleanup?
**Answer:** Soft-delete with scheduled cleanup

**Q7:** I assume only authenticated admin users can upload files (matching other admin routes). The public API would only read/serve files. Is that correct?
**Answer:** Confirmed - Admin only for uploads, public can read/serve

**Q8:** Are there any features you explicitly do NOT want in this initial implementation?
**Answer:** User WANTS drag-and-drop UI for uploads (to be implemented in separate spec)

### Existing Code to Reference

**Similar Features Identified:**
- Feature: Media Table Schema - Path: `/home/marchione/Progetti/marcomarchione.it/marcomarchione.it/src/db/schema/media.ts`
- Feature: Admin CRUD Pattern - Path: `/home/marchione/Progetti/marcomarchione.it/marcomarchione.it/src/api/routes/admin/materials.ts`
- Feature: Auth Middleware - Path: `/home/marchione/Progetti/marcomarchione.it/marcomarchione.it/src/api/middleware/auth.ts`
- Feature: API Response Types - Path: `/home/marchione/Progetti/marcomarchione.it/marcomarchione.it/src/api/types/responses.ts`

**Note:** The existing media schema (`/src/db/schema/media.ts`) references "Cloudflare R2" in comments but should be updated to reflect local VPS storage per the current tech stack.

### Follow-up Questions

**Follow-up 1:** You confirmed auto-generating thumbnails/resized versions. I'm thinking Thumbnail (400px), Medium (800px), Large (1200px), and Original. Should we generate all three variants, or is thumbnail + large sufficient? Also, should we convert all images to WebP for the generated variants?
**Answer:** Generate ALL 4 sizes: 400px, 800px, 1200px width + original. Convert all generated variants to WebP format (original keeps source format). This supports responsive/mobile UI needs.

**Follow-up 2:** Since you want drag-and-drop uploads, should the drag-and-drop UI be part of THIS spec, or should this spec focus on the backend API with the full Media Manager UI (item #8 on roadmap) handling the interface?
**Answer:** NOT in this spec. This spec is BACKEND/API ONLY. Drag-and-drop UI will be implemented in spec #8 (Media Manager UI).

**Follow-up 3:** You mentioned Playwright MCP for E2E testing. Should the tests cover just the upload API endpoints, the drag-and-drop UI interactions, or both?
**Answer:** NO Playwright MCP needed for this spec. Standard API/endpoint testing only (no UI tests). This is a backend-only spec.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
Not applicable - this is a backend-only spec with no UI implementation.

## Requirements Summary

### Functional Requirements

**File Upload:**
- Accept file uploads via multipart/form-data
- Validate file types: JPEG, PNG, WebP, GIF, SVG (images), PDF (documents)
- Enforce size limits: 10MB for images, 25MB for PDFs
- Generate unique storage key with pattern: `{year}/{month}/{uuid}-{original-filename}`
- Store files on local VPS filesystem at `/uploads/` directory
- Return media metadata including generated URLs

**Image Processing:**
- Auto-generate resized variants on upload for all image types (not PDFs)
- Generate 4 versions:
  - Thumbnail: 400px width
  - Medium: 800px width
  - Large: 1200px width
  - Original: preserved as-is in source format
- Convert all generated variants to WebP format
- Preserve original file in its source format
- Store all variants alongside original with naming convention (e.g., `{key}-thumb.webp`, `{key}-medium.webp`, `{key}-large.webp`)

**File Serving:**
- Serve files via public URLs at `/media/{storage-key}`
- All files publicly accessible (no authentication required for reads)
- Support serving original and all generated variants
- URLs should be relative paths for nginx serving

**Media Management:**
- List all media with pagination
- Get single media by ID with all variant URLs
- Update media metadata (alt text)
- Soft-delete media records (set deleted flag, do not remove files immediately)
- Scheduled cleanup process to remove orphaned/deleted files

**Database Updates:**
- Update existing media table schema to reflect local storage (remove R2 references)
- Add fields for tracking variants/sizes if needed
- Add soft-delete support (deleted_at timestamp)

### Reusability Opportunities

- Follow existing admin route patterns from `/src/api/routes/admin/materials.ts`
- Use existing auth middleware from `/src/api/middleware/auth.ts`
- Extend existing media schema at `/src/db/schema/media.ts`
- Use existing response type helpers from `/src/api/types/responses.ts`
- TypeBox validation patterns already established in codebase

### Scope Boundaries

**In Scope:**
- Backend API endpoints for upload, list, get, update, soft-delete
- Local filesystem storage implementation
- Image processing with Sharp (or similar) for variant generation
- WebP conversion for generated variants
- Media metadata storage in SQLite
- Public file serving endpoint
- Soft-delete with cleanup scheduling logic
- API/endpoint tests

**Out of Scope:**
- Drag-and-drop upload UI (deferred to spec #8: Media Manager UI)
- Any admin panel UI components (deferred to spec #8)
- Playwright/E2E testing (no UI in this spec)
- Video file support
- Image cropping/editing
- Bulk upload operations
- Signed/expiring URLs
- CDN integration (Cloudflare handles caching at edge)

### Technical Considerations

- **Runtime:** Bun with Elysia framework
- **Image Processing:** Use Sharp library for resizing and WebP conversion (Bun-compatible)
- **File Storage:** Local VPS filesystem at `/uploads/` (or configurable path)
- **Database:** SQLite with Drizzle ORM - extend existing media table
- **Validation:** TypeBox schemas for request validation
- **Authentication:** JWT middleware for admin upload routes
- **File Serving:** Configure for nginx to serve `/uploads/` directory at `/media/` path
- **Cleanup:** Implement scheduled job (cron or Bun interval) for orphan file cleanup
- **VPS Storage:** Hetzner CX32 with 80GB SSD - monitor disk usage
