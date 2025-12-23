# Task Breakdown: Database Schema & Migrations

## Overview
Total Tasks: 24 (across 4 task groups)

This spec implements the SQLite database schema for the marcomarchione.it CMS using Drizzle ORM, including 8 core tables, 2 junction tables, proper relationships, indexes, and migration setup.

## Task List

### Setup & Configuration

#### Task Group 1: Database Infrastructure Setup
**Dependencies:** None

- [x] 1.0 Complete database infrastructure setup
  - [x] 1.1 Write 4 focused tests for database connection and configuration
    - Test database connection initialization with bun:sqlite
    - Test SQLite pragmas are applied correctly (WAL mode, foreign_keys ON, synchronous NORMAL)
    - Test database file creation in expected location
    - Test Drizzle wrapper integration with bun:sqlite driver
  - [x] 1.2 Create database directory structure
    - Create `src/db/` directory for all database code
    - Create `src/db/schema/` directory for table definitions
    - Create `src/db/migrations/` directory for migration files
  - [x] 1.3 Configure Drizzle ORM with drizzle.config.ts
    - Set dialect to 'sqlite'
    - Set schema path to './src/db/schema/*'
    - Set migrations output directory to './src/db/migrations'
    - Configure dbCredentials with database file path
  - [x] 1.4 Create database connection module (src/db/index.ts)
    - Import Database from 'bun:sqlite'
    - Import drizzle from 'drizzle-orm/bun-sqlite'
    - Initialize SQLite database with file path './data.db'
    - Apply pragmas: journal_mode=WAL, foreign_keys=ON, synchronous=NORMAL
    - Export configured Drizzle database instance
  - [x] 1.5 Add database scripts to package.json
    - Add `db:generate` script for Drizzle Kit schema generation
    - Add `db:migrate` script for running migrations
    - Add `db:studio` script for Drizzle Studio (optional debugging)
  - [x] 1.6 Ensure infrastructure tests pass
    - Run ONLY the 4 tests written in 1.1
    - Verify database connection works
    - Verify pragmas are correctly applied
    - Do NOT run the entire test suite

**Acceptance Criteria:**
- The 4 tests written in 1.1 pass
- Database connection initializes without errors
- SQLite pragmas (WAL mode, foreign keys, synchronous) are applied
- Drizzle configuration is valid and recognized by drizzle-kit
- Package.json contains working database scripts

---

### Schema Definition

#### Task Group 2: Core Table Schemas
**Dependencies:** Task Group 1

