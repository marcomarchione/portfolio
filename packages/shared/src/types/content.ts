/**
 * Content Types
 *
 * Shared content type definitions used by API, admin, and web packages.
 */

import type { Language } from '../constants/languages';
import type {
  ContentType,
  ContentStatus,
  ProjectStatus,
  MaterialCategory,
} from '../constants/statuses';

/** Base content fields shared by all content types */
export interface ContentBase {
  id: number;
  type: ContentType;
  slug: string;
  status: ContentStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/** Translation for content */
export interface ContentTranslation {
  id: number;
  contentId: number;
  lang: Language;
  title: string;
  description: string | null;
  body: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

/** Technology associated with projects */
export interface Technology {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
}

/** Tag for news articles */
export interface Tag {
  id: number;
  name: string;
  slug: string;
}

/** Media file metadata */
export interface Media {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: string;
}

/** Project with optional translation and technologies */
export interface Project extends ContentBase {
  type: 'project';
  githubUrl: string | null;
  demoUrl: string | null;
  projectStatus: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  translation?: ContentTranslation | null;
  translations?: ContentTranslation[];
  technologies?: Technology[];
}

/** Material with optional translation */
export interface Material extends ContentBase {
  type: 'material';
  category: MaterialCategory;
  downloadUrl: string;
  fileSize: number | null;
  translation?: ContentTranslation | null;
  translations?: ContentTranslation[];
}

/** News article with optional translation and tags */
export interface News extends ContentBase {
  type: 'news';
  coverImage: string | null;
  readingTime: number | null;
  translation?: ContentTranslation | null;
  translations?: ContentTranslation[];
  tags?: Tag[];
}

/** Union of all content types */
export type Content = Project | Material | News;
