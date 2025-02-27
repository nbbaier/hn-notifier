export type Env = {
	Bindings: {
		following: KVNamespace;
	};
};

export type HNItem = {
	id: number;
	descendants?: number;
	by: string;
	kids?: number[];
	score: number;
	text?: string;
	time: number;
	title: string;
	type: "job" | "story" | "comment" | "poll" | "pollopt";
	url?: string;
};

export interface NotificationResponse {
	id: number;
	newComments: number;
	url: string;
	notification: boolean;
}