- [x] 2.0 Complete core table schema definitions
  - [x] 2.1 Write 6 focused tests for core table schemas
    - Test content_base table structure and CHECK constraints (type, status)
    - Test content_translations composite unique constraint (content_id, lang)
    - Test projects table one-to-one relationship with content_base
    - Test materials table CHECK constraint on category field
    - Test news table foreign key relationship
    - Test required fields and nullable field handling across tables
  - [x] 2.2 Create content_base table schema (src/db/schema/content-base.ts)
    - Define sqliteTable 'content_base' with columns:
      - id: integer().primaryKey({ autoIncrement: true })
      - type: text().notNull() with CHECK ('project' | 'material' | 'news')
      - slug: text().notNull().unique()
      - status: text().notNull().default('draft') with CHECK ('draft' | 'published' | 'archived')
      - featured: integer({ mode: 'boolean' }).default(false)
      - created_at: integer().notNull().$defaultFn(() => Date.now())
      - updated_at: integer().notNull().$defaultFn(() => Date.now())
      - published_at: integer()
    - Create indexes: idx_type, idx_slug, idx_status, idx_featured, idx_published_at
  - [x] 2.3 Create content_translations table schema (src/db/schema/content-translations.ts)
    - Define sqliteTable 'content_translations' with columns:
      - id: integer().primaryKey({ autoIncrement: true })
      - content_id: integer().notNull().references(() => contentBase.id, { onDelete: 'cascade' })
      - lang: text().notNull() with CHECK ('it' | 'en' | 'es' | 'de')
      - title: text().notNull()
      - description: text()
      - body: text()
      - meta_title: text()
      - meta_description: text()
    - Create composite unique constraint on (content_id, lang)
    - Create indexes: idx_content_id, idx_lang, idx_content_lang (composite)
  - [x] 2.4 Create projects extension table schema (src/db/schema/projects.ts)
    - Define sqliteTable 'projects' with columns:
      - id: integer().primaryKey({ autoIncrement: true })
      - content_id: integer().notNull().unique().references(() => contentBase.id, { onDelete: 'cascade' })
      - github_url: text()
      - demo_url: text()
      - project_status: text().notNull().default('in-progress') with CHECK ('in-progress' | 'completed' | 'archived')
      - start_date: integer()
      - end_date: integer()
    - Create index: idx_project_status
  - [x] 2.5 Create materials extension table schema (src/db/schema/materials.ts)
    - Define sqliteTable 'materials' with columns:
      - id: integer().primaryKey({ autoIncrement: true })
      - content_id: integer().notNull().unique().references(() => contentBase.id, { onDelete: 'cascade' })
      - category: text().notNull() with CHECK ('guide' | 'template' | 'resource' | 'tool')
      - download_url: text().notNull()
      - file_size: integer()
    - Create index: idx_category
  - [x] 2.6 Create news extension table schema (src/db/schema/news.ts)
    - Define sqliteTable 'news' with columns:
      - id: integer().primaryKey({ autoIncrement: true })
      - content_id: integer().notNull().unique().references(() => contentBase.id, { onDelete: 'cascade' })
      - cover_image: text()
      - reading_time: integer()
  - [x] 2.7 Ensure core table schema tests pass
    - Run ONLY the 6 tests written in 2.1
    - Verify table definitions compile without TypeScript errors
    - Do NOT run the entire test suite

**Acceptance Criteria:**
- The 6 tests written in 2.1 pass
- All 5 core tables (content_base, content_translations, projects, materials, news) defined
- CHECK constraints properly configured for enum fields
- Foreign key relationships with CASCADE DELETE configured
- All indexes created for query performance
- TypeScript types are correctly inferred from schema

---

#### Task Group 3: Supporting Tables and Junction Tables
**Dependencies:** Task Group 2

- [x] 3.0 Complete supporting and junction table schemas
  - [x] 3.1 Write 6 focused tests for supporting and junction tables
    - Test technologies table unique constraint on name field
    - Test tags table unique constraint on slug field
    - Test media table required fields and storage_key uniqueness
    - Test project_technologies junction table composite primary key
    - Test news_tags junction table composite primary key
    - Test CASCADE DELETE behavior on junction table foreign keys
  - [x] 3.2 Create technologies table schema (src/db/schema/technologies.ts)
    - Define sqliteTable 'technologies' with columns:
      - id: integer().primaryKey({ autoIncrement: true })
      - name: text().notNull().unique()
      - icon: text()
      - color: text()
  - [x] 3.3 Create tags table schema (src/db/schema/tags.ts)
    - Define sqliteTable 'tags' with columns:
      - id: integer().primaryKey({ autoIncrement: true })
      - name: text().notNull()
      - slug: text().notNull().unique()
    - Create index: idx_slug
  - [x] 3.4 Create media table schema (src/db/schema/media.ts)
    - Define sqliteTable 'media' with columns:
      - id: integer().primaryKey({ autoIncrement: true })
      - filename: text().notNull()
      - mime_type: text().notNull()
      - size: integer().notNull()
      - storage_key: text().notNull().unique()
      - alt_text: text()
      - created_at: integer().notNull().$defaultFn(() => Date.now())
    - Create indexes: idx_created_at, idx_storage_key
  - [x] 3.5 Create project_technologies junction table schema (src/db/schema/project-technologies.ts)
    - Define sqliteTable 'project_technologies' with columns:
      - project_id: integer().notNull().references(() => projects.id, { onDelete: 'cascade' })
      - technology_id: integer().notNull().references(() => technologies.id, { onDelete: 'cascade' })
    - Use primaryKey({ columns: [project_id, technology_id] }) for composite PK
    - Create indexes: idx_project_id, idx_technology_id
  - [x] 3.6 Create news_tags junction table schema (src/db/schema/news-tags.ts)
    - Define sqliteTable 'news_tags' with columns:
      - news_id: integer().notNull().references(() => news.id, { onDelete: 'cascade' })
      - tag_id: integer().notNull().references(() => tags.id, { onDelete: 'cascade' })
    - Use primaryKey({ columns: [news_id, tag_id] }) for composite PK
    - Create indexes: idx_news_id, idx_tag_id
  - [x] 3.7 Create schema barrel export file (src/db/schema/index.ts)
    - Export all table definitions from individual schema files
    - Export all inferred types using $inferSelect and $inferInsert
  - [x] 3.8 Define Drizzle relations (src/db/relations.ts)
    - Define relations for content_base to content_translations (one-to-many)
    - Define relations for content_base to projects/materials/news (one-to-one)
    - Define relations for projects to project_technologies to technologies (many-to-many)
    - Define relations for news to news_tags to tags (many-to-many)
  - [x] 3.9 Ensure supporting table tests pass
    - Run ONLY the 6 tests written in 3.1
    - Verify all junction table relationships work
    - Do NOT run the entire test suite

