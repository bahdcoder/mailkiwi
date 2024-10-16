ALTER TABLE `audiences` ADD `slug` varchar(72);--> statement-breakpoint
ALTER TABLE `audiences` ADD CONSTRAINT `audiences_slug_unique` UNIQUE(`slug`);--> statement-breakpoint
ALTER TABLE `audiences` ADD `description` text;--> statement-breakpoint
ALTER TABLE `audiences` ADD `product` enum('engage','letters') DEFAULT 'engage';