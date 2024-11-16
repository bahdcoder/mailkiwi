CREATE TABLE `formResponses` (
	`id` binary(16) NOT NULL,
	`formId` binary(16) NOT NULL,
	`contactId` binary(16),
	`response` json,
	CONSTRAINT `formResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forms` (
	`id` binary(16) NOT NULL,
	`type` enum('survey','signup'),
	`appearance` enum('popover','inline','floating','fullscreen') NOT NULL,
	`teamId` binary(16) NOT NULL,
	`name` varchar(80) NOT NULL,
	`fields` json,
	CONSTRAINT `forms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `formResponses` ADD CONSTRAINT `formResponses_formId_forms_id_fk` FOREIGN KEY (`formId`) REFERENCES `forms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `formResponses` ADD CONSTRAINT `formResponses_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forms` ADD CONSTRAINT `forms_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;