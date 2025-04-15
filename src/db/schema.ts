import { sql } from "drizzle-orm";
import { check, sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const hnFollowing = sqliteTable(
	"hn_following",
	(t) => ({
		id: t.integer().primaryKey(),
		title: t.text(),
		type: t.text().notNull(),
		comments: t.integer().notNull().default(0),
		replies: t.integer().notNull().default(0),
	}),
	(t) => [
		check(
			"type",
			sql`${t.type} in ('story', 'comment', 'poll', 'pollopt', 'job')`,
		),
	],
);

const followingSelectSchema = createSelectSchema(hnFollowing);
const followingInsertSchema = createInsertSchema(hnFollowing);

type FollowingSelect = z.infer<typeof followingSelectSchema>;
type FollowingInsert = z.infer<typeof followingSelectSchema>;
