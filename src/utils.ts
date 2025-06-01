import { betterFetch } from "@better-fetch/fetch";
import type { HNItem, Env, FollowedItem, NotificationResponse } from "./types";
import type { Context } from "hono";

export const HN_PREFIX = "hn_";
export const HN_BASE_URL = "https://news.ycombinator.com/item";

/**
 * Creates a URL for a Hacker News item
 * @param id - The ID of the Hacker News item
 * @returns The complete URL for the item
 */
export function createHNItemUrl(id: number): string {
	return `${HN_BASE_URL}?id=${id}`;
}

/**
 * Standardizes error handling across the application
 * @param error - The error to handle
 * @returns An object containing the error message
 */
export function handleError(error: unknown): { message: string } {
	// Log the original error for debugging purposes
	console.error("Original error:", error);

	if (error instanceof Error) {
		return { message: error.message };
	}
	if (typeof error === 'string') {
		return { message: error };
	}
	if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as any).message === 'string') {
		return { message: (error as any).message };
	}

	return { message: "An unexpected error occurred." };
}

/**
 * Validates and fetches a Hacker News item by ID
 * @param id - The ID of the item to fetch
 * @returns The fetched HN item
 * @throws Error if the item is invalid or cannot be fetched
 */
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

/**
 * Updates the comment count for a followed item in the KV store
 * @param c - The Hono context
 * @param key - The key of the item in the KV store
 * @param currentComments - The current number of comments
 */
export async function updateCommentCount<T extends Env>(
	c: Context<T>,
	key: string,
	currentComments: number,
) {
	await c.env.following.put(key, currentComments.toString());
}

/**
 * Creates a notification response object
 * @param id - The ID of the HN item
 * @param storedComments - The number of comments stored in the KV store
 * @param currentComments - The current number of comments on HN
 * @param type - The type of the item (story or comment)
 * @param title - Optional title for story items
 * @returns A notification response object
 */
export function createNotificationResponse(
	id: number,
	storedComments: number,
	currentComments: number,
	type: "story" | "comment",
	title?: string,
): NotificationResponse {
	return {
		id,
		newComments: currentComments - storedComments,
		url: createHNItemUrl(id),
		notification: storedComments < currentComments,
		type,
		...(type === "story" && title ? { title } : {}),
	};
}

/**
 * Determines and formats a notification for a HN item
 * @param c - The Hono context
 * @param data - The HN item data
 * @param item - The followed item from the KV store
 * @returns A notification response if there are new comments
 * @throws Error if the item type is invalid
 */
export async function determineFormatNotification<T extends Env>(
	c: Context<T>,
	data: HNItem,
	item: FollowedItem,
) {
	if (!data.type || !["story", "comment"].includes(data.type)) {
		throw new Error("Can't format this type of item");
	}

	const key = item.key;
	const id = item.id;
	const storedComments = item?.comments ?? 0;
	const currentComments = data.kids?.length ?? 0;

	if (storedComments < currentComments) {
		await updateCommentCount(c, key, currentComments);
	}

	return createNotificationResponse(
		id,
		storedComments,
		currentComments,
		data.type as "story" | "comment",
		data.title,
	);
}

/**
 * Retrieves a followed item from the KV store
 * @param c - The Hono context
 * @param key - The key of the item in the KV store
 * @returns The followed item or null if not found
 */
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
		url: createHNItemUrl(id),
	};
}
