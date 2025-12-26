# Specification: Content Editor Forms

## Goal
Build rich editing interfaces for projects, materials, and news content types with multilingual tabbed editing, markdown support, media selection with upload, tag/technology selectors, and publish workflow management.

## User Stories
- As an admin, I want to create and edit content with translations in all 4 languages so that my portfolio is accessible internationally
- As an admin, I want to select and upload media directly from content forms so that I can efficiently add images without switching contexts

## Specific Requirements

**Multilingual Tabbed Interface**
- Implement horizontal tab navigation for 4 languages: IT (default), EN, ES, DE
- Display language tabs with visual indicators for translation completion status (filled/empty)
- Italian tab must be selected by default when creating new content
- Show shared fields (slug, status, featured, dates) in a section above the language tabs
- Language-specific fields per tab: title, description, body, metaTitle, metaDescription

**Markdown Editor Component**
- Use a developer-focused markdown editor library (react-md-editor or similar)
- Prioritize raw markdown editing mode with syntax highlighting
- Provide basic toolbar with common formatting buttons (bold, italic, headers, links, lists, code)
- Body field stored as markdown in content_translations.body column
- Editor should resize to fit content with a minimum height

**Media Picker Modal**
- Create reusable modal component for selecting media from library
- Display media grid with thumbnails, filenames, and selection state
- Include search/filter by mime type (images only for cover photos)
- Add "Upload New" button that triggers file upload within the modal
- Return selected media ID/URL to the calling form field
- Use existing admin media API endpoints: GET /api/v1/admin/media, POST /api/v1/admin/media

**Tag/Technology Selector Component**
- Build reusable multi-select component with tag-pill UI pattern
- Display selected items as removable pills/badges
- Provide dropdown/combobox for searching and selecting existing items
- Include "Create New" option that opens inline creation form (name, optional fields)
- For technologies: name, icon, color fields; for tags: name, slug fields
- Use existing APIs: GET/POST /api/v1/admin/technologies, GET/POST /api/v1/admin/tags

**Publish/Unpublish Workflow**
- Add prominent status toggle in the shared fields section
- Display current status with visual styling (draft=gray, published=green, archived=red)
- Show confirmation dialog before publishing with warning about public visibility
- Create new API endpoint: PATCH /api/v1/admin/{contentType}/{id}/publish
- Endpoint accepts { status: 'published' | 'draft' | 'archived' } body
- Set publishedAt timestamp when changing from draft to published

**Project Editor Form**
- Shared fields: slug (required), status, featured toggle
- Project-specific fields: githubUrl, demoUrl, projectStatus (in-progress/completed/archived), startDate, endDate
- Technologies selector using tag-style component with inline creation
- Translations: title (required for IT), description, body (markdown), metaTitle, metaDescription
- Use existing API: GET/PUT /api/v1/admin/projects/{id}, PUT /api/v1/admin/projects/{id}/translations/{lang}

**Material Editor Form**
- Shared fields: slug (required), status, featured toggle
- Material-specific fields: category dropdown (guide/template/resource/tool), downloadUrl (required), fileSize
- Download URL field should integrate with media picker for selecting uploaded files
- Translations: title (required for IT), description, body (markdown), metaTitle, metaDescription
- Use existing API: GET/PUT /api/v1/admin/materials/{id}, PUT /api/v1/admin/materials/{id}/translations/{lang}

**News Editor Form**
- Shared fields: slug (required), status, featured toggle
- News-specific fields: coverImage (media picker), readingTime (auto-calculated or manual)
- Tags selector using tag-style component with inline creation
- Translations: title (required for IT), description, body (markdown), metaTitle, metaDescription
- Use existing API: GET/PUT /api/v1/admin/news/{id}, PUT /api/v1/admin/news/{id}/translations/{lang}

**Form Validation**
- Italian translation title is required before save; other languages optional
- Slug required and must match pattern ^[a-z0-9]+(-[a-z0-9]+)*$
- URLs must start with http:// or https://
- Show inline validation errors with field highlighting
- Display toast notification on successful save or error

## Visual Design
No visual mockups provided. Follow existing admin panel design patterns with glass-card styling, neutral color palette, and Space Grotesk/Inter typography.

## Existing Code to Leverage

**Page and ComingSoon Components (packages/admin/src/components/common/Page.tsx)**
- Page component provides consistent header with title, subtitle, and actions slot
- Replace ComingSoon placeholder content with actual form implementation
- Use glass-card CSS class for form container styling

**API Client (packages/admin/src/lib/api/client.ts)**
- Provides apiRequest, get, post, put, del helper functions
- Automatically handles JWT auth headers and 401 redirects
- Use for all API calls from form components

**Admin API Routes (packages/api/src/routes/admin/)**
- projects.ts: Full CRUD + translations + technologies assignment
- materials.ts: Full CRUD + translations
- news.ts: Full CRUD + translations + tags assignment
- technologies.ts: CRUD for inline technology creation
- tags.ts: CRUD for inline tag creation
- media.ts: Upload and list media with variants

**Query Keys (packages/admin/src/lib/query/keys.ts)**
- Existing key factories for projects, materials, news, media, settings
- Use for TanStack Query cache invalidation after mutations
- settingsKeys.technologies() and settingsKeys.tags() for selector data

## Out of Scope
- Scheduled publishing / future publish dates
- Revision history / version control
- Content preview functionality
- AI-assisted writing features
- Content duplication / cloning
- Auto-save drafts functionality
- Full media manager UI (separate roadmap item)
- Content listing pages with filtering/search
- Bulk operations (multi-select, batch publish)
- Image cropping or editing within the picker
