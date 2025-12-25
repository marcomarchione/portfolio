-- Initial Schema Migration
-- Generated for marcomarchione.it CMS
-- Includes CHECK constraints for enum fields as per specification

-- ============================================
-- Core Tables
-- ============================================

CREATE TABLE `content_base` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL CHECK (`type` IN ('project', 'material', 'news')),
	`slug` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL CHECK (`status` IN ('draft', 'published', 'archived')),
	`featured` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`published_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_base_slug_unique` ON `content_base` (`slug`);
--> statement-breakpoint
CREATE INDEX `idx_content_base_type` ON `content_base` (`type`);
--> statement-breakpoint
CREATE INDEX `idx_content_base_slug` ON `content_base` (`slug`);
--> statement-breakpoint
CREATE INDEX `idx_content_base_status` ON `content_base` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_content_base_featured` ON `content_base` (`featured`);
--> statement-breakpoint
CREATE INDEX `idx_content_base_published_at` ON `content_base` (`published_at`);
--> statement-breakpoint

CREATE TABLE `content_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer NOT NULL,
	`lang` text NOT NULL CHECK (`lang` IN ('it', 'en', 'es', 'de')),
	`title` text NOT NULL,
	`description` text,
	`body` text,
	`meta_title` text,
	`meta_description` text,
	FOREIGN KEY (`content_id`) REFERENCES `content_base`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_translations_content_id` ON `content_translations` (`content_id`);
--> statement-breakpoint
CREATE INDEX `idx_translations_lang` ON `content_translations` (`lang`);
--> statement-breakpoint
CREATE INDEX `idx_translations_content_lang` ON `content_translations` (`content_id`,`lang`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_content_lang` ON `content_translations` (`content_id`,`lang`);
--> statement-breakpoint

CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer NOT NULL,
	`github_url` text,
	`demo_url` text,
	`project_status` text DEFAULT 'in-progress' NOT NULL CHECK (`project_status` IN ('in-progress', 'completed', 'archived')),
	`start_date` integer,
	`end_date` integer,
	FOREIGN KEY (`content_id`) REFERENCES `content_base`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_content_id_unique` ON `projects` (`content_id`);
--> statement-breakpoint
CREATE INDEX `idx_projects_status` ON `projects` (`project_status`);
--> statement-breakpoint

CREATE TABLE `materials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer NOT NULL,
	`category` text NOT NULL CHECK (`category` IN ('guide', 'template', 'resource', 'tool')),
	`download_url` text NOT NULL,
	`file_size` integer,
	FOREIGN KEY (`content_id`) REFERENCES `content_base`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `materials_content_id_unique` ON `materials` (`content_id`);
--> statement-breakpoint
CREATE INDEX `idx_materials_category` ON `materials` (`category`);
--> statement-breakpoint

CREATE TABLE `news` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content_id` integer NOT NULL,
	`cover_image` text,
	`reading_time` integer,
	FOREIGN KEY (`content_id`) REFERENCES `content_base`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `news_content_id_unique` ON `news` (`content_id`);
--> statement-breakpoint

-- ============================================
-- Supporting Tables
-- ============================================

CREATE TABLE `technologies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`color` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `technologies_name_unique` ON `technologies` (`name`);
--> statement-breakpoint

CREATE TABLE `tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tags_slug_unique` ON `tags` (`slug`);
--> statement-breakpoint
CREATE INDEX `idx_tags_slug` ON `tags` (`slug`);
--> statement-breakpoint

CREATE TABLE `media` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`storage_key` text NOT NULL,
	`alt_text` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_storage_key_unique` ON `media` (`storage_key`);
--> statement-breakpoint
CREATE INDEX `idx_media_created_at` ON `media` (`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_media_storage_key` ON `media` (`storage_key`);
--> statement-breakpoint

-- ============================================
-- Junction Tables
-- ============================================

CREATE TABLE `project_technologies` (
	`project_id` integer NOT NULL,
	`technology_id` integer NOT NULL,
	PRIMARY KEY(`project_id`, `technology_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`technology_id`) REFERENCES `technologies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_project_technologies_project_id` ON `project_technologies` (`project_id`);
--> statement-breakpoint
CREATE INDEX `idx_project_technologies_technology_id` ON `project_technologies` (`technology_id`);
--> statement-breakpoint

CREATE TABLE `news_tags` (
	`news_id` integer NOT NULL,
	`tag_id` integer NOT NULL,
	PRIMARY KEY(`news_id`, `tag_id`),
	FOREIGN KEY (`news_id`) REFERENCES `news`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tag_id`) REFERENCES `tags`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_news_tags_news_id` ON `news_tags` (`news_id`);
--> statement-breakpoint
CREATE INDEX `idx_news_tags_tag_id` ON `news_tags` (`tag_id`);
