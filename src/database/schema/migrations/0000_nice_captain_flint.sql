CREATE TABLE `abTestVariants` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`broadcastId` bigint unsigned NOT NULL,
	`emailContentId` bigint unsigned NOT NULL,
	`name` varchar(50) NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	`sendAt` timestamp,
	CONSTRAINT `abTestVariants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accessTokens` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned,
	`teamId` bigint unsigned,
	`name` varchar(32),
	`accessKey` varchar(255),
	`accessSecret` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accessTokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audiences` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`teamId` bigint unsigned NOT NULL,
	`knownAttributes` json,
	CONSTRAINT `audiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automationSteps` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`automationId` bigint unsigned NOT NULL,
	`type` enum('TRIGGER','ACTION','RULE','END') NOT NULL,
	`status` enum('DRAFT','ACTIVE','PAUSED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`subtype` enum('TRIGGER_CONTACT_SUBSCRIBED','TRIGGER_CONTACT_UNSUBSCRIBED','TRIGGER_CONTACT_TAG_ADDED','TRIGGER_CONTACT_TAG_REMOVED','TRIGGER_API_MANUAL','ACTION_SEND_EMAIL','ACTION_ADD_TAG','ACTION_REMOVE_TAG','ACTION_SUBSCRIBE_TO_AUDIENCE','ACTION_UNSUBSCRIBE_FROM_AUDIENCE','ACTION_UPDATE_CONTACT_ATTRIBUTES','RULE_IF_ELSE','RULE_WAIT_FOR_DURATION','RULE_PERCENTAGE_SPLIT','RULE_WAIT_FOR_TRIGGER','END') NOT NULL,
	`parentId` bigint unsigned,
	`branchIndex` int,
	`configuration` json NOT NULL,
	`emailId` bigint unsigned,
	`tagId` bigint unsigned,
	`audienceId` bigint unsigned,
	CONSTRAINT `automationSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automations` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` varchar(512),
	`audienceId` bigint unsigned NOT NULL,
	CONSTRAINT `automations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcasts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`audienceId` bigint unsigned NOT NULL,
	`segmentId` bigint unsigned,
	`teamId` bigint unsigned NOT NULL,
	`trackClicks` boolean,
	`trackOpens` boolean,
	`emailContentId` bigint unsigned,
	`winningAbTestVariantId` bigint unsigned,
	`waitingTimeToPickWinner` int DEFAULT 4,
	`status` enum('SENT','SENDING','DRAFT','QUEUED_FOR_SENDING','SENDING_FAILED','DRAFT_ARCHIVED','ARCHIVED') DEFAULT 'DRAFT',
	`isAbTest` boolean NOT NULL DEFAULT false,
	`winningCriteria` enum('OPENS','CLICKS','CONVERSIONS'),
	`winningWaitTime` int,
	`sendAt` timestamp,
	CONSTRAINT `broadcasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contactAutomationSteps` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`automationStepId` bigint unsigned NOT NULL,
	`contactId` bigint unsigned NOT NULL,
	`status` enum('PENDING','ACTIVE','COMPLETED','FAILED','HALTED') DEFAULT 'PENDING',
	`haltedAt` timestamp,
	`failedAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp,
	`output` json,
	CONSTRAINT `contactAutomationSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contactImports` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`fileIdentifier` varchar(32) NOT NULL,
	`name` varchar(50),
	`audienceId` bigint unsigned NOT NULL,
	`url` varchar(100) NOT NULL,
	`status` enum('PENDING','PROCESSING','FAILED','SUCCESS'),
	`subscribeAllContacts` boolean DEFAULT true,
	`updateExistingContacts` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`attributesMap` json NOT NULL,
	CONSTRAINT `contactImports_id` PRIMARY KEY(`id`),
	CONSTRAINT `contactImports_fileIdentifier_unique` UNIQUE(`fileIdentifier`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`firstName` varchar(50),
	`lastName` varchar(50),
	`email` varchar(80) NOT NULL,
	`avatarUrl` varchar(256),
	`subscribedAt` timestamp,
	`unsubscribedAt` timestamp,
	`audienceId` bigint unsigned NOT NULL,
	`emailVerificationToken` varchar(100),
	`emailVerificationTokenExpiresAt` timestamp,
	`contactImportId` bigint unsigned,
	`attributes` json,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `ContactEmailAudienceIdKey` UNIQUE(`email`,`audienceId`)
);
--> statement-breakpoint
CREATE TABLE `emailContents` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`fromName` varchar(255),
	`fromEmail` varchar(255),
	`replyToEmail` varchar(255),
	`replyToName` varchar(255),
	`contentJson` json,
	`contentText` text,
	`contentHtml` text,
	`subject` varchar(255),
	`previewText` varchar(255),
	CONSTRAINT `emailContents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`type` enum('AUTOMATION','TRANSACTIONAL') NOT NULL,
	`title` varchar(50) NOT NULL,
	`audienceId` bigint unsigned NOT NULL,
	`emailContentId` bigint unsigned,
	CONSTRAINT `emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `segments` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`audienceId` bigint unsigned NOT NULL,
	`filterGroups` json NOT NULL,
	CONSTRAINT `segments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sendingDomains` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`teamId` bigint unsigned NOT NULL,
	`dkimSubDomain` varchar(120) NOT NULL,
	`dkimPublicKey` text NOT NULL,
	`dkimPrivateKey` text NOT NULL,
	`returnPathSubDomain` varchar(120) NOT NULL,
	`returnPathDomainCnameValue` varchar(120) NOT NULL,
	`dkimVerifiedAt` timestamp,
	`returnPathDomainVerifiedAt` timestamp,
	CONSTRAINT `sendingDomains_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`url` varchar(256),
	`domain` varchar(50) NOT NULL,
	`installedSslCertificate` boolean NOT NULL DEFAULT false,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `settings_url_unique` UNIQUE(`url`),
	CONSTRAINT `settings_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` varchar(256),
	`audienceId` bigint unsigned NOT NULL,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tagNameAudienceIdKey` UNIQUE(`name`,`audienceId`)
);
--> statement-breakpoint
CREATE TABLE `tagsOnContacts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`tagId` bigint unsigned NOT NULL,
	`contactId` bigint unsigned NOT NULL,
	`assignedAt` timestamp,
	CONSTRAINT `tagsOnContacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `tagsOnContactsTagIdContactIdKey` UNIQUE(`tagId`,`contactId`)
);
--> statement-breakpoint
CREATE TABLE `teamMemberships` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`userId` bigint unsigned,
	`email` varchar(50) NOT NULL,
	`teamId` bigint unsigned NOT NULL,
	`role` enum('ADMINISTRATOR','MANAGER','AUTHOR','GUEST'),
	`status` enum('PENDING','ACTIVE'),
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `teamMemberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`userId` bigint unsigned NOT NULL,
	`trackClicks` boolean,
	`trackOpens` boolean,
	`broadcastEditor` enum('DEFAULT','MARKDOWN'),
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`email` varchar(80) NOT NULL,
	`name` varchar(80),
	`avatarUrl` varchar(256),
	`password` varchar(256) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`name` varchar(50) NOT NULL,
	`url` varchar(256) NOT NULL,
	`webhookEvent` enum('ALL_EVENTS','CONTACT_ADDED','CONTACT_REMOVED','CONTACT_TAG_ADDED','CONTACT_TAG_REMOVED','BROADCAST_SENT','BROADCAST_PAUSED','BROADCAST_EMAIL_OPENED','BROADCAST_EMAIL_LINK_CLICKED','AUDIENCE_ADDED','TAG_ADDED','TAG_REMOVED'),
	`teamId` bigint unsigned NOT NULL,
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `abTestVariants` ADD CONSTRAINT `abTestVariants_broadcastId_broadcasts_id_fk` FOREIGN KEY (`broadcastId`) REFERENCES `broadcasts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `abTestVariants` ADD CONSTRAINT `abTestVariants_emailContentId_emailContents_id_fk` FOREIGN KEY (`emailContentId`) REFERENCES `emailContents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accessTokens` ADD CONSTRAINT `accessTokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `accessTokens` ADD CONSTRAINT `accessTokens_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audiences` ADD CONSTRAINT `audiences_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automationSteps` ADD CONSTRAINT `automationSteps_automationId_automations_id_fk` FOREIGN KEY (`automationId`) REFERENCES `automations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automationSteps` ADD CONSTRAINT `automationSteps_parentId_automationSteps_id_fk` FOREIGN KEY (`parentId`) REFERENCES `automationSteps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automationSteps` ADD CONSTRAINT `automationSteps_emailId_emails_id_fk` FOREIGN KEY (`emailId`) REFERENCES `emails`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automationSteps` ADD CONSTRAINT `automationSteps_tagId_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automationSteps` ADD CONSTRAINT `automationSteps_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `automations` ADD CONSTRAINT `automations_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_segmentId_segments_id_fk` FOREIGN KEY (`segmentId`) REFERENCES `segments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_emailContentId_emailContents_id_fk` FOREIGN KEY (`emailContentId`) REFERENCES `emailContents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_winningAbTestVariantId_abTestVariants_id_fk` FOREIGN KEY (`winningAbTestVariantId`) REFERENCES `abTestVariants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactAutomationSteps` ADD CONSTRAINT `contactAutomationSteps_automationStepId_automationSteps_id_fk` FOREIGN KEY (`automationStepId`) REFERENCES `automationSteps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactAutomationSteps` ADD CONSTRAINT `contactAutomationSteps_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactImports` ADD CONSTRAINT `contactImports_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_contactImportId_contactImports_id_fk` FOREIGN KEY (`contactImportId`) REFERENCES `contactImports`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_emailContentId_emailContents_id_fk` FOREIGN KEY (`emailContentId`) REFERENCES `emailContents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `segments` ADD CONSTRAINT `segments_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sendingDomains` ADD CONSTRAINT `sendingDomains_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `tags_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tagsOnContacts` ADD CONSTRAINT `tagsOnContacts_tagId_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tagsOnContacts` ADD CONSTRAINT `tagsOnContacts_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teamMemberships` ADD CONSTRAINT `teamMemberships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teamMemberships` ADD CONSTRAINT `teamMemberships_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teams` ADD CONSTRAINT `teams_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhooks` ADD CONSTRAINT `webhooks_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `tagsOnContactsTagIdContactIdIdx` ON `tagsOnContacts` (`tagId`,`contactId`);