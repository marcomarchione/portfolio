/**
 * Media Library Table Schema
 *
 * Centralized storage for all uploaded files and images.
 */
import { pgTable, text, serial, integer, timestamp, index } from 'drizzle-orm/pg-core';

/**
 * Variant metadata structure for image variants.
 * Stored as JSON in the variants column.
 */
export interface MediaVariant {
  /** Relative storage path for the variant */
  path: string;
  /** Variant width in pixels */
  width: number;
  /** Variant height in pixels */
  height: number;
}

/**
 * Media variants object containing all generated image variants.
 */
export interface MediaVariants {
  /** Thumbnail variant (400px width) */
  thumb?: MediaVariant;
  /** Medium variant (800px width) */
  medium?: MediaVariant;
  /** Large variant (1200px width) */
  large?: MediaVariant;
}

/**
 * Media Table
 *
 * Stores metadata for all uploaded media files.
 * Actual files are stored on local VPS filesystem, referenced by storage_key.
 * Files are served at /media/{storage_key} via nginx configuration.
 */
export const media = pgTable(
  'media',
  {
    /** Auto-incrementing primary key */
    id: serial('id').primaryKey(),

    /** Original filename */
    filename: text('filename').notNull(),

    /** MIME type (e.g., image/png, application/pdf) */
    mimeType: text('mime_type').notNull(),

    /** File size in bytes */
    size: integer('size').notNull(),

    /** Local filesystem storage path (unique) */
    storageKey: text('storage_key').notNull().unique(),

    /** Alt text for accessibility */
    altText: text('alt_text'),

    /** Timestamp of upload */
    createdAt: timestamp('created_at').notNull().defaultNow(),

    /** Timestamp of soft-delete (null if not deleted) */
    deletedAt: timestamp('deleted_at'),

    /** JSON string containing variant metadata (thumb, medium, large) */
    variants: text('variants'),

    /** Original image width in pixels (null for non-images or PDFs) */
    width: integer('width'),

    /** Original image height in pixels (null for non-images or PDFs) */
    height: integer('height'),
  },
  (table) => [
    index('idx_media_created_at').on(table.createdAt),
    index('idx_media_storage_key').on(table.storageKey),
    index('idx_media_deleted_at').on(table.deletedAt),
  ]
);

/** Type for selecting from media table */
export type Media = typeof media.$inferSelect;

/** Type for inserting into media table */
export type NewMedia = typeof media.$inferInsert;
