import { betterFetch } from "@better-fetch/fetch";
import type { HNItem, Env, FollowedItem, NotificationResponse } from "./types";
import type { Context } from "hono";

export const HN_PREFIX = "hn_";
export const HN_BASE_URL = "https://news.ycombinator.com/item";

export async function validateAndFetchHNItem(id: number) {
	const { data, error } = await betterFetch<HNItem>(
		`https://hacker-news.firebaseio.com/v0/item/${id}.json`,
	);

	if (error) {
		throw new Error(`Error getting HN item ${id}`);
	}

	if (data === null && error === null) {
		throw new Error(`HN item ${id} is not a valid item`);
	}

	return data;
}

export async function determineFormatNotification<T extends Env>(
	c: Context<T>,
	data: HNItem,
	item: FollowedItem,
) {
	if (!data.type || !["story", "comment"].includes(data.type)) {
		throw new Error("Cant format this type of item");
	}

	const key = item.key;
	const id = item.id;
	const storedComments = item?.comments ?? 0;
	const currentComments = data.kids?.length ?? 0;

	if (storedComments < currentComments) {
		await c.env.following.put(key, currentComments.toString());
	}

	const notification: NotificationResponse = {
		id,
		newComments: currentComments - storedComments,
		url: `${HN_BASE_URL}?id=${id}`,
		notification: storedComments < currentComments,
		type: data.type,
	};

	// if a story, get the title of the story:
	if (notification.type === "story") {
		notification.title = data.title;
	}

	return notification;
}

export async function getItem<T extends Env>(
	c: Context<T>,
	key: string,
): Promise<FollowedItem | null> {
	const item = await c.env.following.get(key);

	if (!item) {
		return null;
	}

	const id = Number(key.split("_")[1]);

	return {
		key,
		id,
		comments: Number(item),
		url: `${HN_BASE_URL}?id=${id}`,
	};
}
