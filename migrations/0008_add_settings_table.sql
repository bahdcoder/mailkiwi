CREATE TABLE `settings` (
	`id` binary(16) NOT NULL,
	`acmeAccountIdentity` text NOT NULL,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `websitePages` DROP INDEX `websitePages_title_unique`;