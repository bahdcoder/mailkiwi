ALTER TABLE `emailSendEvents` ADD `broadcastId` binary(16);--> statement-breakpoint
ALTER TABLE `emailSendEvents` ADD `audienceId` binary(16);--> statement-breakpoint
ALTER TABLE `emailSendEvents` ADD CONSTRAINT `emailSendEvents_broadcastId_broadcasts_id_fk` FOREIGN KEY (`broadcastId`) REFERENCES `broadcasts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailSendEvents` ADD CONSTRAINT `emailSendEvents_audienceId_audiences_id_fk` FOREIGN KEY (`audienceId`) REFERENCES `audiences`(`id`) ON DELETE cascade ON UPDATE no action;