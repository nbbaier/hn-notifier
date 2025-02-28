export type Env = {
	Bindings: {
		following: KVNamespace;
	};
};

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
