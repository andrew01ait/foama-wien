CREATE TABLE `foama_push_deliveries` (
	`id` text PRIMARY KEY NOT NULL,
	`subscription_id` text NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`subscription_id`) REFERENCES `foama_push_subscriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `foama_push_delivery_sub_idx` ON `foama_push_deliveries` (`subscription_id`);--> statement-breakpoint
CREATE TABLE `foama_push_runtime` (
	`id` text PRIMARY KEY NOT NULL,
	`last_check` integer DEFAULT 0 NOT NULL,
	`last_success` integer DEFAULT 0 NOT NULL,
	`next_allowed` integer DEFAULT 0 NOT NULL,
	`lease_until` integer DEFAULT 0 NOT NULL,
	`lease_token` text DEFAULT '' NOT NULL,
	`cursor` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'idle' NOT NULL,
	`result` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `foama_push_subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`auth_hash` text NOT NULL,
	`endpoint_hash` text NOT NULL,
	`sealed` text NOT NULL,
	`expires` integer NOT NULL,
	`last_sent` integer DEFAULT 0 NOT NULL,
	`last_test` integer DEFAULT 0 NOT NULL,
	`day` text DEFAULT '' NOT NULL,
	`day_count` integer DEFAULT 0 NOT NULL,
	`retry_after` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `foama_push_subscriptions_endpoint_hash_unique` ON `foama_push_subscriptions` (`endpoint_hash`);--> statement-breakpoint
CREATE INDEX `foama_push_expires_idx` ON `foama_push_subscriptions` (`expires`);