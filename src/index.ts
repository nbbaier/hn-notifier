import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import type { Env, NotificationResponse } from "./types";
import {
	HN_BASE_URL,
	HN_PREFIX,
	getItem,
	validateAndFetchHNItem,
} from "./utils";

const schema = z.object({
	id: z
		.string()
		.regex(/^[0-9]+$/)
		.transform((v) => Number(v)),
});

const app = new Hono<Env>();

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

app.get("/follow/:id", zValidator("param", schema), async (c) => {
	const { id } = c.req.valid("param");
	const key = `${HN_PREFIX}${id}`;

	const item = await c.env.following.get(key);

	if (item) {
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

app.get("/unfollow/:id", zValidator("param", schema), async (c) => {
	const { id } = c.req.valid("param");
	const key = `${HN_PREFIX}${id}`;

	const item = await c.env.following.get(key);

	if (!item) {
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
	} catch (e) {
		return c.json(
			{
				message: e instanceof Error ? e.message : "Unknown error",
			},
			500,
		);
	}
});

app.get("/get/:id", zValidator("param", schema), async (c) => {
	const { id } = c.req.valid("param");
	const item = await getItem(c, `${HN_PREFIX}${id}`);
	return c.json(item, 200);
});

app.get("/list", async (c) => {
	try {
		const { keys } = await c.env.following.list({ prefix: HN_PREFIX });

		const itemsArray = [];

		for (const key of keys) {
			const item = await getItem(c, key.name);
			if (item) {
				itemsArray.push(item);
			}
		}

		return c.json(itemsArray, 200);
	} catch (error) {
		return c.json({
			success: false,
			message: "Error listing following",
		});
	}
});

app.get("/check", async (c) => {
	const { keys } = await c.env.following.list({ prefix: HN_PREFIX });
	const notifications: NotificationResponse[] = [];

	for (const key of keys) {
		const item = await getItem(c, key.name);
		const id = key.name.split("_")[1];

		try {
			const data = await validateAndFetchHNItem(Number(id));
			const storedComments = item?.comments ?? 0;
			const currentComments = data.kids?.length ?? 0;

			if (storedComments < currentComments) {
				await c.env.following.put(key.name, currentComments.toString());
			}

			notifications.push({
				id: Number(id),
				newComments: currentComments - storedComments,
				url: `${HN_BASE_URL}?id=${id}`,
				notification: storedComments < currentComments,
			});
		} catch (error) {
			return c.json(
				{
					message: error instanceof Error ? error.message : "Unknown error",
				},
				400,
			);
		}
	}
	return c.json(notifications, 200);
});

export default app;
