PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_hn_following` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text,
	`type` text NOT NULL,
	`comments` integer DEFAULT 0 NOT NULL,
	`replies` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "type" CHECK("__new_hn_following"."type" in ('story', 'comment', 'poll', 'pollopt', 'job'))
);
--> statement-breakpoint
INSERT INTO `__new_hn_following`("id", "title", "type", "comments", "replies") SELECT "id", "title", "type", "comments", "replies" FROM `hn_following`;--> statement-breakpoint
DROP TABLE `hn_following`;--> statement-breakpoint
ALTER TABLE `__new_hn_following` RENAME TO `hn_following`;--> statement-breakpoint
PRAGMA foreign_keys=ON;