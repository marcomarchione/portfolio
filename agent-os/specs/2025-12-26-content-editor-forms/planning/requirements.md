# Spec Requirements: Content Editor Forms

## Initial Description
Build rich editing interfaces for projects, materials, and news including multilingual input fields, markdown/rich text editor, and media selection.

## Requirements Discussion

### First Round Questions

**Q1:** I assume the editor should use tabbed navigation for the 4 languages (Italian, English, Spanish, German) rather than separate forms for each language. Users would switch between language tabs to enter translations while shared fields (slug, status, featured, dates) appear once at the top. Is that correct, or would you prefer a different multilingual editing approach?
**Answer:** Yes - tabbed navigation for 4 languages (IT, EN, ES, DE), shared fields at top.

**Q2:** For the rich text/markdown editor, I'm thinking of using a library like TipTap or react-md-editor that provides both WYSIWYG and raw markdown modes. The body content is stored as markdown in the database. Should we prioritize a clean markdown editing experience (for developers), or a more visual WYSIWYG editor (for non-technical users)?
**Answer:** For developers - prioritize clean markdown editing experience.

**Q3:** I assume the media selection should open a modal picker that shows the existing media library, allowing users to select images for cover photos (news), project images, or material downloads. The media upload functionality itself is part of the separate "Media Manager UI" roadmap item, but should the content forms include a basic "upload and attach" button, or only select from already-uploaded media?
**Answer:** Include upload and attach functionality (not just select from existing).

**Q4:** For projects, the schema includes technologies (many-to-many relationship). I assume we need a tag-style selector where users can pick from existing technologies or create new ones inline. Is that correct? Should the same pattern apply to news tags?
**Answer:** Yes - tag-style selector for both project technologies and news tags, with ability to create new ones inline.

**Q5:** For form validation, I assume we should require at least the Italian translation (as it's the primary language) before allowing save, while other languages can be optional drafts. Is this correct, or should all languages be equally optional?
**Answer:** Yes - require Italian translation before save, other languages optional.

**Q6:** I assume the forms should support auto-save drafts to prevent content loss, with a visible indicator showing save status. Is this needed, or is manual save sufficient for now?
**Answer:** Manual save is sufficient for now.

**Q7:** For the content status workflow, I see the database supports draft/published/archived states. Should the form include a prominent publish/unpublish toggle, and should publishing require confirmation to prevent accidental publication?
**Answer:** Yes - publish/unpublish toggle with confirmation. Also create an API endpoint for publish/unpublish operations.

**Q8:** Is there anything specific you want to exclude from this initial implementation? For example: scheduled publishing, revision history, content preview, AI-assisted writing, or content duplication features?
**Answer:** Exclusions confirmed: No scheduled publishing, revision history, content preview, AI-assisted writing, or content duplication.

### Existing Code to Reference

No similar existing features identified for reference.

### Follow-up Questions

No follow-up questions needed - requirements are clear and comprehensive.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A

## Requirements Summary

### Functional Requirements

**Multilingual Content Editing:**
- Tabbed interface for 4 languages: Italian (IT), English (EN), Spanish (ES), German (DE)
- Shared/common fields displayed once at the top of the form
- Language-specific fields (title, description, body, meta title, meta description) in tabs
- Italian translation required for save; other languages optional

**Markdown Editor:**
- Developer-focused clean markdown editing experience
- Raw markdown editing mode prioritized over WYSIWYG
- Body content stored as markdown in content_translations table

**Media Selection & Upload:**
- Modal picker to browse existing media library
- Inline upload capability within the content forms
- Support for cover images (news), project images, material downloads
- Integration with existing media API and storage system

**Tag/Technology Selector:**
- Tag-style UI component for selecting items
- Ability to select from existing technologies/tags
- Inline creation of new technologies/tags without leaving the form
- Used for: project technologies (many-to-many), news tags (many-to-many)

**Content Status Management:**
- Prominent publish/unpublish toggle in the form
- Confirmation dialog before publishing to prevent accidents
- New API endpoint for publish/unpublish operations
- Support for draft, published, and archived states

**Form Structure by Content Type:**

*Projects Form:*
- Shared fields: slug, status, featured, created/updated timestamps
- Project-specific: GitHub URL, demo URL, project status (in-progress/completed/archived), start date, end date
- Technologies: tag selector (many-to-many)
- Translations: title, description, body, meta title, meta description (per language)

*Materials Form:*
- Shared fields: slug, status, featured, created/updated timestamps
- Material-specific: category (guide/template/resource/tool), download URL, file size
- Translations: title, description, body, meta title, meta description (per language)

*News Form:*
- Shared fields: slug, status, featured, created/updated timestamps
- News-specific: cover image, reading time
- Tags: tag selector (many-to-many)
- Translations: title, description, body, meta title, meta description (per language)

### Reusability Opportunities

- Shared form components across all three content types (projects, materials, news)
- Reusable language tab component for multilingual editing
- Reusable tag/technology selector component
- Reusable media picker modal component
- Reusable markdown editor component
- Reusable publish confirmation dialog

### Scope Boundaries

**In Scope:**
- Project editor form with full CRUD operations
- Material editor form with full CRUD operations
- News editor form with full CRUD operations
- Tabbed multilingual editing interface
- Markdown editor for body content
- Media picker modal with upload capability
- Tag/technology selector with inline creation
- Publish/unpublish toggle with confirmation
- API endpoint for publish/unpublish operations
- Form validation (Italian required, others optional)
- Manual save functionality

**Out of Scope:**
- Scheduled publishing / future publish dates
- Revision history / version control
- Content preview functionality
- AI-assisted writing features
- Content duplication / cloning
- Auto-save drafts
- Full media manager UI (separate roadmap item)
- Content listing pages with filtering/search (may be separate)

### Technical Considerations

- Database schema already exists with proper relationships
- content_base + content_translations pattern for multilingual content
- projects, materials, news extension tables for type-specific fields
- project_technologies and news_tags junction tables for many-to-many
- Media table with variants (thumb, medium, large)
- JWT authentication required for all admin API endpoints
- React + Vite + TypeScript + Tailwind CSS stack for admin panel
- Existing Page and ComingSoon components can be replaced
- API uses Elysia with TypeBox validation
