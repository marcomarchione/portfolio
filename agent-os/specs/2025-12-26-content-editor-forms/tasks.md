# Task Breakdown: Content Editor Forms

## Overview
Total Tasks: 35

This feature builds rich editing interfaces for projects, materials, and news content types. The implementation includes multilingual tabbed editing, markdown editor, media picker modal, tag/technology selectors, and publish workflow management.

## Task List

### API Layer

#### Task Group 1: Publish/Unpublish API Endpoint
**Dependencies:** None

- [x] 1.0 Complete publish/unpublish API endpoint
  - [x] 1.1 Write 3-4 focused tests for publish endpoint
    - Test publishing content (draft to published) sets publishedAt timestamp
    - Test unpublishing content (published to draft) preserves publishedAt
    - Test archiving content works correctly
    - Test 404 response for non-existent content
  - [x] 1.2 Create PATCH endpoint in `packages/api/src/routes/admin/content.ts`
    - Route: `PATCH /api/v1/admin/{contentType}/{id}/publish`
    - Accept body: `{ status: 'published' | 'draft' | 'archived' }`
    - Support contentType: `projects`, `materials`, `news`
    - Use TypeBox schema for validation
  - [x] 1.3 Implement publish logic in database queries
    - Add `updateContentStatus` function to `packages/api/src/db/queries/content.ts`
    - Set `publishedAt` timestamp when status changes from draft to published
    - Preserve existing `publishedAt` when unpublishing (for re-publish scenarios)
    - Update `updatedAt` timestamp on any status change
  - [x] 1.4 Register route in admin routes index
    - Update `packages/api/src/routes/admin/index.ts`
    - Add authMiddleware to protect the endpoint
  - [x] 1.5 Ensure publish API tests pass
    - Run ONLY the 3-4 tests written in 1.1
    - Verify all status transitions work correctly

**Acceptance Criteria:**
- The 3-4 tests written in 1.1 pass
- PATCH endpoint accessible at `/api/v1/admin/{contentType}/{id}/publish`
- publishedAt correctly set on first publish
- JWT authentication required

---

### Reusable UI Components

#### Task Group 2: Language Tab Navigation Component
**Dependencies:** None

- [x] 2.0 Complete language tab navigation component
  - [x] 2.1 Write 3-4 focused tests for LanguageTabs component
    - Test renders all 4 language tabs (IT, EN, ES, DE)
    - Test Italian tab selected by default
    - Test switching between tabs calls onChange handler
    - Test completion indicator shows filled/empty state
  - [x] 2.2 Create `packages/admin/src/components/forms/LanguageTabs.tsx`
    - Horizontal tab navigation with IT, EN, ES, DE tabs
    - Props: `activeTab`, `onChange`, `completionStatus` (per-language boolean map)
    - Visual indicator for translation completion (filled dot vs empty circle)
    - Italian tab selected by default
    - Use Tailwind CSS with existing design system
  - [x] 2.3 Add TypeScript types for language tab state
    - Create `packages/admin/src/types/forms.ts` with form-related types
    - Define `LanguageTab` type and `TranslationCompletionStatus` interface
  - [x] 2.4 Ensure language tabs tests pass
    - Run ONLY the 3-4 tests written in 2.1

**Acceptance Criteria:**
- The 3-4 tests written in 2.1 pass
- Component renders correctly with glass-card styling
- Tab switching works smoothly
- Completion indicators show correct state

---

#### Task Group 3: Markdown Editor Component
**Dependencies:** None

