import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { fetchHNItem } from "./utils";
import type { NotificationResponse } from "./types";

export type Env = {
	Bindings: {
		following: KVNamespace;
	};
};

const schema = z.object({
	id: z
		.string()
		.regex(/^[0-9]+$/)
		.transform((v) => Number(v)),
});

async function getItem<T extends Env>(c: Context<T>, key: string) {
	const item = await c.env.following.get(key);

	if (!item) {
		return null;
	}

	return {
		id: key.split("_")[1],
		comments: Number(item),
		url: `https://news.ycombinator.com/item?id=${key.split("_")[1]}`,
	};
}

const app = new Hono<Env>();

app.get("/", async (c) => {
	return c.text("Hello Hono!");
});

app.get("/follow/:id", zValidator("param", schema), async (c) => {
	const { id } = c.req.valid("param");
	const key = `hn_${id}`;

	const item = await c.env.following.get(key);

	if (item) {
		return c.json(
			{
				message: `Already following HN item ${id}`,
			},
			200,
		);
	}

	const { data, error } = await fetchHNItem(id);

	if (error) {
		return c.json(
			{
				message: `Error getting HN item ${id}`,
			},
			400,
		);
	}

	if (data === null && error === null) {
		return c.json(
			{
				message: `HN item ${id} is not a valid item`,
			},
			400,
		);
	}
	const comments = data.kids?.length ?? 0;

	await c.env.following.put(key, comments.toString());

	return c.json(
		{
			message: `Followed HN item ${id}`,
			item: {
				id,
				comments,
				url: `https://news.ycombinator.com/item?id=${id}`,
			},
		},
		201,
	);
});

app.get("/unfollow/:id", zValidator("param", schema), async (c) => {
	const { id } = c.req.valid("param");
	const key = `hn_${id}`;

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
	const item = await getItem(c, `hn_${id}`);
	return c.json(item, 200);
});

app.get("/list", async (c) => {
	try {
		const { keys } = await c.env.following.list({ prefix: "hn_" });

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
	const { keys } = await c.env.following.list({ prefix: "hn_" });
	const notifications: NotificationResponse[] = [];

	for (const key of keys) {
		const item = await getItem(c, key.name);
		const id = key.name.split("_")[1];

		const { data, error } = await fetchHNItem(Number(id));
		if (error) {
			return c.json(
				{
					message: `Error getting HN item ${id}`,
				},
				400,
			);
		}

		if (data === null && error === null) {
			return c.json(
				{
					message: `HN item ${id} is not a valid item`,
				},
				400,
			);
		}

		const storedComments = item?.comments ?? 0;
		const currentComments = data.kids?.length ?? 0;

		if (storedComments < currentComments) {
			await c.env.following.put(key.name, currentComments.toString());
		}

		notifications.push({
			id: Number(id),
			newComments: currentComments - storedComments,
			url: `https://news.ycombinator.com/item?id=${id}`,
			notification: storedComments < currentComments,
		});
	}
	return c.json(notifications, 200);
});

export default app;
