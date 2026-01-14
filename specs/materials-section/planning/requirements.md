# Spec Requirements: Materials Section

## Initial Description
Implement the Materials Section for the public website, allowing users to browse and download educational materials such as PDF guides, code templates, and cheatsheets.

## Requirements Discussion

### First Round Questions

**Q1:** I assume the materials list should be a React island with client-side filtering/sorting (similar to the Projects page), rather than full page reloads. Is that correct?
**Answer:** Correct assumption - React island with client-side filtering like Projects

**Q2:** For category filtering, I'm thinking of supporting multiple category selection (e.g., show both "guides" AND "templates"). Should we support multi-select, or is single category selection sufficient?
**Answer:** Single category selection is sufficient

**Q3:** For search functionality, I assume a simple debounced text search on title and description would be enough, without full-text search on body content. Is that correct?
**Answer:** Debounced search on title/description only, NOT body content

**Q4:** Should we track download counts? If so, should this be anonymous (just increment a counter) or tied to any analytics system?
**Answer:** User asked to check if there's an existing monitoring/tracking structure in the backend. If not, they DON'T want to implement download tracking - just skip it.

**Q5:** For the download button behavior, I assume clicking should always trigger a file download (not open in browser for PDFs). Is that correct?
**Answer:** Always trigger download (not open in browser for PDFs etc)

**Q6:** Should we include pagination for the materials list (e.g., 12 items per page)? And should there be sorting options (newest, most downloaded, alphabetical)?
**Answer:** Yes to pagination (9 items per page), sorting options, featured highlighting

**Q7:** For the material detail page, should we show related materials (same category or tags) as suggestions?
**Answer:** Single file focus only - NO related materials suggestions on detail page

**Q8:** Is there anything specific you want to exclude from this implementation?
**Answer:** No exclusions, but constraints must be based on the spec scope only. Must NOT work concurrently on other roadmap items.

### Existing Code to Reference

**Similar Features Identified:**
- Feature: ProjectsFilterable component - Path: `/home/mmarchione/Progetti/marcomarchione.it/portfolio/packages/web/src/components/projects/ProjectsFilterable.tsx`
- Components to potentially reuse: TechnologyFilter pattern (adapt for CategoryFilter), FilterDropdown, pagination controls
- Backend logic to reference: Projects API filtering/sorting pattern at `/home/mmarchione/Progetti/marcomarchione.it/portfolio/packages/api/src/routes/public/projects.ts`
- Existing materials pages to replace: `/home/mmarchione/Progetti/marcomarchione.it/portfolio/packages/web/src/pages/[lang]/materials/index.astro`

### Backend Monitoring/Tracking Infrastructure Check

**Investigation Results:**
- Checked `/packages/api/src/routes/health.ts` - Basic deployment health check only, not a tracking system
- Checked `/packages/api/src/db/schema/` - No analytics, statistics, or download tracking tables exist
- Checked `/packages/web/src/layouts/BaseLayout.astro` - No analytics scripts (Cloudflare Analytics, Plausible, etc.)
- Searched entire codebase for "analytics", "tracking", "metrics", "statistics" patterns - None found in application code

**Conclusion:** No existing monitoring/tracking infrastructure exists in the backend. Per user's instruction, download tracking is EXCLUDED from scope.

### Follow-up Questions
None required - all answers were clear and complete.

## Visual Assets

### Files Provided:
No visual assets provided.

### Visual Insights:
N/A - No visual files found in `/specs/materials-section/planning/visuals/`

## Requirements Summary

### Functional Requirements
- React island component for materials listing with client-side filtering (similar to ProjectsFilterable)
- Single category filter (dropdown or pill-based selection)
- Debounced text search on title and description fields only
- Sorting options: newest, oldest, alphabetical by title
- Featured materials highlighting (visual badge/indicator)
- Pagination with 9 items per page
- Download button that forces file download (Content-Disposition: attachment)
- Material detail page showing single file information only (no related materials)
- Multilingual support (it, en, es, de) following existing i18n patterns

### User Interface Elements
- Category filter (single selection)
- Search input with debounce
- Sort dropdown (newest, oldest, title)
- Grid layout for material cards (responsive: 1/2/3 columns)
- Material cards showing: title, description preview, category badge, file size, featured indicator
- Pagination controls (previous/next with page indicator)
- Download button on detail page

### Reusability Opportunities
- FilterDropdown component from Projects can be reused for category and sort filters
- Pagination UI pattern from ProjectsFilterable can be adapted
- Card styling patterns from existing materials page and projects grid
- API URL builder and browser history patterns from ProjectsFilterable
- Loading states and transitions from ProjectsFilterable

### Scope Boundaries
**In Scope:**
- MaterialsFilterable React component with category filter, search, sort, pagination
- Materials list page update to use new filterable component
- Material detail page with download functionality
- API endpoint updates if needed for filtering/sorting/pagination
- Translation keys for new UI labels

**Out of Scope:**
- Download tracking/analytics (no existing infrastructure)
- Related materials suggestions on detail page
- Multi-category selection
- Full-text search on body content
- Opening files in browser (PDFs etc.) - always download
- Work on other roadmap items concurrently

### Technical Considerations
- Follow ProjectsFilterable architecture pattern exactly
- Use existing FilterDropdown component
- Create CategoryFilter component (simpler than TechnologyFilter - just dropdown or pills)
- API must support: category filter, text search (title/description), sort, limit/offset pagination
- Download links must use `download` attribute or Content-Disposition header
- Maintain URL state for filters/pagination (browser history support)
- Support all 4 languages for new UI strings