- [x] 3.0 Complete markdown editor component
  - [x] 3.1 Write 3-4 focused tests for MarkdownEditor component
    - Test renders with initial value
    - Test onChange fires when content changes
    - Test basic toolbar buttons render
    - Test minimum height constraint applied
  - [x] 3.2 Install markdown editor dependency
    - Run `bun add @uiw/react-md-editor` in packages/admin
    - Alternative: `bun add react-markdown-editor-lite` if sizing issues
  - [x] 3.3 Create `packages/admin/src/components/forms/MarkdownEditor.tsx`
    - Developer-focused raw markdown editing mode
    - Syntax highlighting for markdown
    - Basic toolbar: bold, italic, headers (h1-h3), links, lists (ul, ol), code block
    - Resizable with minimum height (300px)
    - Props: `value`, `onChange`, `placeholder`, `minHeight`
  - [x] 3.4 Style markdown editor to match admin design system
    - Override default styles to use Space Grotesk/Inter/JetBrains Mono
    - Apply dark theme with neutral color palette
    - Add focus ring for accessibility
  - [x] 3.5 Ensure markdown editor tests pass
    - Run ONLY the 3-4 tests written in 3.1

**Acceptance Criteria:**
- The 3-4 tests written in 3.1 pass
- Editor renders raw markdown with syntax highlighting
- Toolbar provides essential formatting buttons
- Styling matches admin panel design

---

#### Task Group 4: Media Picker Modal Component
**Dependencies:** None

- [x] 4.0 Complete media picker modal component
  - [x] 4.1 Write 4-5 focused tests for MediaPicker component
    - Test modal opens and closes correctly
    - Test media grid displays thumbnails from API
    - Test selecting a media item calls onSelect handler
    - Test upload button triggers file input
    - Test mime type filter restricts displayed items
  - [x] 4.2 Create `packages/admin/src/components/forms/MediaPicker.tsx`
    - Modal overlay with glass-card container
    - Props: `isOpen`, `onClose`, `onSelect`, `mimeTypeFilter` (optional, e.g., 'image/*')
    - Header with title and close button
  - [x] 4.3 Implement media grid with TanStack Query
    - Use `mediaKeys.list()` for cache key
    - Call `GET /api/v1/admin/media` with optional mimeType filter
    - Display thumbnails with filename and selection state
    - Add hover state and selected ring indicator
  - [x] 4.4 Implement file upload within modal
    - "Upload New" button triggers hidden file input
    - Call `POST /api/v1/admin/media` with FormData
    - Show upload progress indicator
    - Auto-select uploaded file on success
    - Invalidate media list query after upload
  - [x] 4.5 Return selected media to calling form
    - onSelect callback passes `{ id, url, filename, mimeType }`
    - Close modal after selection
  - [x] 4.6 Ensure media picker tests pass
    - Run ONLY the 4-5 tests written in 4.1

**Acceptance Criteria:**
- The 4-5 tests written in 4.1 pass
- Modal opens/closes smoothly
- Media grid shows thumbnails from library
- Upload works within the modal
- Selected media returned correctly

---

#### Task Group 5: Tag/Technology Selector Component
**Dependencies:** None

- [x] 5.0 Complete tag/technology selector component
  - [x] 5.1 Write 4-5 focused tests for ItemSelector component
    - Test renders selected items as removable pills
    - Test dropdown shows available items
    - Test selecting item adds to selection
    - Test removing pill removes from selection
    - Test "Create New" opens inline form
  - [x] 5.2 Create `packages/admin/src/components/forms/ItemSelector.tsx`
    - Generic component for both tags and technologies
    - Props: `type` ('tag' | 'technology'), `selectedIds`, `onChange`, `label`
    - Display selected items as colored pills with X remove button
  - [x] 5.3 Implement dropdown/combobox for selection
    - Searchable dropdown with existing items from API
    - Use `settingsKeys.technologies()` or `settingsKeys.tags()` for cache
    - Call respective GET endpoints for data
    - Filter dropdown by search term
  - [x] 5.4 Implement inline creation form
    - "Create New" option at bottom of dropdown
    - For technologies: name, icon (emoji), color fields
    - For tags: name, slug (auto-generated from name) fields
    - Call POST endpoint to create new item
    - Auto-add newly created item to selection
    - Invalidate settings query after creation
  - [x] 5.5 Ensure item selector tests pass
    - Run ONLY the 4-5 tests written in 5.1

