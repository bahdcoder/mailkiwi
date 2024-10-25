CREATE TABLE `websitePages` (
	`id` binary(16) NOT NULL,
	`title` varchar(72),
	`path` varchar(72),
	`description` text,
	`newsletterWebsiteId` binary(16),
	`websiteContent` json NOT NULL,
	CONSTRAINT `websitePages_id` PRIMARY KEY(`id`),
	CONSTRAINT `websitePages_title_unique` UNIQUE(`title`),
	CONSTRAINT `newsletterWebsiteIdPathKey` UNIQUE(`newsletterWebsiteId`,`path`)
);
--> statement-breakpoint
ALTER TABLE `newsletterWebsites` DROP INDEX `newsletterWebsites_slug_unique`;--> statement-breakpoint
ALTER TABLE `websitePages` ADD CONSTRAINT `websitePages_newsletterWebsiteId_newsletterWebsites_id_fk` FOREIGN KEY (`newsletterWebsiteId`) REFERENCES `newsletterWebsites`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newsletterWebsites` DROP COLUMN `description`;--> statement-breakpoint
ALTER TABLE `newsletterWebsites` DROP COLUMN `websiteContent`;