ALTER TABLE `emailSendEvents` ADD `product` enum('engage','send','letters') NOT NULL;--> statement-breakpoint
ALTER TABLE `emailSends` ADD `contactId` binary(16);--> statement-breakpoint
ALTER TABLE `emailSends` ADD CONSTRAINT `emailSends_contactId_contacts_id_fk` FOREIGN KEY (`contactId`) REFERENCES `contacts`(`id`) ON DELETE no action ON UPDATE no action;