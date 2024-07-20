CREATE TABLE `accessTokens` (
	`id` varchar(32) NOT NULL,
	`userId` varchar(32),
	`teamId` varchar(32),
	`type` varchar(16) NOT NULL,
	`name` varchar(32),
	`hash` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accessTokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audiences` (
	`id` varchar(32) NOT NULL,
	`name` varchar(50) NOT NULL,
	`teamId` varchar(32) NOT NULL,
	CONSTRAINT `audiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automation_steps` (
	`id` varchar(32) NOT NULL,
	`automationId` varchar(32) NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` varchar(512),
	`automationStepType` enum('TRIGGER','ACTION','RULE','END') NOT NULL,
	`automationStepStatus` enum('DRAFT','ACTIVE','PAUSED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`automationStepSubtype` enum('TRIGGER_CONTACT_SUBSCRIBED','TRIGGER_CONTACT_UNSUBSCRIBED','TRIGGER_CONTACT_TAG_ADDED','TRIGGER_CONTACT_TAG_REMOVED','TRIGGER_API_MANUAL','ACTION_SEND_EMAIL','ACTION_ADD_TAG','ACTION_REMOVE_TAG','ACTION_SUBSCRIBE_TO_AUDIENCE','ACTION_UNSUBSCRIBE_FROM_AUDIENCE','ACTION_UPDATE_CONTACT','ACTION_UPDATE_CONTACT_ATTRIBUTES','ACTION_UPDATE_CONTACT_TAGS','RULE_IF_ELSE','RULE_WAIT_FOR_DURATION','RULE_PERCENTAGE_SPLIT','RULE_WAIT_FOR_TRIGGER','END') NOT NULL,
	`parentId` varchar(32),
	`branchIndex` int,
	`configuration` json NOT NULL,
	CONSTRAINT `automation_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automations` (
	`id` varchar(32) NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` varchar(512),
	`audienceId` varchar(32) NOT NULL,
	CONSTRAINT `automations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contactAutomationSteps` (
	`id` varchar(32) NOT NULL,
	`automationStepId` varchar(32) NOT NULL,
	`contactId` varchar(32) NOT NULL,
	`haltedAt` timestamp,
	`failedAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`output` json,
	CONSTRAINT `contactAutomationSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` varchar(32) NOT NULL,
	`firstName` varchar(50),
	`lastName` varchar(50),
	`email` varchar(80) NOT NULL,
	`avatarUrl` varchar(256),
	`subscribedAt` timestamp,
	`unsubscribedAt` timestamp,
	`audienceId` varchar(32) NOT NULL,
	`attributes` json,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `Contact_email_audienceId_key` UNIQUE(`email`,`audienceId`)
);
--> statement-breakpoint
CREATE TABLE `mailerIdentities` (
	`id` varchar(32) NOT NULL,
	`mailerId` varchar(32),
	`value` varchar(50) NOT NULL,
	`MailerIdentityType` enum('EMAIL','DOMAIN') NOT NULL,
	`MailerIdentityStatus` enum('PENDING','APPROVED','DENIED','FAILED','TEMPORARILY_FAILED') NOT NULL DEFAULT 'PENDING',
	`configuration` json,
	`confirmedApprovalAt` timestamp,
	CONSTRAINT `mailerIdentities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mailers` (
	`id` varchar(32) NOT NULL,
	`name` varchar(50) NOT NULL,
	`configuration` varchar(512) NOT NULL,
	`default` boolean,
	`MailerProvider` enum('AWS_SES','POSTMARK','MAILGUN') NOT NULL,
	`MailerStatus` enum('READY','PENDING','INSTALLING','CREATING_IDENTITIES','SENDING_TEST_EMAIL','DISABLED','ACCESS_KEYS_LOST_PROVIDER_ACCESS') NOT NULL DEFAULT 'PENDING',
	`teamId` varchar(512) NOT NULL,
	`sendingEnabled` boolean NOT NULL DEFAULT false,
	`inSandboxMode` boolean NOT NULL DEFAULT true,
	`max24HourSend` int,
	`maxSendRate` int,
	`sentLast24Hours` int,
	`testEmailSentAt` timestamp,
	`installationCompletedAt` timestamp,
	CONSTRAINT `mailers_id` PRIMARY KEY(`id`),
	CONSTRAINT `mailers_teamId_unique` UNIQUE(`teamId`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` varchar(32) NOT NULL,
	`url` varchar(256),
	`domain` varchar(50) NOT NULL,
	`installedSslCertificate` boolean NOT NULL DEFAULT false,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_url_unique` UNIQUE(`url`),
	CONSTRAINT `settings_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` varchar(32) NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` varchar(256),
	`audienceId` varchar(32) NOT NULL,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tagsOnContacts` (
	`tagId` varchar(32) NOT NULL,
	`contactId` varchar(32) NOT NULL,
	`assignedAt` timestamp,
	CONSTRAINT `tagsOnContactsTagIdContactIdKey` UNIQUE(`tagId`,`contactId`)
);
--> statement-breakpoint
CREATE TABLE `teamMemberships` (
	`id` varchar(32) NOT NULL,
	`userId` varchar(32),
	`email` varchar(50) NOT NULL,
	`teamId` varchar(32) NOT NULL,
	`TeamRole` enum('ADMINISTRATOR','USER'),
	`MembershipStatus` enum('PENDING','ACTIVE'),
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `teamMemberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` varchar(32) NOT NULL,
	`name` varchar(100) NOT NULL,
	`userId` varchar(32) NOT NULL,
	`trackClicks` boolean,
	`trackOpens` boolean,
	`configurationKey` varchar(512) NOT NULL,
	`BroadcastEditor` enum('DEFAULT','MARKDOWN'),
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(32) NOT NULL,
	`email` varchar(80) NOT NULL,
	`name` varchar(80),
	`avatarUrl` varchar(256),
	`password` varchar(256) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` varchar(32) NOT NULL,
	`name` varchar(50) NOT NULL,
	`url` varchar(256) NOT NULL,
	`WebhookEvent` enum('ALL_EVENTS','CONTACT_ADDED','CONTACT_REMOVED','CONTACT_TAG_ADDED','CONTACT_TAG_REMOVED','BROADCAST_SENT','BROADCAST_PAUSED','BROADCAST_EMAIL_OPENED','BROADCAST_EMAIL_LINK_CLICKED','AUDIENCE_ADDED','TAG_ADDED','TAG_REMOVED'),
	`teamId` varchar(32) NOT NULL,
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accessTokens` ADD CONSTRAINT `accessTokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accessTokens` ADD CONSTRAINT `accessTokens_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audiences` ADD CONSTRAINT `audiences_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automation_steps` ADD CONSTRAINT `automation_steps_automationId_automations_id_fk` FOREIGN KEY (`automationId`) REFERENCES `automations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automation_steps` ADD CONSTRAINT `automation_steps_parentId_automation_steps_id_fk` FOREIGN KEY (`parentId`) REFERENCES `automation_steps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automations` ADD CONSTRAINT `automations_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactAutomationSteps` ADD CONSTRAINT `contactAutomationSteps_automationStepId_automation_steps_id_fk` FOREIGN KEY (`automationStepId`) REFERENCES `automation_steps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactAutomationSteps` ADD CONSTRAINT `contactAutomationSteps_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mailerIdentities` ADD CONSTRAINT `mailerIdentities_mailerId_mailers_id_fk` FOREIGN KEY (`mailerId`) REFERENCES `mailers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mailers` ADD CONSTRAINT `mailers_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `tags_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tagsOnContacts` ADD CONSTRAINT `tagsOnContacts_tagId_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tagsOnContacts` ADD CONSTRAINT `tagsOnContacts_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teamMemberships` ADD CONSTRAINT `teamMemberships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teamMemberships` ADD CONSTRAINT `teamMemberships_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teams` ADD CONSTRAINT `teams_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhooks` ADD CONSTRAINT `webhooks_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `tagsOnContactsTagIdContactIdIdx` ON `tagsOnContacts` (`tagId`,`contactId`);