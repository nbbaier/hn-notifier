import { betterFetch } from "@better-fetch/fetch";
import { zValidator } from "@hono/zod-validator";
import { drizzle } from "drizzle-orm/d1";
import { Hono } from "hono";
import { hnFollowing } from "../../db/schema";
import type { HNAPIResponse } from "../../types";
import { HN_API_URL, createDBItem } from "../../utils";
import { idSchema } from "../common";

const app = new Hono<{ Bindings: Env }>().basePath("/v2");

app.get("/", (c) => c.text("GET /"));

app.get("/follow/:id", zValidator("param", idSchema), async (c) => {
	const { id } = c.req.valid("param");

	// get the id

	return c.text(`GET /follow/${id}`);
});

app.get("/get/:id", (c) => c.text("GET /get/:id"));

app.get("/unfollow/:id", (c) => c.text("GET /unfollow/:id"));

app.get("/list", (c) => c.text("GET /follow/:id"));

app.get("/new-follow/:id", zValidator("param", idSchema), async (c) => {
	const db = drizzle(c.env.DB);
	const { id } = c.req.valid("param");

	const { data, error } = await betterFetch<HNAPIResponse>(
		`${HN_API_URL}/${id}`,
	);

	if (error) {
		return c.json(error);
	}

	if (!data) {
		return c.json({
			message: "Something went amiss",
			status: 500,
			statusText: "Unknown error",
		});
	}

	const newItem = await createDBItem(id, data);
	console.log(newItem);

	const results = await db.insert(hnFollowing).values(newItem).returning();

	return c.json(results);
});

app.get("/new-list", async (c) => {
	const db = drizzle(c.env.DB);
	const results = await db.select().from(hnFollowing).all();
	return c.json(results, 200);
});

export default app;
