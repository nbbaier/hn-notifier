import { betterFetch } from "@better-fetch/fetch";
import type { HNItem, Env } from "./types";
import type { Context } from "hono";

export const HN_PREFIX = "hn_";
export const HN_BASE_URL = "https://news.ycombinator.com/item";

export async function validateAndFetchHNItem(id: number) {
	const { data, error } = await fetchHNItem(id);

	if (error) {
		throw new Error(`Error getting HN item ${id}`);
	}

	if (data === null && error === null) {
		throw new Error(`HN item ${id} is not a valid item`);
	}

	return data;
}

export async function getItem<T extends Env>(c: Context<T>, key: string) {
	const item = await c.env.following.get(key);

	if (!item) {
		return null;
	}

	const id = key.split("_")[1];
	return {
		id,
		comments: Number(item),
		url: `${HN_BASE_URL}?id=${id}`,
	};
}

export async function fetchHNItem(id: number) {
	return await betterFetch<HNItem>(
		`https://hacker-news.firebaseio.com/v0/item/${id}.json`,
	);
}
