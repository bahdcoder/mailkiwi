CREATE TABLE `newsletterWebsites` (
	`id` binary(16) NOT NULL,
	`slug` varchar(72),
	`description` text,
	`audienceId` binary(16) NOT NULL,
	`websiteContent` json NOT NULL,
	`websiteDomain` varchar(120),
	`websiteDomainCnameValue` varchar(120),
	`websiteDomainVerifiedAt` timestamp,
	`websiteDomainSslVerifiedAt` timestamp,
	`websiteSslCertKey` text,
	`websiteSslCertSecret` text,
	CONSTRAINT `newsletterWebsites_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletterWebsites_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `newsletterWebsites_websiteDomain_unique` UNIQUE(`websiteDomain`)
);
--> statement-breakpoint
ALTER TABLE `audiences` DROP INDEX `audiences_slug_unique`;--> statement-breakpoint
ALTER TABLE `newsletterWebsites` ADD CONSTRAINT `newsletterWebsites_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audiences` DROP COLUMN `slug`;--> statement-breakpoint
ALTER TABLE `audiences` DROP COLUMN `description`;