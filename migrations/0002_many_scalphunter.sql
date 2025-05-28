ALTER TABLE `users` ADD `newContactNotifications` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `accountSummaryNotifications` boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE `users` ADD `changelogNewsletters` boolean DEFAULT true;