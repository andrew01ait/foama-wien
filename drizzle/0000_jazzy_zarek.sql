CREATE TABLE `foama_transfers` (
	`id` text PRIMARY KEY NOT NULL,
	`read_hash` text NOT NULL,
	`write_hash` text NOT NULL,
	`expires` integer NOT NULL,
	`state` text DEFAULT 'waiting' NOT NULL,
	`direction` text NOT NULL,
	`payload` text
);
--> statement-breakpoint
CREATE INDEX `foama_transfers_expires_idx` ON `foama_transfers` (`expires`);