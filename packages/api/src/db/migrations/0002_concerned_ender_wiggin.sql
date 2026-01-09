CREATE TABLE `project_media` (
	`project_id` integer NOT NULL,
	`media_id` integer NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`project_id`, `media_id`),
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_project_media_project_id` ON `project_media` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_project_media_media_id` ON `project_media` (`media_id`);--> statement-breakpoint
CREATE INDEX `idx_project_media_project_order` ON `project_media` (`project_id`,`display_order`);