**Acceptance Criteria:**
- The 4-5 tests written in 5.1 pass
- Selected items display as removable pills
- Dropdown shows and filters available items
- Inline creation works for both types
- Selection changes trigger onChange

---

#### Task Group 6: Publish Status Toggle Component
**Dependencies:** Task Group 1

- [x] 6.0 Complete publish status toggle component
  - [x] 6.1 Write 3-4 focused tests for PublishToggle component
    - Test displays current status with correct styling
    - Test clicking toggle opens confirmation dialog
    - Test confirming publish calls onStatusChange
    - Test cancel closes dialog without change
  - [x] 6.2 Create `packages/admin/src/components/forms/PublishToggle.tsx`
    - Props: `status`, `onStatusChange`, `isLoading`
    - Display current status with visual styling:
      - Draft: gray badge
      - Published: green badge
      - Archived: red badge
    - Toggle button to change status
  - [x] 6.3 Implement confirmation dialog
    - Modal with warning message about public visibility
    - "Are you sure you want to publish this content?"
    - Confirm and Cancel buttons
    - Show loading state during API call
  - [x] 6.4 Ensure publish toggle tests pass
    - Run ONLY the 3-4 tests written in 6.1

**Acceptance Criteria:**
- The 3-4 tests written in 6.1 pass
- Status displays with correct color coding
- Confirmation dialog appears before status change
- Loading state shown during mutation

---

### Content Editor Forms

#### Task Group 7: Shared Form Components and Hooks
**Dependencies:** Task Groups 2-6

- [x] 7.0 Complete shared form infrastructure
  - [x] 7.1 Write 2-3 focused tests for form hooks
    - Test useContentForm hook initializes with default values
    - Test form validation catches required field errors
    - Test submit handler formats data correctly for API
  - [x] 7.2 Create form validation schema in `packages/admin/src/lib/validation/content.ts`
    - Slug validation: required, pattern `^[a-z0-9]+(-[a-z0-9]+)*$`
    - URL validation: must start with `http://` or `https://`
    - Italian title required for save
    - Use zod or similar validation library
  - [x] 7.3 Create `useContentForm` hook in `packages/admin/src/hooks/useContentForm.ts`
    - Generic hook for all content types
    - Manages shared fields state (slug, status, featured)
    - Manages translations state (per-language fields)
    - Provides validation and error state
  - [x] 7.4 Create shared form field components
    - `packages/admin/src/components/forms/FormField.tsx` - wrapper with label and error
    - `packages/admin/src/components/forms/SlugInput.tsx` - with validation indicator
    - `packages/admin/src/components/forms/ToggleField.tsx` - for featured checkbox
  - [x] 7.5 Ensure shared form tests pass
    - Run ONLY the 2-3 tests written in 7.1

**Acceptance Criteria:**
- The 2-3 tests written in 7.1 pass
- Validation catches invalid slugs and missing Italian title
- Hook manages form state correctly
- Field components render with errors

---

#### Task Group 8: Project Editor Form
**Dependencies:** Task Groups 1-7