**Acceptance Criteria:**
- The 6 tests written in 3.1 pass
- All supporting tables (technologies, tags, media) defined with proper constraints
- Both junction tables have composite primary keys
- CASCADE DELETE configured on all junction table foreign keys
- Drizzle relations helper properly defines all relationships
- Schema barrel export provides clean public API

---

### Migrations

#### Task Group 4: Migration Generation and Validation
**Dependencies:** Task Groups 2, 3

- [x] 4.0 Complete migration setup and validation
  - [x] 4.1 Write 8 focused tests for migration and database integrity
    - Test all 10 tables are created successfully after migration
    - Test content_base CHECK constraint rejects invalid type values
    - Test content_base CHECK constraint rejects invalid status values
    - Test content_translations composite unique prevents duplicate (content_id, lang)
    - Test foreign key CASCADE DELETE removes content_translations when content_base deleted
    - Test foreign key CASCADE DELETE removes project_technologies when project deleted
    - Test projects content_id UNIQUE constraint prevents duplicate extensions
    - Test inserting and querying data across related tables
  - [x] 4.2 Generate initial migration with Drizzle Kit
    - Run `bunx drizzle-kit generate` to create migration SQL
    - Verify migration file created in src/db/migrations/
    - Review generated SQL for correctness
  - [x] 4.3 Validate migration SQL includes all required elements
    - Verify all 10 CREATE TABLE statements present
    - Verify CHECK constraints for: content_base.type, content_base.status, content_translations.lang, projects.project_status, materials.category
    - Verify all foreign key constraints with ON DELETE CASCADE
    - Verify all indexes are created
    - Verify composite primary keys on junction tables
  - [x] 4.4 Run migration against test database
    - Create test database file
    - Execute migration using `bunx drizzle-kit migrate`
    - Verify all tables created successfully
    - Verify pragmas applied (journal_mode, foreign_keys, synchronous)
  - [x] 4.5 Validate schema introspection matches expected structure
    - Use SQLite PRAGMA table_info() to verify column definitions
    - Use SQLite PRAGMA foreign_key_list() to verify foreign keys
    - Use SQLite PRAGMA index_list() to verify indexes exist
  - [x] 4.6 Ensure migration tests pass
    - Run ONLY the 8 tests written in 4.1
    - Verify database integrity with constraint validation
    - Do NOT run the entire test suite

**Acceptance Criteria:**
- The 8 tests written in 4.1 pass
- Migration file generated successfully by Drizzle Kit
- All 10 tables created: content_base, content_translations, projects, materials, news, technologies, tags, media, project_technologies, news_tags
- CHECK constraints validated and enforced
- Foreign key CASCADE DELETE behavior verified
- All indexes present and functional
- Migration is idempotent (can be re-run safely)

---

### Testing

#### Task Group 5: Test Review & Integration Validation
**Dependencies:** Task Groups 1-4

