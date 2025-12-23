# Specification: Database Schema & Migrations

## Goal

Design and implement the SQLite database schema with Drizzle ORM for the marcomarchione.it CMS, including all core content entities, multilingual support, and proper relationships to enable content management for a personal portfolio platform.

## User Stories

- As a content administrator, I want a unified content structure so that I can manage projects, materials, and news with consistent metadata and translations across 4 languages
- As a developer, I want type-safe database queries with Drizzle ORM so that I can build the API layer with full TypeScript integration and compile-time safety

## Specific Requirements

**Content Base Table (content_base)**
- Primary table for all content types with shared metadata fields
- Fields: id (INTEGER PRIMARY KEY AUTOINCREMENT), type (TEXT with CHECK constraint: 'project' | 'material' | 'news'), slug (TEXT UNIQUE NOT NULL), status (TEXT with CHECK: 'draft' | 'published' | 'archived'), featured (INTEGER as boolean 0/1), created_at (INTEGER Unix timestamp), updated_at (INTEGER Unix timestamp), published_at (INTEGER Unix timestamp nullable)
- Indexes on: type, slug, status, featured, published_at for query filtering performance
- slug must be globally unique across all content types

**Content Translations Table (content_translations)**
- Stores multilingual content for each content_base record
- Fields: id (INTEGER PRIMARY KEY AUTOINCREMENT), content_id (INTEGER FK to content_base), lang (TEXT with CHECK: 'it' | 'en' | 'es' | 'de'), title (TEXT NOT NULL), description (TEXT), body (TEXT for Markdown content), meta_title (TEXT for SEO), meta_description (TEXT for SEO)
- Composite UNIQUE constraint on (content_id, lang) to ensure one translation per language
- Foreign key with CASCADE DELETE when parent content is removed
- Indexes on: content_id, lang, and (content_id, lang) composite

**Projects Extension Table (projects)**
- Type-specific extension for project content
- Fields: id (INTEGER PRIMARY KEY AUTOINCREMENT), content_id (INTEGER FK to content_base UNIQUE), github_url (TEXT nullable), demo_url (TEXT nullable), project_status (TEXT with CHECK: 'in-progress' | 'completed' | 'archived'), start_date (INTEGER Unix timestamp nullable), end_date (INTEGER Unix timestamp nullable)
- One-to-one relationship with content_base enforced via UNIQUE constraint on content_id
- Index on project_status for filtering

**Materials Extension Table (materials)**
- Type-specific extension for downloadable materials
- Fields: id (INTEGER PRIMARY KEY AUTOINCREMENT), content_id (INTEGER FK to content_base UNIQUE), category (TEXT with CHECK: 'guide' | 'template' | 'resource' | 'tool'), download_url (TEXT NOT NULL), file_size (INTEGER in bytes nullable)
- One-to-one relationship with content_base enforced via UNIQUE constraint
- Index on category for filtering

**News Extension Table (news)**
- Type-specific extension for news articles
- Fields: id (INTEGER PRIMARY KEY AUTOINCREMENT), content_id (INTEGER FK to content_base UNIQUE), cover_image (TEXT nullable - path or R2 key), reading_time (INTEGER in minutes nullable)
- One-to-one relationship with content_base enforced via UNIQUE constraint

**Technologies Table (technologies)**
- Standalone lookup table for technology tags on projects
- Fields: id (INTEGER PRIMARY KEY AUTOINCREMENT), name (TEXT NOT NULL UNIQUE), icon (TEXT nullable - icon identifier or path), color (TEXT nullable - hex color code)
- No foreign keys - referenced by junction table

**Tags Table (tags)**
- Standalone lookup table for categorizing news articles
- Fields: id (INTEGER PRIMARY KEY AUTOINCREMENT), name (TEXT NOT NULL), slug (TEXT NOT NULL UNIQUE)
- Index on slug for URL lookups

**Media Library Table (media)**
- Centralized storage for all uploaded files and images
- Fields: id (INTEGER PRIMARY KEY AUTOINCREMENT), filename (TEXT NOT NULL), mime_type (TEXT NOT NULL), size (INTEGER in bytes NOT NULL), storage_key (TEXT NOT NULL UNIQUE - R2 object path), alt_text (TEXT nullable), created_at (INTEGER Unix timestamp NOT NULL)
- Index on created_at for chronological listing, storage_key for uniqueness

**Junction Table: project_technologies**
- Many-to-many relationship between projects and technologies
- Fields: project_id (INTEGER FK to projects), technology_id (INTEGER FK to technologies)
- Composite PRIMARY KEY on (project_id, technology_id)
- Foreign keys with CASCADE DELETE on both references
- Indexes on both foreign key columns

**Junction Table: news_tags**
- Many-to-many relationship between news and tags
- Fields: news_id (INTEGER FK to news), tag_id (INTEGER FK to tags)
- Composite PRIMARY KEY on (news_id, tag_id)
- Foreign keys with CASCADE DELETE on both references
- Indexes on both foreign key columns

## Visual Design

No visual assets provided.

## Existing Code to Leverage

**Greenfield Implementation**
- This is a new project with no existing database code to reference
- Follow Drizzle ORM conventions from official documentation for SQLite
- Use drizzle-orm/sqlite-core imports: sqliteTable, text, integer, primaryKey
- Apply project skills for drizzle-orm and sqlite patterns

**Drizzle ORM Best Practices**
- Define schema in src/db/schema.ts with separate exports per table
- Use relations() helper for defining relationships in Drizzle
- Configure drizzle.config.ts with sqlite dialect and migrations folder
- Initialize database connection using bun:sqlite driver with Drizzle wrapper

**SQLite Pragmas Configuration**
- Enable WAL mode for better concurrent read performance: PRAGMA journal_mode = WAL
- Enable foreign key enforcement: PRAGMA foreign_keys = ON
- Balance safety and speed: PRAGMA synchronous = NORMAL
- Apply pragmas at database connection initialization

## Out of Scope

- Content versioning or revision history tables
- User accounts table or multi-user role permissions
- Scheduled publishing fields (publish_at future dates)
- Download analytics or tracking tables
- Full-text search indexes or FTS5 virtual tables
- Comments or user-generated content tables
- Soft delete implementation (use archived status instead)
- Database seeding with sample content
- Backup automation scripts (manual file copy to R2)
- API layer implementation (separate spec)
