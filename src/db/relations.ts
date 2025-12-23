/**
 * Drizzle Relations Definitions
 *
 * Defines relationships between tables for use with Drizzle's relational queries.
 */
import { relations } from 'drizzle-orm';
import {
  contentBase,
  contentTranslations,
  projects,
  materials,
  news,
  technologies,
  tags,
  projectTechnologies,
  newsTags,
} from './schema';

/**
 * Content Base Relations
 *
 * - One-to-many with content_translations
 * - One-to-one with projects, materials, news (type-specific extensions)
 */
export const contentBaseRelations = relations(contentBase, ({ one, many }) => ({
  translations: many(contentTranslations),
  project: one(projects, {
    fields: [contentBase.id],
    references: [projects.contentId],
  }),
  material: one(materials, {
    fields: [contentBase.id],
    references: [materials.contentId],
  }),
  newsItem: one(news, {
    fields: [contentBase.id],
    references: [news.contentId],
  }),
}));

/**
 * Content Translations Relations
 *
 * - Many-to-one with content_base
 */
export const contentTranslationsRelations = relations(contentTranslations, ({ one }) => ({
  content: one(contentBase, {
    fields: [contentTranslations.contentId],
    references: [contentBase.id],
  }),
}));

/**
 * Projects Relations
 *
 * - One-to-one with content_base
 * - Many-to-many with technologies via project_technologies
 */
export const projectsRelations = relations(projects, ({ one, many }) => ({
  content: one(contentBase, {
    fields: [projects.contentId],
    references: [contentBase.id],
  }),
  projectTechnologies: many(projectTechnologies),
}));

/**
 * Materials Relations
 *
 * - One-to-one with content_base
 */
export const materialsRelations = relations(materials, ({ one }) => ({
  content: one(contentBase, {
    fields: [materials.contentId],
    references: [contentBase.id],
  }),
}));

/**
 * News Relations
 *
 * - One-to-one with content_base
 * - Many-to-many with tags via news_tags
 */
export const newsRelations = relations(news, ({ one, many }) => ({
  content: one(contentBase, {
    fields: [news.contentId],
    references: [contentBase.id],
  }),
  newsTags: many(newsTags),
}));

/**
 * Technologies Relations
 *
 * - Many-to-many with projects via project_technologies
 */
export const technologiesRelations = relations(technologies, ({ many }) => ({
  projectTechnologies: many(projectTechnologies),
}));

/**
 * Tags Relations
 *
 * - Many-to-many with news via news_tags
 */
export const tagsRelations = relations(tags, ({ many }) => ({
  newsTags: many(newsTags),
}));

/**
 * Project Technologies Junction Relations
 */
export const projectTechnologiesRelations = relations(projectTechnologies, ({ one }) => ({
  project: one(projects, {
    fields: [projectTechnologies.projectId],
    references: [projects.id],
  }),
  technology: one(technologies, {
    fields: [projectTechnologies.technologyId],
    references: [technologies.id],
  }),
}));

/**
 * News Tags Junction Relations
 */
export const newsTagsRelations = relations(newsTags, ({ one }) => ({
  newsItem: one(news, {
    fields: [newsTags.newsId],
    references: [news.id],
  }),
  tag: one(tags, {
    fields: [newsTags.tagId],
    references: [tags.id],
  }),
}));
