CREATE TABLE `abTestVariants` (
	`id` binary(16) NOT NULL,
	`broadcastId` binary(16) NOT NULL,
	`emailContentId` binary(16) NOT NULL,
	`name` varchar(50) NOT NULL,
	`weight` int NOT NULL DEFAULT 1,
	`sendAt` timestamp,
	CONSTRAINT `abTestVariants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `accessTokens` (
	`id` binary(16) NOT NULL,
	`userId` binary(16),
	`teamId` binary(16),
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
	`id` binary(16) NOT NULL,
	`name` varchar(50) NOT NULL,
	`teamId` binary(16) NOT NULL,
	`knownAttributes` json,
	CONSTRAINT `audiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automationSteps` (
	`id` binary(16) NOT NULL,
	`automationId` binary(16) NOT NULL,
	`type` enum('TRIGGER','ACTION','RULE','END') NOT NULL,
	`status` enum('DRAFT','ACTIVE','PAUSED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`subtype` enum('TRIGGER_CONTACT_SUBSCRIBED','TRIGGER_CONTACT_UNSUBSCRIBED','TRIGGER_CONTACT_TAG_ADDED','TRIGGER_CONTACT_TAG_REMOVED','TRIGGER_API_MANUAL','ACTION_SEND_EMAIL','ACTION_ADD_TAG','ACTION_REMOVE_TAG','ACTION_SUBSCRIBE_TO_AUDIENCE','ACTION_UNSUBSCRIBE_FROM_AUDIENCE','ACTION_UPDATE_CONTACT_ATTRIBUTES','RULE_IF_ELSE','RULE_WAIT_FOR_DURATION','RULE_PERCENTAGE_SPLIT','RULE_WAIT_FOR_TRIGGER','END') NOT NULL,
	`parentId` binary(16),
	`branchIndex` int,
	`configuration` json NOT NULL,
	`emailId` binary(16),
	`tagId` binary(16),
	`audienceId` binary(16),
	CONSTRAINT `automationSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automations` (
	`id` binary(16) NOT NULL,
	`name` varchar(50) NOT NULL,
	`description` varchar(512),
	`audienceId` binary(16) NOT NULL,
	CONSTRAINT `automations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `broadcasts` (
	`id` binary(16) NOT NULL,
	`name` varchar(255) NOT NULL,
	`audienceId` binary(16) NOT NULL,
	`segmentId` binary(16),
	`teamId` binary(16) NOT NULL,
	`trackClicks` boolean,
	`trackOpens` boolean,
	`emailContentId` binary(16),
	`winningAbTestVariantId` binary(16),
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
	`id` binary(16) NOT NULL,
	`automationStepId` binary(16) NOT NULL,
	`contactId` binary(16) NOT NULL,
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
	`id` binary(16) NOT NULL,
	`fileIdentifier` varchar(64) NOT NULL,
	`name` varchar(50),
	`audienceId` binary(16) NOT NULL,
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
	`id` binary(16) NOT NULL,
	`firstName` varchar(50),
	`lastName` varchar(50),
	`email` varchar(80) NOT NULL,
	`avatarUrl` varchar(256),
	`subscribedAt` timestamp,
	`unsubscribedAt` timestamp,
	`audienceId` binary(16) NOT NULL,
	`emailVerificationToken` varchar(100),
	`emailVerificationTokenExpiresAt` timestamp,
	`contactImportId` binary(16),
	`attributes` json,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `ContactEmailAudienceIdKey` UNIQUE(`email`,`audienceId`)
);
--> statement-breakpoint
CREATE TABLE `emailContents` (
	`id` binary(16) NOT NULL,
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
CREATE TABLE `emailSendEvents` (
	`id` binary(16) NOT NULL,
	`emailSendId` binary(16) NOT NULL,
	`type` enum('Delivery','Reception','Bounce','TransientFailure','Expiration','AdminBounce','OOB','Feedback','Rejection','AdminRebind','Any') NOT NULL,
	`createdAt` timestamp,
	`responseCode` int,
	`responseContent` text,
	`responseCommand` varchar(255),
	`responseEnhancedCodeClass` int,
	`responseEnhancedCodeSubject` int,
	`responseEnhancedCodeDetail` int,
	`peerAddressName` varchar(255),
	`peerAddressAddr` varchar(255),
	`bounceClassification` varchar(120),
	CONSTRAINT `emailSendEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSends` (
	`id` binary(16) NOT NULL,
	`sendingId` varchar(100) NOT NULL,
	`sendingDomainId` binary(16) NOT NULL,
	`sender` varchar(80) NOT NULL,
	`recipient` varchar(80) NOT NULL,
	`queue` varchar(80),
	`siteName` varchar(80),
	`size` int,
	`totalAttempts` int,
	`createdAt` timestamp,
	`sendingSourceId` binary(16),
	`nodeId` varchar(48),
	`egressPool` varchar(80),
	`egressSource` varchar(80),
	`deliveryProtocol` varchar(12),
	`receptionProtocol` varchar(12),
	CONSTRAINT `emailSends_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailSends_sendingId_unique` UNIQUE(`sendingId`)
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` binary(16) NOT NULL,
	`type` enum('AUTOMATION','TRANSACTIONAL') NOT NULL,
	`title` varchar(50) NOT NULL,
	`audienceId` binary(16) NOT NULL,
	`emailContentId` binary(16),
	CONSTRAINT `emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `segments` (
	`id` binary(16) NOT NULL,
	`name` varchar(255) NOT NULL,
	`audienceId` binary(16) NOT NULL,
	`filterGroups` json NOT NULL,
	CONSTRAINT `segments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sendingDomains` (
	`id` binary(16) NOT NULL,
	`name` varchar(100) NOT NULL,
	`teamId` binary(16) NOT NULL,
	`dkimSubDomain` varchar(120) NOT NULL,
	`dkimPublicKey` text NOT NULL,
	`dkimPrivateKey` text NOT NULL,
	`returnPathSubDomain` varchar(120) NOT NULL,
	`returnPathDomainCnameValue` varchar(120) NOT NULL,
	`sendingSourceId` binary(16),
	`secondarySendingSourceId` binary(16),
	`engageSendingSourceId` binary(16),
	`engageSecSendingSourceId` binary(16),
	`dkimVerifiedAt` timestamp,
	`returnPathDomainVerifiedAt` timestamp,
	CONSTRAINT `sendingDomains_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sendingSources` (
	`id` binary(16) NOT NULL,
	`status` enum('inactive','active','warming'),
	`address` varchar(80) NOT NULL,
	`ehloDomain` varchar(80) NOT NULL,
	`proxyServer` varchar(80),
	`addressIpv6` varchar(120),
	`pool` enum('engage','send') NOT NULL,
	CONSTRAINT `sendingSources_id` PRIMARY KEY(`id`),
	CONSTRAINT `sendingSources_address_unique` UNIQUE(`address`),
	CONSTRAINT `sendingSources_ehloDomain_unique` UNIQUE(`ehloDomain`),
	CONSTRAINT `sendingSources_addressIpv6_unique` UNIQUE(`addressIpv6`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` binary(16) NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` varchar(256),
	`audienceId` binary(16) NOT NULL,
	CONSTRAINT `tags_id` PRIMARY KEY(`id`),
	CONSTRAINT `tagNameAudienceIdKey` UNIQUE(`name`,`audienceId`)
);
--> statement-breakpoint
CREATE TABLE `tagsOnContacts` (
	`id` binary(16) NOT NULL,
	`tagId` binary(16) NOT NULL,
	`contactId` binary(16) NOT NULL,
	`assignedAt` timestamp,
	CONSTRAINT `tagsOnContacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `tagsOnContactsTagIdContactIdKey` UNIQUE(`tagId`,`contactId`)
);
--> statement-breakpoint
CREATE TABLE `teamMemberships` (
	`id` binary(16) NOT NULL,
	`userId` binary(16),
	`email` varchar(50) NOT NULL,
	`teamId` binary(16) NOT NULL,
	`role` enum('ADMINISTRATOR','MANAGER','AUTHOR','GUEST'),
	`status` enum('PENDING','ACTIVE'),
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `teamMemberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` binary(16) NOT NULL,
	`name` varchar(100) NOT NULL,
	`userId` binary(16) NOT NULL,
	`trackClicks` boolean,
	`trackOpens` boolean,
	`broadcastEditor` enum('DEFAULT','MARKDOWN'),
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` binary(16) NOT NULL,
	`email` varchar(80) NOT NULL,
	`name` varchar(80),
	`avatarUrl` varchar(256),
	`password` varchar(256) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `webhooks` (
	`id` binary(16) NOT NULL,
	`name` varchar(50) NOT NULL,
	`url` varchar(256) NOT NULL,
	`webhookEvent` enum('ALL_EVENTS','CONTACT_ADDED','CONTACT_REMOVED','CONTACT_TAG_ADDED','CONTACT_TAG_REMOVED','BROADCAST_SENT','BROADCAST_PAUSED','BROADCAST_EMAIL_OPENED','BROADCAST_EMAIL_LINK_CLICKED','AUDIENCE_ADDED','TAG_ADDED','TAG_REMOVED'),
	`teamId` binary(16) NOT NULL,
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
ALTER TABLE `emailSendEvents` ADD CONSTRAINT `emailSendEvents_emailSendId_emailSends_id_fk` FOREIGN KEY (`emailSendId`) REFERENCES `emailSends`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSends` ADD CONSTRAINT `emailSends_sendingDomainId_sendingDomains_id_fk` FOREIGN KEY (`sendingDomainId`) REFERENCES `sendingDomains`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSends` ADD CONSTRAINT `emailSends_sendingSourceId_sendingSources_id_fk` FOREIGN KEY (`sendingSourceId`) REFERENCES `sendingSources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_emailContentId_emailContents_id_fk` FOREIGN KEY (`emailContentId`) REFERENCES `emailContents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `segments` ADD CONSTRAINT `segments_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sendingDomains` ADD CONSTRAINT `sendingDomains_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sendingDomains` ADD CONSTRAINT `sendingDomains_sendingSourceId_sendingSources_id_fk` FOREIGN KEY (`sendingSourceId`) REFERENCES `sendingSources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sendingDomains` ADD CONSTRAINT `sendingDomains_secondarySendingSourceId_sendingSources_id_fk` FOREIGN KEY (`secondarySendingSourceId`) REFERENCES `sendingSources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sendingDomains` ADD CONSTRAINT `sendingDomains_engageSendingSourceId_sendingSources_id_fk` FOREIGN KEY (`engageSendingSourceId`) REFERENCES `sendingSources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sendingDomains` ADD CONSTRAINT `sendingDomains_engageSecSendingSourceId_sendingSources_id_fk` FOREIGN KEY (`engageSecSendingSourceId`) REFERENCES `sendingSources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tags` ADD CONSTRAINT `tags_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tagsOnContacts` ADD CONSTRAINT `tagsOnContacts_tagId_tags_id_fk` FOREIGN KEY (`tagId`) REFERENCES `tags`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tagsOnContacts` ADD CONSTRAINT `tagsOnContacts_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teamMemberships` ADD CONSTRAINT `teamMemberships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teamMemberships` ADD CONSTRAINT `teamMemberships_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teams` ADD CONSTRAINT `teams_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhooks` ADD CONSTRAINT `webhooks_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `tagsOnContactsTagIdContactIdIdx` ON `tagsOnContacts` (`tagId`,`contactId`);