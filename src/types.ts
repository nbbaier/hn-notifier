export type HNItem = {
	id: number;
	by?: string;
	dead?: boolean;
	deleted?: boolean;
	descendants?: number;
	kids?: number[];
	parent?: number;
	parts?: number[];
	poll?: number;
	score?: number;
	text?: string;
	time?: number;
	title?: string;
	type?: "job" | "story" | "comment" | "poll" | "pollopt";
	url?: string;
};

export type NotificationResponse = {
	id: number;
	newComments: number;
	url: string;
	notification: boolean;
	type?: "job" | "story" | "comment" | "poll" | "pollopt";
	text?: string;
	title?: string;
	parent?: number;
};

export type FollowedItem = {
	key: string;
	id: number;
	comments: number;
	url: string;
};

export type DBItem = {
	id: number;
	title: string;
	comments: number;
	replies: number;
	type: "story" | "comment" | "poll" | "pollopt" | "job";
};

export type HNAPIResponse = {
	author: string;
	children: HNAPIResponse[];
	created_at: string;
	created_at_i: number;
	id: number;
	options: number[];
	parent_id: number | null;
	points: number;
	story_id: number;
	text: string | null;
	title: string | null;
	type: "story" | "comment" | "poll" | "pollopt" | "job";
	url: string;
};
