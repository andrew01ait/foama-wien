CREATE TABLE `foama_push_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`event_key` text NOT NULL,
	`sealed` text NOT NULL,
	`kind` text NOT NULL,
	`created` integer NOT NULL,
	`expires` integer NOT NULL,
	`next_attempt` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`lease_token` text DEFAULT '' NOT NULL,
	`valid_until` integer DEFAULT 0 NOT NULL,
	`sent_at` integer DEFAULT 0 NOT NULL,
	`accepted_at` integer DEFAULT 0 NOT NULL,
	`shown_at` integer DEFAULT 0 NOT NULL,
	`clicked_at` integer DEFAULT 0 NOT NULL,
	`suppressed_at` integer DEFAULT 0 NOT NULL,
	`reason` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `foama_push_subscriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `foama_push_outbox_due_idx` ON `foama_push_outbox` (`status`,`next_attempt`);--> statement-breakpoint
CREATE INDEX `foama_push_outbox_sub_idx` ON `foama_push_outbox` (`subscription_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `foama_push_outbox_event_idx` ON `foama_push_outbox` (`subscription_id`,`event_key`);