ALTER TABLE `media` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `media` ADD `variants` text;--> statement-breakpoint
ALTER TABLE `media` ADD `width` integer;--> statement-breakpoint
ALTER TABLE `media` ADD `height` integer;--> statement-breakpoint
CREATE INDEX `idx_media_deleted_at` ON `media` (`deleted_at`);