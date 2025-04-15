CREATE TABLE `hn_following` (
	`id` integer,
	`title` text,
	`type` text,
	`comments` integer,
	`replies` integer
);
--> statement-breakpoint
DROP TABLE `users`;