- [x] 8.0 Complete project editor form
  - [x] 8.1 Write 4-5 focused tests for ProjectForm
    - Test form loads existing project data
    - Test Italian tab shows required fields
    - Test technologies selector updates selection
    - Test form submission calls correct API endpoints
    - Test validation error displays for missing Italian title
  - [x] 8.2 Replace `packages/admin/src/pages/projects/ProjectFormPage.tsx`
    - Remove ComingSoon placeholder
    - Add TanStack Query for fetching project data (edit mode)
    - Set up form state with useContentForm hook
  - [x] 8.3 Implement shared fields section
    - Slug input with validation
    - Status display with PublishToggle component
    - Featured toggle checkbox
    - Read-only created/updated timestamps
  - [x] 8.4 Implement project-specific fields section
    - GitHub URL input (optional, with URL validation)
    - Demo URL input (optional, with URL validation)
    - Project status dropdown (in-progress, completed, archived)
    - Start date picker
    - End date picker
  - [x] 8.5 Implement technologies selector
    - Use ItemSelector component with type='technology'
    - Pre-populate with existing project technologies
    - Handle technology assignment via POST /api/v1/admin/projects/{id}/technologies
  - [x] 8.6 Implement language tabs with translations
    - LanguageTabs component at top of translations section
    - Per-tab fields: title (required for IT), description textarea, body (MarkdownEditor), metaTitle, metaDescription
    - Track completion status per language
  - [x] 8.7 Implement save functionality
    - Call PUT /api/v1/admin/projects/{id} for shared + project fields
    - Call PUT /api/v1/admin/projects/{id}/translations/{lang} for each modified translation
    - Show toast notification on success/error
    - Invalidate project queries on success
  - [x] 8.8 Ensure project form tests pass
    - Run ONLY the 4-5 tests written in 8.1

**Acceptance Criteria:**
- The 4-5 tests written in 8.1 pass
- Form loads and displays existing project data
- All fields editable and validate correctly
- Save persists all changes via API
- Toast notifications appear for success/error

---

#### Task Group 9: Material Editor Form
**Dependencies:** Task Groups 1-7

- [x] 9.0 Complete material editor form
  - [x] 9.1 Write 4-5 focused tests for MaterialForm
    - Test form loads existing material data
    - Test category dropdown selects correct value
    - Test media picker opens for download URL field
    - Test form submission calls correct API endpoints
    - Test validation error for missing download URL
  - [x] 9.2 Replace `packages/admin/src/pages/materials/MaterialFormPage.tsx`
    - Remove ComingSoon placeholder
    - Add TanStack Query for fetching material data (edit mode)
    - Set up form state with useContentForm hook
  - [x] 9.3 Implement shared fields section
    - Slug input with validation
    - Status display with PublishToggle component
    - Featured toggle checkbox
    - Read-only created/updated timestamps
  - [x] 9.4 Implement material-specific fields section
    - Category dropdown (guide, template, resource, tool)
    - Download URL input with MediaPicker integration
    - File size input (optional, numeric in bytes)
  - [x] 9.5 Implement download URL with media picker
    - Text input for URL
    - Button to open MediaPicker modal
    - MediaPicker returns file URL to populate field
    - Accept all file types (not just images)
  - [x] 9.6 Implement language tabs with translations
    - LanguageTabs component at top of translations section
    - Per-tab fields: title (required for IT), description textarea, body (MarkdownEditor), metaTitle, metaDescription
    - Track completion status per language
  - [x] 9.7 Implement save functionality
    - Call PUT /api/v1/admin/materials/{id} for shared + material fields
    - Call PUT /api/v1/admin/materials/{id}/translations/{lang} for each modified translation
    - Show toast notification on success/error
    - Invalidate material queries on success
  - [x] 9.8 Ensure material form tests pass
    - Run ONLY the 4-5 tests written in 9.1

**Acceptance Criteria:**
- The 4-5 tests written in 9.1 pass
- Form loads and displays existing material data
- Category dropdown works correctly
- Download URL integrates with media picker
- Save persists all changes via API

---

#### Task Group 10: News Editor Form
**Dependencies:** Task Groups 1-7

