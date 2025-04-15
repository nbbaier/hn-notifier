import { betterFetch } from "@better-fetch/fetch";
import { zValidator } from "@hono/zod-validator";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { hnFollowing } from "../../db/schema";
import type { HNAPIResponse, NotificationResponse } from "../../types";
import {
	HN_API_URL,
	HN_PREFIX,
	createDBItem,
	createHNItemUrl,
	determineFormatNotification,
	getItem,
	handleError,
	validateAndFetchHNItem,
} from "../../utils";
import { idSchema } from "../common";

const app = new Hono<{ Bindings: Env }>().basePath("/v1");

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

app.get("/follow/:id", zValidator("param", idSchema), async (c) => {
	const { id } = c.req.valid("param");
	const key = `${HN_PREFIX}${id}`;

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
					url: createHNItemUrl(id),
				},
			},
			201,
		);
	} catch (error) {
		return c.json(handleError(error), 400);
	}
});

app.get("/unfollow/:id", zValidator("param", idSchema), async (c) => {
	const { id } = c.req.valid("param");
	const key = `${HN_PREFIX}${id}`;

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
		return c.json(handleError(error), 500);
	}
});

app.get("/get/:id", zValidator("param", idSchema), async (c) => {
	const { id } = c.req.valid("param");
	const item = await getItem(c, `${HN_PREFIX}${id}`);
	return c.json(item, 200);
});

app.get("/list", async (c) => {
	try {
		const { keys } = await c.env.following.list({ prefix: HN_PREFIX });
		const items = await Promise.all(
			keys.map(async (key) => {
				const item = await getItem(c, key.name);
				return item;
			}),
		);

		const validItems = items.filter(Boolean);
		return c.json(validItems, 200);
	} catch (error) {
		return c.json(handleError(error), 500);
	}
});

app.get("/check", async (c) => {
	try {
		const { keys } = await c.env.following.list({ prefix: HN_PREFIX });
		const notifications: NotificationResponse[] = [];

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

		for (const notification of results.filter(Boolean)) {
			if (notification) notifications.push(notification);
		}

		return c.json(notifications, 200);
	} catch (error) {
		return c.json(handleError(error), 500);
	}
});

export default app;
