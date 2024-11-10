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
CREATE TABLE `productContents` (
	`id` binary(16) NOT NULL,
	`productId` binary(16),
	`type` enum('downloadable','course') NOT NULL,
	CONSTRAINT `productContents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` binary(16) NOT NULL,
	`audienceId` binary(16),
	`cycle` enum('monthly','yearly','once') NOT NULL,
	`name` varchar(50) NOT NULL,
	`price` int,
	`priceYearly` int,
	`priceMonthly` int,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `teams` ADD `commerceProvider` enum('stripe','paystack','flutterwave');--> statement-breakpoint
ALTER TABLE `teams` ADD `commerceProviderAccountId` varchar(255);--> statement-breakpoint
ALTER TABLE `teams` ADD `commerceProviderConfirmedAt` timestamp;--> statement-breakpoint
ALTER TABLE `contactPurchases` ADD CONSTRAINT `contactPurchases_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `contactPurchases` ADD CONSTRAINT `contactPurchases_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productContents` ADD CONSTRAINT `productContents_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE no action ON UPDATE no action;