- [x] 10.0 Complete news editor form
  - [x] 10.1 Write 4-5 focused tests for NewsForm
    - Test form loads existing news data
    - Test cover image picker opens and selects image
    - Test tags selector updates selection
    - Test form submission calls correct API endpoints
    - Test reading time auto-calculation from body length
  - [x] 10.2 Replace `packages/admin/src/pages/news/NewsFormPage.tsx`
    - Remove ComingSoon placeholder
    - Add TanStack Query for fetching news data (edit mode)
    - Set up form state with useContentForm hook
  - [x] 10.3 Implement shared fields section
    - Slug input with validation
    - Status display with PublishToggle component
    - Featured toggle checkbox
    - Read-only created/updated timestamps
  - [x] 10.4 Implement news-specific fields section
    - Cover image with MediaPicker (images only filter)
    - Cover image preview thumbnail
    - Reading time input (manual or auto-calculated)
  - [x] 10.5 Implement cover image with media picker
    - Preview thumbnail of selected image
    - Button to open MediaPicker modal (mimeType: 'image/*')
    - Remove button to clear selection
    - MediaPicker returns image URL to populate field
  - [x] 10.6 Implement tags selector
    - Use ItemSelector component with type='tag'
    - Pre-populate with existing news tags
    - Handle tag assignment via POST /api/v1/admin/news/{id}/tags
  - [x] 10.7 Implement language tabs with translations
    - LanguageTabs component at top of translations section
    - Per-tab fields: title (required for IT), description textarea, body (MarkdownEditor), metaTitle, metaDescription
    - Track completion status per language
  - [x] 10.8 Implement reading time calculation
    - Auto-calculate from Italian body content (words / 200)
    - Allow manual override
    - Update calculation when body changes
  - [x] 10.9 Implement save functionality
    - Call PUT /api/v1/admin/news/{id} for shared + news fields
    - Call PUT /api/v1/admin/news/{id}/translations/{lang} for each modified translation
    - Show toast notification on success/error
    - Invalidate news queries on success
  - [x] 10.10 Ensure news form tests pass
    - Run ONLY the 4-5 tests written in 10.1

**Acceptance Criteria:**
- The 4-5 tests written in 10.1 pass
- Form loads and displays existing news data
- Cover image picker works with preview
- Tags selector allows selection and creation
- Reading time auto-calculates from body
- Save persists all changes via API

---

### Integration and Polish

#### Task Group 11: Toast Notifications and Error Handling
**Dependencies:** Task Groups 8-10

- [x] 11.0 Complete toast notification system
  - [x] 11.1 Write 2-3 focused tests for toast system
    - Test success toast displays correctly
    - Test error toast displays API error message
    - Test toast auto-dismisses after timeout
  - [x] 11.2 Install toast library (if not present)
    - Run `bun add react-hot-toast` or similar in packages/admin
    - Alternative: use existing notification system if available
  - [x] 11.3 Create `packages/admin/src/components/common/Toast.tsx`
    - Configure toast provider in app root
    - Style toasts to match admin design system
    - Success: green accent, Error: red accent
  - [x] 11.4 Add toast helper functions
    - `showSuccess(message: string)` function
    - `showError(message: string, details?: string)` function
    - Auto-extract message from ApiError
  - [x] 11.5 Integrate toasts with form submissions
    - Show success toast on successful save
    - Show error toast with API error message on failure
    - Include field-level validation errors in toast
  - [x] 11.6 Ensure toast tests pass
    - Run ONLY the 2-3 tests written in 11.1

**Acceptance Criteria:**
- The 2-3 tests written in 11.1 pass
- Success and error toasts appear correctly
- Toasts auto-dismiss after reasonable timeout
- API errors displayed clearly

---

### Testing

#### Task Group 12: Test Review and Gap Analysis
**Dependencies:** Task Groups 1-11

