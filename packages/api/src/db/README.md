# Database Schema

This directory contains the SQLite database schema for the marcomarchione.it CMS, implemented using Drizzle ORM.

## Directory Structure

```
src/db/
├── index.ts              # Database connection and exports
├── schema/               # Table definitions
│   ├── index.ts          # Barrel export for all schemas
│   ├── content-base.ts   # Core content table
│   ├── content-translations.ts
│   ├── projects.ts       # Project extension table
│   ├── materials.ts      # Material extension table
│   ├── news.ts           # News extension table
│   ├── technologies.ts   # Technologies lookup table
│   ├── tags.ts           # Tags lookup table
│   ├── media.ts          # Media library table
│   ├── project-technologies.ts  # Junction table
│   └── news-tags.ts      # Junction table
├── relations.ts          # Drizzle relations definitions
├── migrations/           # SQL migration files
└── test-utils.ts         # Testing utilities
```

## Schema Overview

### Core Content Model

The CMS uses a unified content structure where all content types (projects, materials, news) share a common `content_base` table with type-specific extension tables.

```
content_base (shared metadata)
    ├── content_translations (multilingual content)
    ├── projects (project-specific fields)
    ├── materials (material-specific fields)
    └── news (news-specific fields)
```

### Tables

| Table | Purpose |
|-------|---------|
| `content_base` | Shared metadata for all content types |
| `content_translations` | Multilingual content (IT, EN, ES, DE) |
| `projects` | Project-specific fields (GitHub URL, demo URL, status) |
| `materials` | Material-specific fields (category, download URL) |
| `news` | News-specific fields (cover image, reading time) |
| `technologies` | Technology lookup table for projects |
| `tags` | Tag lookup table for news |
| `media` | Centralized media library |
| `project_technologies` | Many-to-many: projects <-> technologies |
| `news_tags` | Many-to-many: news <-> tags |

## Usage Examples

### Creating a Database Connection

```typescript
import { createDatabase, db } from '@/db';

// Use the default database instance
const allContent = db.select().from(contentBase).all();

// Or create a custom connection
const customDb = createDatabase('./custom-path.db');
```

### Inserting Content

```typescript
import { db } from '@/db';
import { contentBase, contentTranslations, projects } from '@/db/schema';

// Create a project with translations
const now = new Date();

db.insert(contentBase).values({
  type: 'project',
  slug: 'my-project',
  status: 'draft',
  createdAt: now,
  updatedAt: now,
}).run();

const content = db.select().from(contentBase).all().pop()!;

db.insert(contentTranslations).values({
  contentId: content.id,
  lang: 'en',
  title: 'My Project',
  description: 'A great project',
  body: '# Markdown content',
}).run();

db.insert(projects).values({
  contentId: content.id,
  githubUrl: 'https://github.com/user/repo',
  projectStatus: 'in-progress',
}).run();
```

### Querying with Joins

```typescript
import { db } from '@/db';
import { contentBase, contentTranslations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Get published projects with English translations
const publishedProjects = db
  .select({
    slug: contentBase.slug,
    title: contentTranslations.title,
    description: contentTranslations.description,
  })
  .from(contentBase)
  .innerJoin(contentTranslations, eq(contentBase.id, contentTranslations.contentId))
  .where(
    and(
      eq(contentBase.type, 'project'),
      eq(contentBase.status, 'published'),
      eq(contentTranslations.lang, 'en')
    )
  )
  .all();
```

### Working with Many-to-Many Relations

```typescript
import { db } from '@/db';
import { projects, technologies, projectTechnologies } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Get technologies for a project
const projectId = 1;
const projectTech = db
  .select({ name: technologies.name, color: technologies.color })
  .from(projectTechnologies)
  .innerJoin(technologies, eq(projectTechnologies.technologyId, technologies.id))
  .where(eq(projectTechnologies.projectId, projectId))
  .all();
```

## Migration Workflow

### Generate a New Migration

After modifying schema files, generate a migration:

```bash
bun run db:generate
```

### Apply Migrations

Apply pending migrations to the database:

```bash
bun run db:migrate
```

### Open Drizzle Studio

For visual database exploration:

```bash
bun run db:studio
```

## SQLite Pragmas

The database connection automatically applies these pragmas:

- `PRAGMA journal_mode = WAL` - Better concurrent read performance
- `PRAGMA foreign_keys = ON` - Enforce referential integrity
- `PRAGMA synchronous = NORMAL` - Balance safety and speed

## Testing

Use the test utilities for isolated testing:

```typescript
import { createTestDatabase, resetDatabase, closeDatabase } from '@/db/test-utils';

describe('My Tests', () => {
  let sqlite, db;

  beforeAll(() => {
    const testDb = createTestDatabase();
    sqlite = testDb.sqlite;
    db = testDb.db;
  });

  beforeEach(() => {
    resetDatabase(sqlite);
  });

  afterAll(() => {
    closeDatabase(sqlite);
  });

  test('my test', () => {
    // Test code here
  });
});
```

## Type Exports

All tables export TypeScript types for select and insert operations:

```typescript
import type {
  ContentBase,
  NewContentBase,
  ContentType,
  ContentStatus,
  ContentTranslation,
  NewContentTranslation,
  Language,
  Project,
  NewProject,
  // ... etc
} from '@/db/schema';
```
