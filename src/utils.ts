import { betterFetch } from "@better-fetch/fetch";
import type { Context } from "hono";
import type {
	DBItem,
	FollowedItem,
	HNAPIResponse,
	HNItem,
	NotificationResponse,
} from "./types";

export const HN_PREFIX = "hn_";
export const HN_BASE_URL = "https://news.ycombinator.com/item";
export const HN_API_URL = "https://hn.algolia.com/api/v1/items";

export function createHNItemUrl(id: number): string {
	return `${HN_BASE_URL}?id=${id}`;
}

export function handleError(error: unknown): { message: string } {
	return {
		message: error instanceof Error ? error.message : "Unknown error occurred",
	};
}

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

export async function updateCommentCount(
	c: Context,
	key: string,
	currentComments: number,
) {
	await c.env.following.put(key, currentComments.toString());
}

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

export async function determineFormatNotification(
	c: Context,
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

export async function getItem(
	c: Context,
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

export function countAllChildren(item: HNAPIResponse): number {
	const stack: HNAPIResponse[] = [item];
	let count = 0;

	while (stack.length > 0) {
		const current = stack.pop();

		if (current === undefined) break;

		if (current.children && current.children.length > 0) {
			count += current.children.length;
			stack.push(...current.children);
		}
	}

	return count;
}

export async function getHNCommentStoryTitle(storyId: number): Promise<{
	data: { storyTitle: string } | null;
	error: {
		message?: string | undefined;
		status: number;
		statusText: string;
	} | null;
}> {
	const { data, error } = await getHNItem(storyId);

	let newData: { storyTitle: string } | undefined;

	if (data) {
		const { title } = data;
		newData = { storyTitle: title || "" };
	}

	return { data: newData || null, error };
}

export async function getHNItem(id: number) {
	return await betterFetch<HNAPIResponse>(`${HN_API_URL}/${id}`);
}

export async function createDBItem(
	id: number,
	data: HNAPIResponse,
): Promise<DBItem> {
	const comments = countAllChildren(data);
	const replies = data.children.length;

	if (data.type === "comment") {
		let title = "";
		if (data.story_id) {
			const { data: storyTitleData, error } = await getHNCommentStoryTitle(
				data.story_id,
			);
			if (!error && storyTitleData) {
				title = `Comment on ${storyTitleData.storyTitle}`;
			}
		}
		return { id, title, comments, type: "comment", replies };
	}

	return {
		id,
		title: data.title || "",
		comments,
		type: data.type,
		replies,
	};
}
