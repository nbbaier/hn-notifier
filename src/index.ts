import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { Env, FollowedItem, NotificationResponse } from "./types";
import {
	HN_BASE_URL,
	HN_PREFIX,
	determineFormatNotification,
	getItem,
	validateAndFetchHNItem,
} from "./utils";

// Validate ID parameter format
const idSchema = z.object({
	id: z
		.string()
		.regex(/^[0-9]+$/)
		.transform((v) => Number(v)),
});

const app = new Hono<Env>();

// Route definitions
app.get("/", async (c) => {
	const availableRoutes = {
		"GET /follow/:id": "follow an item",
		"GET /unfollow/:id": "unfollow an item",
		"GET /get/:id": "get an item's details",
		"GET /list": "list all items you're following",
		"GET /check": "check for new comments on items you're following",
	};
	return c.json(availableRoutes, 200);
});

// Follow a HN item
app.get("/follow/:id", zValidator("param", idSchema), async (c) => {
	const { id } = c.req.valid("param");
	const key = `${HN_PREFIX}${id}`;

	// Check if already following
	const existingItem = await c.env.following.get(key);
	if (existingItem) {
		return c.json({ message: `Already following HN item ${id}` }, 200);
	}

	try {
		const data = await validateAndFetchHNItem(id);
		const comments = data.kids?.length ?? 0;

		await c.env.following.put(key, comments.toString());

		return c.json(
			{
				message: `Followed HN item ${id}`,
				item: {
					id,
					comments,
					url: `${HN_BASE_URL}?id=${id}`,
				},
			},
			201,
		);
	} catch (error) {
		return c.json(
			{
				message: error instanceof Error ? error.message : "Unknown error",
			},
			400,
		);
	}
});

// Unfollow a HN item
app.get("/unfollow/:id", zValidator("param", idSchema), async (c) => {
	const { id } = c.req.valid("param");
	const key = `${HN_PREFIX}${id}`;

	// Check if item exists
	const existingItem = await c.env.following.get(key);
	if (!existingItem) {
		return c.json(
			{
				message: `Not following HN item ${id}`,
			},
			404,
		);
	}

	try {
		await c.env.following.delete(key);
		return c.json(
			{
				message: `Unfollowed HN item ${id}`,
			},
			200,
		);
	} catch (error) {
		return c.json(
			{
				message: error instanceof Error ? error.message : "Unknown error",
			},
			500,
		);
	}
});

// Get a specific HN item
app.get("/get/:id", zValidator("param", idSchema), async (c) => {
	const { id } = c.req.valid("param");
	const item = await getItem(c, `${HN_PREFIX}${id}`);
	return c.json(item, 200);
});

// List all followed items
app.get("/list", async (c) => {
	try {
		const { keys } = await c.env.following.list({ prefix: HN_PREFIX });
		const items = await Promise.all(
			keys.map(async (key) => {
				const item = await getItem(c, key.name);
				return item;
			}),
		);

		// Filter out null items
		const validItems = items.filter(Boolean);
		return c.json(validItems, 200);
	} catch (error) {
		return c.json(
			{
				success: false,
				message:
					error instanceof Error
						? error.message
						: "Error listing followed items",
			},
			500,
		);
	}
});

// Check for new comments on followed items
app.get("/check", async (c) => {
	try {
		const { keys } = await c.env.following.list({ prefix: HN_PREFIX });
		const notifications: NotificationResponse[] = [];

		// Process each item in parallel
		const results = await Promise.all(
			keys.map(async (key) => {
				try {
					const item = await getItem(c, key.name);
					if (!item) return null;

					const data = await validateAndFetchHNItem(item.id);
					return await determineFormatNotification(c, data, item);
				} catch (error) {
					console.error(`Error processing item ${key.name}:`, error);
					return null;
				}
			}),
		);

		// Filter out null results and add to notifications
		for (const notification of results.filter(Boolean)) {
			if (notification) notifications.push(notification);
		}

		return c.json(notifications, 200);
	} catch (error) {
		return c.json(
			{
				message:
					error instanceof Error
						? error.message
						: "Error checking for notifications",
			},
			500,
		);
	}
});

export default app;
