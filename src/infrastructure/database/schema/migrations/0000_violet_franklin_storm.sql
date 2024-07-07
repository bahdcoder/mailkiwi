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
CREATE TABLE `Contact` (
	`id` varchar(32) NOT NULL,
	`firstName` varchar(50),
	`lastName` varchar(50),
	`email` varchar(50) NOT NULL,
	`avatarUrl` varchar(256),
	`subscribedAt` timestamp,
	`unsubscribedAt` timestamp,
	`audienceId` varchar(32) NOT NULL,
	`attributes` json,
	CONSTRAINT `Contact_id` PRIMARY KEY(`id`),
	CONSTRAINT `Contact_email_audienceId_key` UNIQUE(`email`, `audienceId`)
);

--> statement-breakpoint
CREATE TABLE `mailerIdentities` (
	`id` varchar(32) NOT NULL,
	`mailerId` varchar(32),
	`value` varchar(50) NOT NULL,
	`MailerIdentityType` enum('EMAIL', 'DOMAIN'),
	`MailerIdentityStatus` enum(
		'PENDING',
		'APPROVED',
		'DENIED',
		'FAILED',
		'TEMPORARILY_FAILED'
	) DEFAULT 'PENDING',
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
	`MailerProvider` enum('AWS_SES', 'POSTMARK', 'MAILGUN'),
	`MailerStatus` enum(
		'READY',
		'PENDING',
		'INSTALLING',
		'CREATING_IDENTITIES',
		'SENDING_TEST_EMAIL',
		'DISABLED',
		'ACCESS_KEYS_LOST_PROVIDER_ACCESS'
	) DEFAULT 'PENDING',
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
CREATE TABLE `Tag` (
	`id` varchar(32) NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` varchar(256),
	CONSTRAINT `Tag_id` PRIMARY KEY(`id`)
);

--> statement-breakpoint
CREATE TABLE `TagsOnContacts` (
	`tagId` varchar(32) NOT NULL,
	`contactId` varchar(32) NOT NULL,
	`assignedAt` timestamp,
	CONSTRAINT `TagsOnContacts_tagId_contactId_key` UNIQUE(`tagId`, `contactId`)
);

--> statement-breakpoint
CREATE TABLE `teamMemberships` (
	`id` varchar(32) NOT NULL,
	`userId` varchar(32),
	`email` varchar(50) NOT NULL,
	`teamId` varchar(32) NOT NULL,
	`TeamRole` enum('ADMINISTRATOR', 'USER'),
	`MembershipStatus` enum('PENDING', 'ACTIVE'),
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
	`BroadcastEditor` enum('DEFAULT', 'MARKDOWN'),
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);

--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(32) NOT NULL,
	`email` varchar(50) NOT NULL,
	`name` varchar(50),
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
	`WebhookEvent` enum(
		'ALL_EVENTS',
		'CONTACT_ADDED',
		'CONTACT_REMOVED',
		'CONTACT_TAG_ADDED',
		'CONTACT_TAG_REMOVED',
		'BROADCAST_SENT',
		'BROADCAST_PAUSED',
		'BROADCAST_EMAIL_OPENED',
		'BROADCAST_EMAIL_LINK_CLICKED',
		'AUDIENCE_ADDED',
		'TAG_ADDED',
		'TAG_REMOVED'
	),
	`teamId` varchar(32) NOT NULL,
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`)
);

--> statement-breakpoint
ALTER TABLE
	`accessTokens`
ADD
	CONSTRAINT `accessTokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	`accessTokens`
ADD
	CONSTRAINT `accessTokens_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	`audiences`
ADD
	CONSTRAINT `audiences_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	`Contact`
ADD
	CONSTRAINT `Contact_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	`mailerIdentities`
ADD
	CONSTRAINT `mailerIdentities_mailerId_mailers_id_fk` FOREIGN KEY (`mailerId`) REFERENCES `mailers`(`id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	`mailers`
ADD
	CONSTRAINT `mailers_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	`TagsOnContacts`
ADD
	CONSTRAINT `TagsOnContacts_tagId_Tag_id_fk` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	`TagsOnContacts`
ADD
	CONSTRAINT `TagsOnContacts_contactId_Contact_id_fk` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	`teamMemberships`
ADD
	CONSTRAINT `teamMemberships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	`teamMemberships`
ADD
	CONSTRAINT `teamMemberships_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	`teams`
ADD
	CONSTRAINT `teams_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE
	`webhooks`
ADD
	CONSTRAINT `webhooks_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;

--> statement-breakpoint
CREATE INDEX `TagsOnContacts_tagId_contactId_idx` ON `TagsOnContacts` (`tagId`, `contactId`);