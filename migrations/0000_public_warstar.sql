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
	`capabilities` json,
	`accessSecret` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `accessTokens_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audiences` (
	`id` binary(16) NOT NULL,
	`name` varchar(50),
	`teamId` binary(16) NOT NULL,
	`knownProperties` json,
	CONSTRAINT `audiences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `automationSteps` (
	`id` binary(16) NOT NULL,
	`automationId` binary(16) NOT NULL,
	`type` enum('TRIGGER','ACTION','RULE','END') NOT NULL,
	`status` enum('DRAFT','ACTIVE','PAUSED','ARCHIVED') NOT NULL DEFAULT 'DRAFT',
	`subtype` enum('TRIGGER_EMPTY','TRIGGER_CONTACT_SUBSCRIBED','TRIGGER_CONTACT_UNSUBSCRIBED','TRIGGER_CONTACT_TAG_ADDED','TRIGGER_CONTACT_TAG_REMOVED','TRIGGER_API_MANUAL','ACTION_EMPTY','ACTION_SEND_EMAIL','ACTION_ADD_TAG','ACTION_REMOVE_TAG','ACTION_SUBSCRIBE_TO_AUDIENCE','ACTION_UNSUBSCRIBE_FROM_AUDIENCE','ACTION_UPDATE_CONTACT_ATTRIBUTES','RULE_IF_ELSE','RULE_WAIT_FOR_DURATION','RULE_PERCENTAGE_SPLIT','RULE_WAIT_FOR_TRIGGER','END') NOT NULL,
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
CREATE TABLE `broadcastGroups` (
	`id` binary(16) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`teamId` binary(16) NOT NULL,
	CONSTRAINT `broadcastGroups_id` PRIMARY KEY(`id`),
	CONSTRAINT `broadcastGroupNameOnTeamIdKey` UNIQUE(`teamId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `broadcasts` (
	`id` binary(16) NOT NULL,
	`name` varchar(255) NOT NULL,
	`audienceId` binary(16) NOT NULL,
	`segmentId` binary(16),
	`broadcastGroupId` binary(16) NOT NULL,
	`teamId` binary(16) NOT NULL,
	`trackClicks` boolean,
	`trackOpens` boolean,
	`emailContentId` binary(16),
	`senderIdentityId` binary(16),
	`sendingDomainId` binary(16),
	`winningAbTestVariantId` binary(16),
	`waitingTimeToPickWinner` int DEFAULT 4,
	`status` enum('SENT','SENDING','DRAFT','QUEUED_FOR_SENDING','SENDING_FAILED','DRAFT_ARCHIVED','ARCHIVED') DEFAULT 'DRAFT',
	`isAbTest` boolean NOT NULL DEFAULT false,
	`winningCriteria` enum('OPENS','CLICKS','CONVERSIONS'),
	`winningWaitTime` int,
	`sendAt` timestamp,
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp,
	CONSTRAINT `broadcasts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channelMemberships` (
	`id` binary(16) NOT NULL,
	`channelId` binary(16) NOT NULL,
	`userId` binary(16) NOT NULL,
	CONSTRAINT `channelMemberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `channels` (
	`id` binary(16) NOT NULL,
	`name` varchar(80) NOT NULL,
	`description` varchar(255),
	`createdAt` timestamp,
	`private` boolean NOT NULL,
	CONSTRAINT `channels_id` PRIMARY KEY(`id`),
	CONSTRAINT `channels_name_unique` UNIQUE(`name`)
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
	`name` varchar(50),
	`audienceId` binary(16) NOT NULL,
	`status` enum('PENDING','PROCESSING','FAILED','SUCCESS'),
	`subscribeAllContacts` boolean DEFAULT true,
	`updateExistingContacts` boolean DEFAULT true,
	`createdAt` timestamp DEFAULT (now()),
	`propertiesMap` json NOT NULL,
	CONSTRAINT `contactImports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contactProperties` (
	`id` binary(16) NOT NULL,
	`name` varchar(256) NOT NULL,
	`boolean` boolean,
	`date` timestamp,
	`text` varchar(256),
	`float` float,
	`contactId` binary(16) NOT NULL,
	`audienceId` binary(16) NOT NULL,
	CONSTRAINT `contactProperties_id` PRIMARY KEY(`id`),
	CONSTRAINT `propertyNameContactIdKey` UNIQUE(`name`,`contactId`)
);
--> statement-breakpoint
CREATE TABLE `contactPurchases` (
	`id` binary(16) NOT NULL,
	`productId` binary(16) NOT NULL,
	`contactId` binary(16) NOT NULL,
	`purchasedAt` timestamp,
	`expiresAt` timestamp,
	`cancelledAt` timestamp,
	`providerSubscriptionId` varchar(100),
	CONSTRAINT `contactPurchases_id` PRIMARY KEY(`id`)
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
	`lastSentBroadcastEmailAt` timestamp,
	`lastSentAutomationEmailAt` timestamp,
	`lastOpenedBroadcastEmailAt` timestamp,
	`lastClickedBroadcastEmailLinkAt` timestamp,
	`lastOpenedAutomationEmailAt` timestamp,
	`lastClickedAutomationEmailLinkAt` timestamp,
	`lastTrackedActivityFrom` varchar(10),
	`lastTrackedActivityUsingDevice` varchar(56),
	`lastTrackedActivityUsingBrowser` varchar(56),
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`),
	CONSTRAINT `ContactEmailAudienceIdKey` UNIQUE(`email`,`audienceId`)
);
--> statement-breakpoint
CREATE TABLE `creditGrantMandates` (
	`id` binary(16) NOT NULL,
	`teamId` binary(16) NOT NULL,
	`amount` int NOT NULL,
	`status` enum('paused','active') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp,
	CONSTRAINT `creditGrantMandates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditPurchases` (
	`id` binary(16) NOT NULL,
	`amount` int NOT NULL,
	`amountPaid` int NOT NULL,
	`teamId` binary(16) NOT NULL,
	`currency` varchar(10) NOT NULL,
	`paymentProvider` varchar(20) NOT NULL,
	`status` enum('pending','successful','failed') NOT NULL,
	`paymentReferenceId` varchar(255),
	`createdAt` timestamp NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`updatedAt` timestamp,
	`metadata` json,
	CONSTRAINT `creditPurchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creditRefunds` (
	`id` binary(16) NOT NULL,
	`amount` int NOT NULL,
	`amountRefunded` int NOT NULL,
	`teamId` binary(16) NOT NULL,
	`refundStatus` enum('pending','successful','failed') NOT NULL,
	`paymentRefundReferenceId` varchar(255),
	`metadata` json,
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp,
	CONSTRAINT `creditRefunds_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailContents` (
	`id` binary(16) NOT NULL,
	`contentJson` json,
	`contentText` text,
	`contentHtml` text,
	`subject` varchar(255),
	`previewText` varchar(255),
	`updatedAt` timestamp,
	CONSTRAINT `emailContents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSendEvents` (
	`id` binary(16) NOT NULL,
	`emailSendId` binary(16) NOT NULL,
	`type` enum('Delivery','Reception','Bounce','TransientFailure','Expiration','AdminBounce','OOB','Feedback','Rejection','AdminRebind','Any','Click','Open') NOT NULL,
	`createdAt` timestamp,
	`product` enum('engage','send','letters') NOT NULL,
	`contactId` binary(16),
	`broadcastId` binary(16),
	`audienceId` binary(16),
	`responseCode` int,
	`responseContent` text,
	`responseCommand` varchar(255),
	`responseEnhancedCodeClass` int,
	`responseEnhancedCodeSubject` int,
	`responseEnhancedCodeDetail` int,
	`peerAddressName` varchar(255),
	`peerAddressAddr` varchar(255),
	`bounceClassification` varchar(120),
	`originCountry` varchar(10),
	`originState` varchar(56),
	`originCity` varchar(56),
	`originDevice` varchar(56),
	`originBrowser` varchar(56),
	CONSTRAINT `emailSendEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailSends` (
	`id` binary(16) NOT NULL,
	`sendingId` varchar(100),
	`sendingDomainId` binary(16),
	`product` enum('engage','send','letters') NOT NULL,
	`broadcastId` binary(16),
	`sender` varchar(80),
	`recipient` varchar(80),
	`contactId` binary(16),
	`audienceId` binary(16),
	`queue` varchar(80),
	`siteName` varchar(80),
	`size` int,
	`totalAttempts` int,
	`createdAt` timestamp,
	`sendingSourceId` binary(16),
	`links` json,
	`nodeId` varchar(48),
	`egressPool` varchar(80),
	`egressSource` varchar(80),
	`deliveryProtocol` varchar(12),
	`receptionProtocol` varchar(12),
	`clickTrackingEnabled` boolean DEFAULT false,
	`openTrackingEnabled` boolean DEFAULT false,
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
	`senderIdentityId` binary(16),
	CONSTRAINT `emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fonts` (
	`id` binary(16) NOT NULL,
	`family` varchar(50) NOT NULL,
	`category` varchar(50) NOT NULL,
	`files` json NOT NULL,
	`teamId` binary(16),
	`subsets` varchar(255),
	`variants` varchar(255),
	CONSTRAINT `fonts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`audienceId` binary(16) NOT NULL,
	`name` varchar(80) NOT NULL,
	`fields` json,
	`archivedAt` timestamp,
	CONSTRAINT `forms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mediaDocuments` (
	`id` binary(16) NOT NULL,
	`name` varchar(255),
	`altText` varchar(255),
	`teamId` binary(16) NOT NULL,
	`url` text NOT NULL,
	CONSTRAINT `mediaDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messageReactions` (
	`id` binary(16) NOT NULL,
	`messageId` binary(16) NOT NULL,
	`userId` binary(16) NOT NULL,
	`emoji` varchar(50) NOT NULL,
	CONSTRAINT `messageReactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` binary(16) NOT NULL,
	`title` varchar(120),
	`slug` varchar(120),
	`channelId` binary(16) NOT NULL,
	`userId` binary(16) NOT NULL,
	`content` json NOT NULL,
	`parentMessageId` binary(16),
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`),
	CONSTRAINT `messages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `oauth2Accounts` (
	`id` binary(16) NOT NULL,
	`userId` binary(16) NOT NULL,
	`provider` enum('github','google') NOT NULL,
	`providerId` varchar(80) NOT NULL,
	`accessToken` text NOT NULL,
	CONSTRAINT `oauth2Accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `oauth2Accounts_providerId_unique` UNIQUE(`providerId`),
	CONSTRAINT `Oauth2AccountProviderUserIdKey` UNIQUE(`userId`,`provider`)
);
--> statement-breakpoint
CREATE TABLE `passwordResets` (
	`id` binary(16) NOT NULL,
	`userId` binary(16) NOT NULL,
	`token` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`usedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `passwordResets_id` PRIMARY KEY(`id`),
	CONSTRAINT `passwordResets_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `passwordResets_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `productContents` (
	`id` binary(16) NOT NULL,
	`productId` binary(16),
	`type` enum('downloadable','course') NOT NULL,
	CONSTRAINT `productContents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` binary(16) NOT NULL,
	`teamId` binary(16) NOT NULL,
	`audienceId` binary(16),
	`cycle` enum('monthly','yearly','once') NOT NULL,
	`name` varchar(50) NOT NULL,
	`price` int,
	`priceYearly` int,
	`priceMonthly` int,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
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
CREATE TABLE `senderIdentities` (
	`id` binary(16) NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(80) NOT NULL,
	`sendingDomainId` binary(16) NOT NULL,
	`teamId` binary(16) NOT NULL,
	`emailVerificationCode` varchar(256),
	`emailVerifiedAt` timestamp,
	`emailVerificationCodeExpiresAt` timestamp,
	`replyToEmail` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `senderIdentities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sendingDomains` (
	`id` binary(16) NOT NULL,
	`name` varchar(100) NOT NULL,
	`teamId` binary(16) NOT NULL,
	`dkimSubDomain` varchar(120) NOT NULL,
	`dkimPublicKey` text NOT NULL,
	`dkimPrivateKey` text NOT NULL,
	`dkimVerifiedAt` timestamp,
	`returnPathSubDomain` varchar(120) NOT NULL,
	`returnPathDomainCnameValue` varchar(120) NOT NULL,
	`returnPathDomainVerifiedAt` timestamp,
	`sendingSourceId` binary(16),
	`secondarySendingSourceId` binary(16),
	`engageSendingSourceId` binary(16),
	`engageSecSendingSourceId` binary(16),
	`trackingDomainCnameValue` varchar(120) NOT NULL,
	`trackingSubDomain` varchar(120) NOT NULL,
	`trackingDomainVerifiedAt` timestamp,
	`trackingDomainSslVerifiedAt` timestamp,
	`trackingSslCertKey` text,
	`trackingSslCertSecret` text,
	`openTrackingEnabled` boolean DEFAULT false,
	`clickTrackingEnabled` boolean DEFAULT false,
	`product` enum('engage','send') DEFAULT 'engage',
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
CREATE TABLE `settings` (
	`id` binary(16) NOT NULL,
	`acmeAccountIdentity` text NOT NULL,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`)
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
	`commerceProvider` enum('stripe','paystack','flutterwave'),
	`commerceProviderAccountId` varchar(255),
	`commerceProviderConfirmedAt` timestamp,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` binary(16) NOT NULL,
	`email` varchar(80) NOT NULL,
	`firstName` varchar(80),
	`lastName` varchar(80),
	`avatarUrl` varchar(256),
	`password` varchar(256),
	`emailVerificationCode` varchar(256),
	`emailVerifiedAt` timestamp,
	`emailVerificationCodeExpiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`role` enum('customer','support','team'),
	`lastLoggedInAt` timestamp,
	`lastPasswordResetAt` timestamp,
	`lastLoggedInProvider` enum('password','github','google'),
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
CREATE TABLE `websitePages` (
	`id` binary(16) NOT NULL,
	`title` varchar(72),
	`path` varchar(72),
	`description` text,
	`websiteId` binary(16),
	`websiteContent` json NOT NULL,
	`draftWebsiteContent` json NOT NULL,
	`publishedAt` timestamp,
	CONSTRAINT `websitePages_id` PRIMARY KEY(`id`),
	CONSTRAINT `websiteIdPathKey` UNIQUE(`websiteId`,`path`)
);
--> statement-breakpoint
CREATE TABLE `websites` (
	`id` binary(16) NOT NULL,
	`teamId` binary(16) NOT NULL,
	`slug` varchar(72),
	`audienceId` binary(16) NOT NULL,
	`websiteDomain` varchar(120),
	`websiteDomainCnameValue` varchar(120),
	`websiteDomainVerifiedAt` timestamp,
	`websiteDomainSslVerifiedAt` timestamp,
	`websiteSslCertKey` text,
	`websiteSslCertSecret` text,
	`websiteSslCertChallengeToken` varchar(256),
	`websiteSslCertChallengeKeyAuthorization` text,
	CONSTRAINT `websites_id` PRIMARY KEY(`id`),
	CONSTRAINT `websites_websiteDomain_unique` UNIQUE(`websiteDomain`)
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
ALTER TABLE `broadcastGroups` ADD CONSTRAINT `broadcastGroups_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_segmentId_segments_id_fk` FOREIGN KEY (`segmentId`) REFERENCES `segments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_broadcastGroupId_broadcastGroups_id_fk` FOREIGN KEY (`broadcastGroupId`) REFERENCES `broadcastGroups`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_emailContentId_emailContents_id_fk` FOREIGN KEY (`emailContentId`) REFERENCES `emailContents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_senderIdentityId_senderIdentities_id_fk` FOREIGN KEY (`senderIdentityId`) REFERENCES `senderIdentities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_sendingDomainId_sendingDomains_id_fk` FOREIGN KEY (`sendingDomainId`) REFERENCES `sendingDomains`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `broadcasts` ADD CONSTRAINT `broadcasts_winningAbTestVariantId_abTestVariants_id_fk` FOREIGN KEY (`winningAbTestVariantId`) REFERENCES `abTestVariants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channelMemberships` ADD CONSTRAINT `channelMemberships_channelId_channels_id_fk` FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `channelMemberships` ADD CONSTRAINT `channelMemberships_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactAutomationSteps` ADD CONSTRAINT `contactAutomationSteps_automationStepId_automationSteps_id_fk` FOREIGN KEY (`automationStepId`) REFERENCES `automationSteps`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactAutomationSteps` ADD CONSTRAINT `contactAutomationSteps_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactImports` ADD CONSTRAINT `contactImports_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactProperties` ADD CONSTRAINT `contactProperties_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactProperties` ADD CONSTRAINT `contactProperties_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactPurchases` ADD CONSTRAINT `contactPurchases_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactPurchases` ADD CONSTRAINT `contactPurchases_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contacts` ADD CONSTRAINT `contacts_contactImportId_contactImports_id_fk` FOREIGN KEY (`contactImportId`) REFERENCES `contactImports`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creditGrantMandates` ADD CONSTRAINT `creditGrantMandates_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creditPurchases` ADD CONSTRAINT `creditPurchases_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creditRefunds` ADD CONSTRAINT `creditRefunds_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSendEvents` ADD CONSTRAINT `emailSendEvents_emailSendId_emailSends_id_fk` FOREIGN KEY (`emailSendId`) REFERENCES `emailSends`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSendEvents` ADD CONSTRAINT `emailSendEvents_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSendEvents` ADD CONSTRAINT `emailSendEvents_broadcastId_broadcasts_id_fk` FOREIGN KEY (`broadcastId`) REFERENCES `broadcasts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSendEvents` ADD CONSTRAINT `emailSendEvents_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSends` ADD CONSTRAINT `emailSends_sendingDomainId_sendingDomains_id_fk` FOREIGN KEY (`sendingDomainId`) REFERENCES `sendingDomains`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSends` ADD CONSTRAINT `emailSends_broadcastId_broadcasts_id_fk` FOREIGN KEY (`broadcastId`) REFERENCES `broadcasts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSends` ADD CONSTRAINT `emailSends_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSends` ADD CONSTRAINT `emailSends_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSends` ADD CONSTRAINT `emailSends_sendingSourceId_sendingSources_id_fk` FOREIGN KEY (`sendingSourceId`) REFERENCES `sendingSources`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_emailContentId_emailContents_id_fk` FOREIGN KEY (`emailContentId`) REFERENCES `emailContents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emails` ADD CONSTRAINT `emails_senderIdentityId_senderIdentities_id_fk` FOREIGN KEY (`senderIdentityId`) REFERENCES `senderIdentities`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `fonts` ADD CONSTRAINT `fonts_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `formResponses` ADD CONSTRAINT `formResponses_formId_forms_id_fk` FOREIGN KEY (`formId`) REFERENCES `forms`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `formResponses` ADD CONSTRAINT `formResponses_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `forms` ADD CONSTRAINT `forms_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mediaDocuments` ADD CONSTRAINT `mediaDocuments_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messageReactions` ADD CONSTRAINT `messageReactions_messageId_messages_id_fk` FOREIGN KEY (`messageId`) REFERENCES `messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messageReactions` ADD CONSTRAINT `messageReactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_channelId_channels_id_fk` FOREIGN KEY (`channelId`) REFERENCES `channels`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `messages` ADD CONSTRAINT `messages_parentMessageId_messages_id_fk` FOREIGN KEY (`parentMessageId`) REFERENCES `messages`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `oauth2Accounts` ADD CONSTRAINT `oauth2Accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `passwordResets` ADD CONSTRAINT `passwordResets_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productContents` ADD CONSTRAINT `productContents_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `segments` ADD CONSTRAINT `segments_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `senderIdentities` ADD CONSTRAINT `senderIdentities_sendingDomainId_sendingDomains_id_fk` FOREIGN KEY (`sendingDomainId`) REFERENCES `sendingDomains`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `senderIdentities` ADD CONSTRAINT `senderIdentities_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
ALTER TABLE `websitePages` ADD CONSTRAINT `websitePages_websiteId_websites_id_fk` FOREIGN KEY (`websiteId`) REFERENCES `websites`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `websites` ADD CONSTRAINT `websites_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `websites` ADD CONSTRAINT `websites_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `messageChannelIdIndex` ON `messages` (`channelId`);--> statement-breakpoint
CREATE INDEX `messageCreatedAtIndex` ON `messages` (`createdAt`);--> statement-breakpoint
CREATE INDEX `tagsOnContactsTagIdContactIdIdx` ON `tagsOnContacts` (`tagId`,`contactId`);