- [x] 12.0 Review existing tests and fill critical gaps
  - [x] 12.1 Review tests from Task Groups 1-11
    - Review the 3-4 tests from publish API (Task 1.1)
    - Review the 3-4 tests from LanguageTabs (Task 2.1)
    - Review the 3-4 tests from MarkdownEditor (Task 3.1)
    - Review the 4-5 tests from MediaPicker (Task 4.1)
    - Review the 4-5 tests from ItemSelector (Task 5.1)
    - Review the 3-4 tests from PublishToggle (Task 6.1)
    - Review the 2-3 tests from form hooks (Task 7.1)
    - Review the 4-5 tests from ProjectForm (Task 8.1)
    - Review the 4-5 tests from MaterialForm (Task 9.1)
    - Review the 4-5 tests from NewsForm (Task 10.1)
    - Review the 2-3 tests from Toast system (Task 11.1)
    - Total existing tests: approximately 35-45 tests
  - [x] 12.2 Analyze test coverage gaps for this feature
    - Identify critical user workflows lacking coverage
    - Focus on end-to-end form submission flows
    - Check translation saving across languages
    - Verify media picker integration with forms
  - [x] 12.3 Write up to 8 additional strategic tests
    - Add maximum of 8 new tests to fill critical gaps
    - Focus on integration points:
      - Full project create flow (shared fields + translations + technologies)
      - Full material create flow (shared fields + translations + media picker)
      - Full news create flow (shared fields + translations + cover image + tags)
      - Validation error display workflow
      - Status change via PublishToggle calls API correctly
    - Do NOT write comprehensive coverage for all scenarios
  - [x] 12.4 Run feature-specific tests only
    - Run ONLY tests related to content editor forms feature
    - Expected total: approximately 43-53 tests
    - Do NOT run the entire application test suite
    - Verify all critical workflows pass

**Acceptance Criteria:**
- All feature-specific tests pass (approximately 43-53 tests total)
- Critical user workflows for content editing are covered
- No more than 8 additional tests added when filling gaps
- Testing focused exclusively on content editor forms feature

---

## Execution Order

Recommended implementation sequence:

1. **API Layer** (Task Group 1) - Required for status management
2. **Reusable UI Components** (Task Groups 2-6) - Can be built in parallel
   - 2: LanguageTabs
   - 3: MarkdownEditor
   - 4: MediaPicker
   - 5: ItemSelector
   - 6: PublishToggle (after Task Group 1)
3. **Shared Form Infrastructure** (Task Group 7) - Depends on UI components
4. **Content Editor Forms** (Task Groups 8-10) - Can be built in parallel after shared infrastructure
   - 8: ProjectForm
   - 9: MaterialForm
   - 10: NewsForm
5. **Integration and Polish** (Task Group 11) - After forms are complete
6. **Test Review** (Task Group 12) - Final verification

## File Structure Summary

```
packages/api/
  src/
    routes/admin/
      content.ts              # New: PATCH /{contentType}/{id}/publish
      index.ts                # Updated: register content routes
    db/queries/
      content.ts              # Updated: updateContentStatus function

packages/admin/
  src/
    components/
      forms/
        LanguageTabs.tsx      # New: Language tab navigation
        MarkdownEditor.tsx    # New: Markdown editor wrapper
        MediaPicker.tsx       # New: Media selection modal
        ItemSelector.tsx      # New: Tag/technology selector
        PublishToggle.tsx     # New: Status toggle with confirmation
        FormField.tsx         # New: Form field wrapper
        SlugInput.tsx         # New: Slug input with validation
        ToggleField.tsx       # New: Toggle/checkbox field
      common/
        Toast.tsx             # New: Toast notification component
    hooks/
      useContentForm.ts       # New: Content form state hook
    lib/
      validation/
        content.ts            # New: Form validation schemas
    types/
      forms.ts                # New: Form-related types
    pages/
      projects/
        ProjectFormPage.tsx   # Updated: Full implementation
      materials/
        MaterialFormPage.tsx  # Updated: Full implementation
      news/
        NewsFormPage.tsx      # Updated: Full implementation
```

## Dependencies to Install

```bash
cd packages/admin
bun add @uiw/react-md-editor react-hot-toast zod
```

## Key Technical Decisions

1. **Markdown Editor**: Use `@uiw/react-md-editor` for developer-focused markdown editing with syntax highlighting
2. **Form Validation**: Use `zod` for schema-based validation (lightweight, TypeScript-first)
3. **Toast Notifications**: Use `react-hot-toast` for simple, customizable toasts
4. **State Management**: Use React state + TanStack Query for form state (no additional state library needed)
5. **API Pattern**: Follow existing pattern of PUT for updates, POST for relationships (technologies, tags)
