# Spec Requirements: Database Schema & Migrations

## Initial Description

**Database Schema & Migrations** - Design and implement SQLite database with Drizzle ORM including all core entities: content_base, content_translations, projects, materials, news, technologies, tags, and media tables with proper relationships and indexes.

*Source: Product Roadmap Item #1*

## Requirements Discussion

### First Round Questions

**Q1:** Looking at your three content types (projects, materials, news), which is the primary focus for launch? I assume projects are most critical for demonstrating expertise to recruiters and clients, with materials and news as secondary. Is that correct, or should materials (downloadable resources) or news (thought leadership) take equal priority?

**Answer:** Confirmed. Projects are primary (portfolio focus), materials and news are secondary.

**Q2:** For your multilingual content, I assume Italian is your primary language with English as the key secondary language for international reach, and Spanish/German as lower-priority additions. Does this reflect your target audience priorities, or are certain language markets more strategically important?

**Answer:** Confirmed. Italian is primary, English is key for international reach, Spanish and German are lower priority.

**Q3:** I assume you'll be the sole content author and administrator, so we don't need multi-user roles, approval workflows, or content locking. Is that correct, or do you anticipate collaborators contributing content in the future?

**Answer:** Confirmed. Document explicitly states "Single writer (solo l'amministratore)" - no multi-user requirements.

**Q4:** Is there anything you specifically want to exclude from this initial implementation? For example: content versioning/revision history, scheduled publishing for future dates, download analytics for materials, or any content types beyond projects/materials/news?

**Answer:** Confirmed. No versioning, no multi-user roles, no scheduled publishing needed. Focus on "Semplicita operativa" (operational simplicity).

### Existing Code to Reference

No similar existing features identified for reference. This is a new project.

### Follow-up Questions

No follow-up questions were needed. All assumptions were confirmed.

## Visual Assets

### Files Provided:

No visual assets provided.

### Visual Insights:

Not applicable.

## Requirements Summary

### Functional Requirements

Based on the architecture document (docs/initial.txt Section 5), the database must support:

**Core Content System:**
- Unified content management via `content_base` table with shared metadata (id, type, slug, status, featured, timestamps)
- Multilingual content via `content_translations` table supporting 4 languages (IT, EN, ES, DE)
- Three content types with type-specific extension tables: projects, materials, news

**Content Types:**

1. **Projects** (Primary focus)
   - Extension of content_base with: github_url, demo_url, project_status (in-progress/completed/archived), start_date, end_date
   - Many-to-many relationship with technologies

2. **Materials** (Secondary)
   - Extension of content_base with: category (guide/template/resource/tool), download_url, file_size

3. **News** (Secondary)
   - Extension of content_base with: cover_image, reading_time
   - Many-to-many relationship with tags

**Supporting Entities:**
- **Technologies:** id, name, icon, color - for tagging projects
- **Tags:** id, name, slug - for categorizing news articles
- **Media:** id, filename, mime_type, size, storage_key (R2 path), alt_text, created_at - centralized media library

**Translation Fields (per content item, per language):**
- title, description, body (Markdown), meta_title (SEO), meta_description (SEO)

### Data Model Relationships

From docs/initial.txt Section 5.2:
- `content_base` -> `content_translations`: 1 to N (one translation per language)
- `content_base` -> `projects/materials/news`: 1 to 1 (type-specific extension)
- `projects` -> `technologies`: N to N (junction table required)
- `news` -> `tags`: N to N (junction table required)

### Reusability Opportunities

Not applicable - this is a greenfield implementation. However, the schema design should follow Drizzle ORM best practices and SQLite conventions as documented in the project skills.

### Scope Boundaries

**In Scope:**
- All 8 core tables: content_base, content_translations, projects, materials, news, technologies, tags, media
- Junction tables: project_technologies, news_tags
- Proper indexes for query performance (foreign keys, status, slug, language)
- Drizzle ORM schema definitions with TypeScript types
- Drizzle Kit migration setup and initial migration
- SQLite pragmas for performance (WAL mode, foreign keys enabled)

**Out of Scope:**
- Content versioning / revision history
- Multi-user roles and permissions
- Scheduled publishing (publish_at future dates)
- Download analytics / tracking
- User accounts table (authentication will use simple admin credentials)
- Comments or user-generated content
- Search indexing (full-text search)

### Technical Considerations

**From Architecture Document:**
- Database: SQLite (file-based, single-writer model)
- ORM: Drizzle ORM with Drizzle Kit for migrations
- Runtime: Bun with bun:sqlite driver
- Volume: Hundreds of records, not thousands
- Backup strategy: Simple file copy to Cloudflare R2

**Key Design Decisions (based on best practices):**
- Use INTEGER for primary keys (SQLite optimized)
- Use TEXT for UUIDs if needed, but prefer integer IDs for simplicity
- Store timestamps as INTEGER (Unix timestamps) for SQLite efficiency
- Use CHECK constraints for enum-like fields (status, category, project_status)
- Enable foreign key enforcement via PRAGMA
- Add indexes on: all foreign keys, slug fields, status columns, language codes, featured flag

**Migration Strategy:**
- Use Drizzle Kit's migration system
- Store migrations in `src/db/migrations/` or `drizzle/` folder
- Apply migrations manually via CLI before deployment (operational simplicity)

**SQLite Pragmas to Configure:**
- `PRAGMA journal_mode = WAL` (better concurrent read performance)
- `PRAGMA foreign_keys = ON` (enforce referential integrity)
- `PRAGMA synchronous = NORMAL` (balance between safety and speed)
