CREATE TABLE `foama_station_check_days` (
	`id` text PRIMARY KEY NOT NULL,
	`station_id` text NOT NULL,
	`day` text NOT NULL,
	`band` integer NOT NULL,
	`first_checked` integer NOT NULL,
	`last_checked` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `foama_station_check_station_idx` ON `foama_station_check_days` (`station_id`);--> statement-breakpoint
CREATE INDEX `foama_station_check_time_idx` ON `foama_station_check_days` (`last_checked`);--> statement-breakpoint
CREATE TABLE `foama_station_lines` (
	`id` text PRIMARY KEY NOT NULL,
	`station_id` text NOT NULL,
	`route` text NOT NULL,
	`mode` text NOT NULL,
	`first_seen` integer NOT NULL,
	`last_seen` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `foama_station_lines_station_idx` ON `foama_station_lines` (`station_id`);--> statement-breakpoint
CREATE INDEX `foama_station_lines_seen_idx` ON `foama_station_lines` (`last_seen`);