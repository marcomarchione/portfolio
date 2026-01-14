/**
 * Database Seed Script
 *
 * Populates the database with sample data for development/testing.
 * Run with: bun run src/seed.ts
 */
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import * as schema from './db/schema';
import { config } from './config';

const client = postgres(config.DATABASE_URL);
const db = drizzle(client, { schema });

async function seed() {
  console.log('Seeding database...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  await db.execute(sql`TRUNCATE TABLE
    news_tags,
    project_technologies,
    project_media,
    news,
    materials,
    projects,
    content_translations,
    content_base,
    technologies,
    tags,
    media
    RESTART IDENTITY CASCADE`);
  console.log('  Done\n');

  const now = new Date();

  // Create technologies with colors and icons
  console.log('Creating technologies...');
  const technologies = [
    { name: 'React', icon: '⚛️', color: '#61DAFB' },
    { name: 'TypeScript', icon: '📘', color: '#3178C6' },
    { name: 'Node.js', icon: '🟢', color: '#339933' },
    { name: 'Bun', icon: '🥟', color: '#FBF0DF' },
    { name: 'PostgreSQL', icon: '🐘', color: '#4169E1' },
    { name: 'Tailwind CSS', icon: '🎨', color: '#06B6D4' },
    { name: 'Astro', icon: '🚀', color: '#FF5D01' },
    { name: 'Docker', icon: '🐳', color: '#2496ED' },
  ];

  for (const tech of technologies) {
    await db.insert(schema.technologies).values(tech);
  }
  console.log(`  Created ${technologies.length} technologies`);

  // Create projects
  console.log('\nCreating projects...');
  const projects = [
    {
      slug: 'portfolio-website',
      status: 'published' as const,
      featured: true,
      translations: {
        it: { title: 'Sito Portfolio', description: 'Il mio sito portfolio personale con CMS integrato' },
        en: { title: 'Portfolio Website', description: 'My personal portfolio website with integrated CMS' },
      },
      technologies: ['React', 'TypeScript', 'Bun', 'PostgreSQL'],
      projectStatus: 'completed' as const,
      githubUrl: 'https://github.com/marcomarchione/portfolio',
    },
    {
      slug: 'ecommerce-platform',
      status: 'published' as const,
      featured: true,
      translations: {
        it: { title: 'Piattaforma E-commerce', description: 'Una piattaforma e-commerce moderna e scalabile' },
        en: { title: 'E-commerce Platform', description: 'A modern and scalable e-commerce platform' },
      },
      technologies: ['React', 'Node.js', 'TypeScript'],
      projectStatus: 'in-progress' as const,
      githubUrl: undefined,
    },
    {
      slug: 'task-manager-app',
      status: 'published' as const,
      featured: false,
      translations: {
        it: { title: 'App Gestione Task', description: 'Applicazione per la gestione di progetti e task' },
        en: { title: 'Task Manager App', description: 'Application for managing projects and tasks' },
      },
      technologies: ['React', 'TypeScript', 'Tailwind CSS'],
      projectStatus: 'completed' as const,
      githubUrl: undefined,
    },
    {
      slug: 'weather-dashboard',
      status: 'draft' as const,
      featured: false,
      translations: {
        it: { title: 'Dashboard Meteo', description: 'Dashboard per visualizzare le previsioni meteo' },
        en: { title: 'Weather Dashboard', description: 'Dashboard to display weather forecasts' },
      },
      technologies: ['Astro', 'TypeScript'],
      projectStatus: 'in-progress' as const,
      githubUrl: undefined,
    },
  ];

  for (const project of projects) {
    // Insert content_base
    const [content] = await db
      .insert(schema.contentBase)
      .values({
        type: 'project',
        slug: project.slug,
        status: project.status,
        featured: project.featured,
        createdAt: now,
        updatedAt: now,
        publishedAt: project.status === 'published' ? now : null,
      })
      .returning();

    // Insert translations
    for (const [lang, trans] of Object.entries(project.translations)) {
      await db.insert(schema.contentTranslations).values({
        contentId: content.id,
        lang: lang as 'it' | 'en',
        title: trans.title,
        description: trans.description,
        body: `${trans.description}\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\n## Caratteristiche\n\n- Feature 1\n- Feature 2\n- Feature 3\n\n## Tecnologie utilizzate\n\nQuesto progetto utilizza le tecnologie più moderne per garantire performance e scalabilità.`,
      });
    }

    // Insert project extension
    const [projectRow] = await db
      .insert(schema.projects)
      .values({
        contentId: content.id,
        projectStatus: project.projectStatus,
        githubUrl: project.githubUrl,
      })
      .returning();

    // Link technologies
    for (const techName of project.technologies) {
      const [tech] = await db
        .select()
        .from(schema.technologies)
        .where(eq(schema.technologies.name, techName));
      if (tech) {
        await db.insert(schema.projectTechnologies).values({
          projectId: projectRow.id,
          technologyId: tech.id,
        });
      }
    }
  }
  console.log(`  Created ${projects.length} projects`);

  // Create materials
  console.log('\nCreating materials...');
  const materials = [
    {
      slug: 'react-best-practices',
      category: 'guide' as const,
      status: 'published' as const,
      downloadUrl: '/downloads/react-best-practices.pdf',
      fileSize: 1024000,
      translations: {
        it: { title: 'Best Practices React', description: 'Guida alle migliori pratiche per React' },
        en: { title: 'React Best Practices', description: 'Guide to React best practices' },
      },
    },
    {
      slug: 'typescript-cheatsheet',
      category: 'resource' as const,
      status: 'published' as const,
      downloadUrl: '/downloads/typescript-cheatsheet.pdf',
      fileSize: 512000,
      translations: {
        it: { title: 'Cheatsheet TypeScript', description: 'Riferimento rapido per TypeScript' },
        en: { title: 'TypeScript Cheatsheet', description: 'Quick reference for TypeScript' },
      },
    },
    {
      slug: 'project-starter-template',
      category: 'template' as const,
      status: 'published' as const,
      downloadUrl: '/downloads/starter-template.zip',
      fileSize: 2048000,
      translations: {
        it: { title: 'Template Progetto Starter', description: 'Template per iniziare nuovi progetti' },
        en: { title: 'Project Starter Template', description: 'Template for starting new projects' },
      },
    },
  ];

  for (const material of materials) {
    const [content] = await db
      .insert(schema.contentBase)
      .values({
        type: 'material',
        slug: material.slug,
        status: material.status,
        createdAt: now,
        updatedAt: now,
        publishedAt: material.status === 'published' ? now : null,
      })
      .returning();

    for (const [lang, trans] of Object.entries(material.translations)) {
      await db.insert(schema.contentTranslations).values({
        contentId: content.id,
        lang: lang as 'it' | 'en',
        title: trans.title,
        description: trans.description,
      });
    }

    await db.insert(schema.materials).values({
      contentId: content.id,
      category: material.category,
      downloadUrl: material.downloadUrl,
      fileSize: material.fileSize,
    });
  }
  console.log(`  Created ${materials.length} materials`);

  // Create tags for news
  console.log('\nCreating tags...');
  const tags = [
    { name: 'Tutorial', slug: 'tutorial' },
    { name: 'Annuncio', slug: 'annuncio' },
    { name: 'Tips & Tricks', slug: 'tips-tricks' },
    { name: 'Release', slug: 'release' },
  ];

  for (const tag of tags) {
    await db.insert(schema.tags).values(tag);
  }
  console.log(`  Created ${tags.length} tags`);

  // Create news
  console.log('\nCreating news...');
  const newsItems = [
    {
      slug: 'lancio-nuovo-portfolio',
      status: 'published' as const,
      readingTime: 3,
      translations: {
        it: {
          title: 'Lancio del Nuovo Portfolio',
          description: 'Sono entusiasta di annunciare il lancio del mio nuovo sito portfolio!',
          body: 'Dopo mesi di lavoro, sono finalmente pronto a presentare il mio nuovo portfolio.\n\nIl sito è stato costruito con le tecnologie più moderne:\n\n- **React** per il frontend\n- **Bun** come runtime\n- **PostgreSQL** per il database\n\n## Cosa troverai\n\nNel mio portfolio potrai trovare i miei progetti, articoli e risorse utili.',
        },
        en: {
          title: 'New Portfolio Launch',
          description: 'I am excited to announce the launch of my new portfolio website!',
          body: 'After months of work, I am finally ready to present my new portfolio.\n\nThe site has been built with the most modern technologies:\n\n- **React** for the frontend\n- **Bun** as runtime\n- **PostgreSQL** for the database\n\n## What you will find\n\nIn my portfolio you will find my projects, articles and useful resources.',
        },
      },
      tags: ['Annuncio', 'Release'],
    },
    {
      slug: 'guida-react-hooks',
      status: 'published' as const,
      featured: true,
      readingTime: 8,
      translations: {
        it: {
          title: 'Guida Completa ai React Hooks',
          description: 'Scopri come utilizzare al meglio i React Hooks nei tuoi progetti',
          body: 'I React Hooks hanno rivoluzionato il modo in cui scriviamo componenti React.\n\n## useState\n\nIl hook più comune per gestire lo stato locale:\n\n```jsx\nconst [count, setCount] = useState(0);\n```\n\n## useEffect\n\nPer gestire side effects:\n\n```jsx\nuseEffect(() => {\n  document.title = `Count: ${count}`;\n}, [count]);\n```\n\n## Conclusioni\n\nI hooks rendono il codice più pulito e riutilizzabile.',
        },
        en: {
          title: 'Complete Guide to React Hooks',
          description: 'Learn how to best use React Hooks in your projects',
          body: 'React Hooks have revolutionized the way we write React components.\n\n## useState\n\nThe most common hook for managing local state:\n\n```jsx\nconst [count, setCount] = useState(0);\n```\n\n## useEffect\n\nFor managing side effects:\n\n```jsx\nuseEffect(() => {\n  document.title = `Count: ${count}`;\n}, [count]);\n```\n\n## Conclusions\n\nHooks make code cleaner and more reusable.',
        },
      },
      tags: ['Tutorial', 'Tips & Tricks'],
    },
    {
      slug: 'typescript-5-novita',
      status: 'published' as const,
      readingTime: 5,
      translations: {
        it: {
          title: 'Novità di TypeScript 5',
          description: 'Le principali novità introdotte in TypeScript 5',
          body: 'TypeScript 5 introduce molte nuove funzionalità interessanti.\n\n## Decorators\n\nFinalmente i decorators sono stabili:\n\n```typescript\n@logged\nclass Example {\n  greet() { return "Hello"; }\n}\n```\n\n## const Type Parameters\n\nNuova sintassi per type parameters immutabili.\n\n## Performance\n\nMiglioramenti significativi nelle performance del compilatore.',
        },
        en: {
          title: 'TypeScript 5 News',
          description: 'The main new features introduced in TypeScript 5',
          body: 'TypeScript 5 introduces many interesting new features.\n\n## Decorators\n\nFinally decorators are stable:\n\n```typescript\n@logged\nclass Example {\n  greet() { return "Hello"; }\n}\n```\n\n## const Type Parameters\n\nNew syntax for immutable type parameters.\n\n## Performance\n\nSignificant improvements in compiler performance.',
        },
      },
      tags: ['Release'],
    },
    {
      slug: 'bun-vs-node',
      status: 'draft' as const,
      readingTime: 10,
      translations: {
        it: {
          title: 'Bun vs Node.js: Confronto Completo',
          description: 'Un confronto dettagliato tra Bun e Node.js',
          body: 'Bun è un nuovo runtime JavaScript che promette prestazioni superiori.\n\n## Velocità\n\n| Operazione | Node.js | Bun |\n|------------|---------|-----|\n| Startup | 100ms | 10ms |\n| Install | 30s | 5s |\n\n## Compatibilità\n\nBun è compatibile con la maggior parte dei pacchetti npm.\n\n## Quando usare Bun?\n\n- Progetti nuovi\n- Performance critiche\n- Developer experience migliorata',
        },
        en: {
          title: 'Bun vs Node.js: Complete Comparison',
          description: 'A detailed comparison between Bun and Node.js',
          body: 'Bun is a new JavaScript runtime that promises superior performance.\n\n## Speed\n\n| Operation | Node.js | Bun |\n|-----------|---------|-----|\n| Startup | 100ms | 10ms |\n| Install | 30s | 5s |\n\n## Compatibility\n\nBun is compatible with most npm packages.\n\n## When to use Bun?\n\n- New projects\n- Critical performance\n- Improved developer experience',
        },
      },
      tags: ['Tutorial'],
    },
  ];

  for (const newsItem of newsItems) {
    const [content] = await db
      .insert(schema.contentBase)
      .values({
        type: 'news',
        slug: newsItem.slug,
        status: newsItem.status,
        featured: newsItem.featured ?? false,
        createdAt: now,
        updatedAt: now,
        publishedAt: newsItem.status === 'published' ? now : null,
      })
      .returning();

    for (const [lang, trans] of Object.entries(newsItem.translations)) {
      await db.insert(schema.contentTranslations).values({
        contentId: content.id,
        lang: lang as 'it' | 'en',
        title: trans.title,
        description: trans.description,
        body: trans.body,
      });
    }

    const [newsRow] = await db
      .insert(schema.news)
      .values({
        contentId: content.id,
        readingTime: newsItem.readingTime,
      })
      .returning();

    // Link tags
    for (const tagName of newsItem.tags) {
      const [tag] = await db.select().from(schema.tags).where(eq(schema.tags.name, tagName));
      if (tag) {
        await db.insert(schema.newsTags).values({
          newsId: newsRow.id,
          tagId: tag.id,
        });
      }
    }
  }
  console.log(`  Created ${newsItems.length} news articles`);

  console.log('\nDatabase seeded successfully!');
  console.log('\nSummary:');
  console.log(`  - ${technologies.length} technologies`);
  console.log(`  - ${projects.length} projects`);
  console.log(`  - ${materials.length} materials`);
  console.log(`  - ${tags.length} tags`);
  console.log(`  - ${newsItems.length} news articles`);

  await client.end();
}

seed().catch(console.error);