- [x] 5.0 Review existing tests and validate full integration
  - [x] 5.1 Review tests from Task Groups 1-4
    - Review the 4 tests from Task 1.1 (database infrastructure)
    - Review the 6 tests from Task 2.1 (core table schemas)
    - Review the 6 tests from Task 3.1 (supporting tables)
    - Review the 8 tests from Task 4.1 (migrations)
    - Total existing tests: 24 tests
  - [x] 5.2 Analyze test coverage gaps for database schema feature only
    - Identify critical database operations lacking coverage
    - Focus ONLY on gaps related to this spec's schema requirements
    - Do NOT assess entire application test coverage
    - Prioritize CRUD operation workflows over edge cases
  - [x] 5.3 Write up to 6 additional strategic tests if necessary
    - Test creating a complete project with translations and technologies (end-to-end)
    - Test creating a complete news article with translations and tags (end-to-end)
    - Test creating material with all fields populated
    - Test media table insertion and storage_key retrieval
    - Test querying content with joins across related tables
    - Test updated_at timestamp behavior on content modifications
  - [x] 5.4 Create database test utilities (src/db/test-utils.ts)
    - Create function to initialize in-memory test database
    - Create function to reset database between tests
    - Create helper functions for seeding test data
  - [x] 5.5 Run all schema-related tests
    - Run tests from Task Groups 1-4 (24 tests)
    - Run additional tests from 5.3 (up to 6 tests)
    - Expected total: approximately 30 tests maximum
    - Verify all tests pass
  - [x] 5.6 Document schema usage examples
    - Add inline JSDoc comments to exported schema types
    - Create brief usage examples in src/db/README.md
    - Document migration workflow for future reference

**Acceptance Criteria:**
- All 24+ tests pass (tests from Groups 1-4 plus up to 6 additional)
- End-to-end database operations validated
- Test utilities available for future API layer testing
- Schema documentation complete for developer reference
- No more than 6 additional tests added for gap filling
- Testing focused exclusively on database schema requirements

---

## Execution Order

Recommended implementation sequence:

1. **Task Group 1: Database Infrastructure Setup** - Establish foundation with Drizzle ORM, bun:sqlite driver, and SQLite pragma configuration
2. **Task Group 2: Core Table Schemas** - Define the 5 essential content tables (content_base, content_translations, projects, materials, news)
3. **Task Group 3: Supporting Tables and Junction Tables** - Complete schema with technologies, tags, media, and junction tables
4. **Task Group 4: Migration Generation and Validation** - Generate and validate the initial database migration
5. **Task Group 5: Test Review & Integration Validation** - Final validation and documentation

## Files to Create

| File | Purpose |
|------|---------|
| `src/db/index.ts` | Database connection and Drizzle instance |
| `drizzle.config.ts` | Drizzle Kit configuration |
| `src/db/schema/content-base.ts` | content_base table definition |
| `src/db/schema/content-translations.ts` | content_translations table definition |
| `src/db/schema/projects.ts` | projects table definition |
| `src/db/schema/materials.ts` | materials table definition |
| `src/db/schema/news.ts` | news table definition |
| `src/db/schema/technologies.ts` | technologies table definition |
| `src/db/schema/tags.ts` | tags table definition |
| `src/db/schema/media.ts` | media table definition |
| `src/db/schema/project-technologies.ts` | project_technologies junction table |
| `src/db/schema/news-tags.ts` | news_tags junction table |
| `src/db/schema/index.ts` | Schema barrel export |
| `src/db/relations.ts` | Drizzle relations definitions |
| `src/db/test-utils.ts` | Database testing utilities |
| `src/db/migrations/*.sql` | Generated migration files |

## Technical Notes

- **SQLite Pragmas**: Must be applied at connection time, not in migrations
- **CHECK Constraints**: SQLite supports CHECK constraints in CREATE TABLE
- **Composite Primary Keys**: Use Drizzle's `primaryKey()` helper for junction tables
- **Timestamps**: Store as INTEGER (Unix timestamps) for SQLite efficiency
- **Boolean Fields**: Use INTEGER with mode: 'boolean' for SQLite compatibility
- **Cascade Deletes**: Configure onDelete: 'cascade' in foreign key references
