ALTER TABLE `contacts` ADD `lastSentBroadcastEmailAt` timestamp;--> statement-breakpoint
ALTER TABLE `contacts` ADD `lastSentAutomationEmailAt` timestamp;--> statement-breakpoint
ALTER TABLE `contacts` ADD `lastOpenedBroadcastEmailAt` timestamp;--> statement-breakpoint
ALTER TABLE `contacts` ADD `lastClickedBroadcastEmailLinkAt` timestamp;--> statement-breakpoint
ALTER TABLE `contacts` ADD `lastOpenedAutomationEmailAt` timestamp;--> statement-breakpoint
ALTER TABLE `contacts` ADD `lastClickedAutomationEmailLinkAt` timestamp;