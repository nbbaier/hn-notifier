export default {
	openapi: "3.1.0",
	info: {
		title: "Hacker News Algolia API",
		version: "v1",
		description:
			"API for searching and retrieving Hacker News data, powered by Algolia.\nProvides endpoints to search for stories and comments based on various criteria,\nretrieve specific items (stories, comments) by ID, and fetch minimal user profiles.\n\n**Note:** This specification has been refined based on actual API responses observed on 2024-02-21.\nThe structure of Items returned by `/search` differs slightly from those returned by `/items/{id}` (e.g., the `children` field).\nThe `/users/{username}` endpoint returns a minimal subset of user data compared to the full data available in the search index.\n\nOriginal Documentation: https://hn.algolia.com/api\n",
		contact: {
			name: "Algolia HN Search",
			url: "https://hn.algolia.com/",
		},
	},
	servers: [
		{
			url: "https://hn.algolia.com/api/v1",
			description: "Production server",
		},
	],
	tags: [
		{
			name: "Search",
			description: "Search for stories and comments",
		},
		{
			name: "Items",
			description: "Retrieve specific items (stories, comments, etc.) by HN ID",
		},
		{
			name: "Users",
			description: "Retrieve minimal user profiles by username",
		},
	],
	paths: {
		"/search": {
			get: {
				tags: ["Search"],
				summary: "Search stories and comments",
				description:
					"Performs a search for stories and comments matching a textual query, filtered by criteria like tags, numeric values (points, comments count), and date ranges. Returns items matching the Algolia index structure.",
				operationId: "searchItems",
				parameters: [
					{
						name: "query",
						in: "query",
						description: "The textual query to search for.",
						required: true,
						schema: {
							type: "string",
							example: "openai",
						},
					},
					{
						name: "tags",
						in: "query",
						description:
							"A comma-separated list of tags to filter the query.\nValid tags: `story`, `comment`, `poll`, `pollopt`, `show_hn`, `ask_hn`, `front_page`, `author_<username>`, `story_<story_id>`.\nUse parentheses for OR conditions e.g., `(story,poll)`.\nPrefix with `-` for negation.\n",
						required: false,
						schema: {
							type: "string",
							example: "story,author_pg",
						},
					},
					{
						name: "numericFilters",
						in: "query",
						description:
							"Filter on numeric attributes using operators like `<`, `<=`, `=`, `>`, `>=`.\nComma-separate multiple filters (interpreted as AND).\nAttributes: `created_at_i` (unix timestamp), `points`, `num_comments`.\n",
						required: false,
						schema: {
							type: "string",
							example: "points>1000",
						},
					},
					{
						name: "page",
						in: "query",
						description: "The page number to retrieve (0-based).",
						required: false,
						schema: {
							type: "integer",
							format: "int32",
							minimum: 0,
							default: 0,
							example: 1,
						},
					},
					{
						name: "hitsPerPage",
						in: "query",
						description: "The number of hits per page.",
						required: false,
						schema: {
							type: "integer",
							format: "int32",
							minimum: 1,
							maximum: 1000,
							default: 20,
							example: 5,
						},
					},
				],
				responses: {
					"200": {
						description: "Successful search results.",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/SearchResults",
								},
								example: {
									exhaustive: {
										nbHits: false,
										typo: false,
									},
									exhaustiveNbHits: false,
									exhaustiveTypo: false,
									hits: [
										{
											_highlightResult: {
												author: {
													matchLevel: "none",
													matchedWords: [],
													value: "reneherse",
												},
												title: {
													fullyHighlighted: false,
													matchLevel: "full",
													matchedWords: ["test"],
													value: "A Most Peculiar <em>Test</em> Drive",
												},
												url: {
													fullyHighlighted: false,
													matchLevel: "full",
													matchedWords: ["test"],
													value:
														"http://www.teslamotors.com/blog/most-peculiar-<em>test</em>-drive",
												},
											},
											_tags: ["story", "author_reneherse", "story_5218288"],
											author: "reneherse",
											children: [5218334, 5218338, 5218352],
											created_at: "2013-02-14T07:37:14Z",
											created_at_i: 1360827434,
											num_comments: 578,
											objectID: "5218288",
											points: 1859,
											story_id: 5218288,
											title: "A Most Peculiar Test Drive",
											updated_at: "2023-09-06T20:49:33Z",
											url: "http://www.teslamotors.com/blog/most-peculiar-test-drive",
										},
									],
									hitsPerPage: 5,
									nbHits: 820396,
									nbPages: 200,
									page: 0,
									params:
										"query=test&hitsPerPage=5&advancedSyntax=true&analyticsTags=backend",
									processingTimeMS: 4,
									processingTimingsMS: {
										_request: {
											roundTrip: 14,
										},
										fetch: {
											query: 2,
											total: 3,
										},
										total: 4,
									},
									query: "test",
									serverTimeMS: 5,
								},
							},
						},
					},
					"400": {
						$ref: "#/components/responses/BadRequest",
					},
					"500": {
						$ref: "#/components/responses/InternalServerError",
					},
				},
			},
		},
		"/search_by_date": {
			get: {
				tags: ["Search"],
				summary: "Search stories and comments by date",
				description:
					"Performs a search primarily filtered by creation date, allowing optional textual query and further filtering. Results are sorted by date descending. Returns items matching the Algolia index structure.",
				operationId: "searchItemsByDate",
				parameters: [
					{
						name: "query",
						in: "query",
						description: "The textual query to search for (optional).",
						required: false,
						schema: {
							type: "string",
							example: "security",
						},
					},
					{
						name: "tags",
						in: "query",
						description:
							"A comma-separated list of tags to filter the query. **Required** for this endpoint.\nValid tags: `story`, `comment`, `poll`, `pollopt`, `show_hn`, `ask_hn`, `front_page`, `author_<username>`, `story_<story_id>`.\nUse parentheses for OR conditions e.g., `(story,poll)`.\nPrefix with `-` for negation.\n",
						required: true,
						schema: {
							type: "string",
							example: "story",
						},
					},
					{
						name: "numericFilters",
						in: "query",
						description:
							"Filter on numeric attributes. Primarily used here for date ranges on `created_at_i`.\nExample: `created_at_i>1672531200,created_at_i<1675209600` (Jan 2023).\nOther numeric attributes: `points`, `num_comments`.\n",
						required: false,
						schema: {
							type: "string",
							example: "created_at_i>1696118400",
						},
					},
					{
						name: "page",
						in: "query",
						description: "The page number to retrieve (0-based).",
						required: false,
						schema: {
							type: "integer",
							format: "int32",
							minimum: 0,
							default: 0,
						},
					},
					{
						name: "hitsPerPage",
						in: "query",
						description: "The number of hits per page.",
						required: false,
						schema: {
							type: "integer",
							format: "int32",
							minimum: 1,
							maximum: 1000,
							default: 20,
						},
					},
				],
				responses: {
					"200": {
						description: "Successful search results sorted by date.",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/SearchResults",
								},
							},
						},
					},
					"400": {
						$ref: "#/components/responses/BadRequest",
					},
					"500": {
						$ref: "#/components/responses/InternalServerError",
					},
				},
			},
		},
		"/items/{id}": {
			get: {
				tags: ["Items"],
				summary: "Get item by Hacker News ID",
				description:
					"Retrieve a specific item (story, comment, poll, pollopt) by its integer Hacker News `id`. Returns the item with potentially nested children.",
				operationId: "getItemById",
				parameters: [
					{
						name: "id",
						in: "path",
						description: "The integer Hacker News ID of the item.",
						required: true,
						schema: {
							type: "integer",
							format: "int64",
							example: 1,
						},
					},
				],
				responses: {
					"200": {
						description: "Successfully retrieved item details.",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/ItemDetail",
								},
								examples: {
									story: {
										summary: "Example Story Response (ID 1)",
										value: {
											author: "pg",
											children: [
												{
													author: "sama",
													children: [],
													created_at: "2006-10-09T19:51:01.000Z",
													created_at_i: 1160423461,
													id: 15,
													options: [],
													parent_id: 1,
													points: null,
													story_id: 1,
													text: "'the rising star of venture capital'-unknown VC eating lunch on SHR",
													title: null,
													type: "comment",
													url: null,
												},
											],
											created_at: "2006-10-09T18:21:51.000Z",
											created_at_i: 1160418111,
											id: 1,
											options: [],
											parent_id: null,
											points: 57,
											story_id: 1,
											text: null,
											title: "Y Combinator",
											type: "story",
											url: "http://ycombinator.com",
										},
									},
									comment: {
										summary: "Example Comment Response (ID 43666871)",
										value: {
											author: "CliffStoll",
											children: [],
											created_at: "2025-04-12T18:36:15.000Z",
											created_at_i: 1744482975,
											id: 43666871,
											options: [],
											parent_id: 43666439,
											points: null,
											story_id: 43666439,
											text: "Is there any SVG extension which allows density of line? ...",
											title: null,
											type: "comment",
											url: null,
										},
									},
								},
							},
						},
					},
					"404": {
						$ref: "#/components/responses/NotFound",
					},
					"500": {
						$ref: "#/components/responses/InternalServerError",
					},
				},
			},
		},
		"/users/{username}": {
			get: {
				tags: ["Users"],
				summary: "Get minimal user profile by username",
				description:
					"Retrieve minimal profile information (username, karma, about) for a specific Hacker News user by their case-sensitive username. Note this is less detailed than the user data in the search index.",
				operationId: "getUserByUsername",
				parameters: [
					{
						name: "username",
						in: "path",
						description: "The case-sensitive username of the user.",
						required: true,
						schema: {
							type: "string",
							example: "pg",
						},
					},
				],
				responses: {
					"200": {
						description: "Successfully retrieved minimal user details.",
						content: {
							"application/json": {
								schema: {
									$ref: "#/components/schemas/UserProfileMinimal",
								},
								example: {
									about: "Bug fixer.",
									karma: 157316,
									username: "pg",
								},
							},
						},
					},
					"404": {
						$ref: "#/components/responses/NotFound",
					},
					"500": {
						$ref: "#/components/responses/InternalServerError",
					},
				},
			},
		},
	},
	components: {
		schemas: {
			SearchResults: {
				type: "object",
				properties: {
					exhaustive: {
						$ref: "#/components/schemas/ExhaustiveInfo",
					},
					exhaustiveNbHits: {
						type: "boolean",
						description:
							"Whether the `nbHits` count is exact (`true`) or an estimate (`false`).",
						example: false,
					},
					exhaustiveTypo: {
						type: "boolean",
						description:
							"Whether the typo tolerance search was exhaustive (`true`) or approximate (`false`).",
						example: false,
					},
					hits: {
						type: "array",
						items: {
							$ref: "#/components/schemas/SearchHitItem",
						},
						description: "List of search results (items).",
					},
					hitsPerPage: {
						type: "integer",
						format: "int32",
						description: "Number of hits requested per page.",
						example: 5,
					},
					nbHits: {
						type: "integer",
						format: "int32",
						description:
							"Total number of hits matching the query (can be an estimate if `exhaustiveNbHits` is false).",
						example: 820396,
					},
					nbPages: {
						type: "integer",
						format: "int32",
						description: "Total number of pages available for the query.",
						example: 200,
					},
					page: {
						type: "integer",
						format: "int32",
						description: "Current page number (0-based).",
						example: 0,
					},
					params: {
						type: "string",
						description:
							"A string representation of all search parameters used for the query.",
						example:
							"query=test&hitsPerPage=5&advancedSyntax=true&analyticsTags=backend",
					},
					processingTimeMS: {
						type: "integer",
						format: "int32",
						description:
							"Time taken by the Algolia engine to process the request (in milliseconds).",
						example: 4,
					},
					processingTimingsMS: {
						$ref: "#/components/schemas/ProcessingTimings",
					},
					query: {
						type: "string",
						description: "The query string used for the search.",
						example: "test",
					},
					serverTimeMS: {
						type: "integer",
						format: "int32",
						description:
							"Time reported by the server for processing (may differ slightly from processingTimeMS).",
						example: 5,
					},
				},
				required: [
					"exhaustive",
					"exhaustiveNbHits",
					"exhaustiveTypo",
					"hits",
					"hitsPerPage",
					"nbHits",
					"nbPages",
					"page",
					"params",
					"processingTimeMS",
					"processingTimingsMS",
					"query",
					"serverTimeMS",
				],
			},
			SearchHitItem: {
				type: "object",
				description:
					"Represents a Hacker News item as found in search results. Note `children` contains IDs, not nested objects.",
				properties: {
					_highlightResult: {
						type: "object",
						description:
							"Contains highlighted snippets for matched query terms.",
						properties: {
							title: {
								$ref: "#/components/schemas/HighlightField",
							},
							url: {
								$ref: "#/components/schemas/HighlightField",
							},
							author: {
								$ref: "#/components/schemas/HighlightField",
							},
							text: {
								$ref: "#/components/schemas/HighlightField",
							},
						},
						additionalProperties: {
							$ref: "#/components/schemas/HighlightField",
						},
					},
					_tags: {
						type: "array",
						items: {
							type: "string",
						},
						description: "List of tags associated with the item.",
						example: ["story", "author_testuser", "show_hn"],
					},
					author: {
						type: "string",
						description: "The username of the item's author.",
						nullable: true,
						example: "reneherse",
					},
					children: {
						type: "array",
						items: {
							type: "integer",
							format: "int64",
						},
						description:
							"List of integer IDs of the direct children comments. Null or empty if no children.",
						nullable: true,
						example: [5218334, 5218338, 5218352],
					},
					created_at: {
						type: "string",
						format: "date-time",
						description: "Creation date and time in ISO 8601 format (UTC).",
						example: "2013-02-14T07:37:14Z",
					},
					created_at_i: {
						type: "integer",
						format: "int64",
						description:
							"Creation date and time as a Unix timestamp (seconds).",
						example: 1360827434,
					},
					num_comments: {
						type: "integer",
						format: "int32",
						description:
							"The number of comments associated with the story or poll. Null for comments themselves.",
						nullable: true,
						example: 578,
					},
					objectID: {
						type: "string",
						description:
							"Unique identifier for the item in Algolia's index (string representation of HN ID).",
						example: "5218288",
					},
					points: {
						type: "integer",
						format: "int32",
						description:
							"The number of points (upvotes) the item has received. Null for some item types or comments.",
						nullable: true,
						example: 1859,
					},
					story_id: {
						type: "integer",
						format: "int64",
						description:
							"The HN ID of the story this item is related to. For stories, it's the story's own ID. For comments, it's the parent story's ID. Null if not applicable.",
						nullable: true,
						example: 5218288,
					},
					title: {
						type: "string",
						description: "The title of the story or poll. Null for comments.",
						nullable: true,
						example: "A Most Peculiar Test Drive",
					},
					updated_at: {
						type: "string",
						format: "date-time",
						description:
							"Timestamp of the last update to the item in the Algolia index.",
						example: "2023-09-06T20:49:33Z",
					},
					url: {
						type: "string",
						format: "url",
						description:
							"The URL associated with the story. Null for Ask HN, Show HN without URL, comments.",
						nullable: true,
						example: "http://www.teslamotors.com/blog/most-peculiar-test-drive",
					},
				},
				required: [
					"_highlightResult",
					"_tags",
					"author",
					"created_at",
					"created_at_i",
					"objectID",
					"updated_at",
				],
			},
			ItemDetail: {
				type: "object",
				description:
					"Represents a Hacker News item (story, comment, poll, etc.) as returned by the /items/{id} endpoint. Note `children` contains nested ItemDetail objects.",
				properties: {
					id: {
						type: "integer",
						format: "int64",
						description: "The item's unique Hacker News ID.",
						example: 1,
					},
					author: {
						type: "string",
						description: "The username of the item's author.",
						nullable: true,
						example: "pg",
					},
					children: {
						type: "array",
						items: {
							type: "object",
							properties: {
								id: { type: "integer", format: "int64" },
								author: { type: "string", nullable: true },
								children: { type: "array", items: { type: "object" } },
								created_at: { type: "string", format: "date-time" },
								created_at_i: { type: "integer", format: "int64" },
								options: {
									type: "array",
									items: { type: "string" },
									nullable: true,
								},
								parent_id: { type: "integer", format: "int64", nullable: true },
								points: { type: "integer", format: "int32", nullable: true },
								story_id: { type: "integer", format: "int64" },
								text: { type: "string", nullable: true },
								title: { type: "string", nullable: true },
								type: {
									type: "string",
									enum: ["story", "comment", "poll", "pollopt", "job"],
								},
								url: { type: "string", format: "url", nullable: true },
							},
							required: [
								"id",
								"author",
								"children",
								"created_at",
								"created_at_i",
								"options",
								"story_id",
								"type",
							],
						},
						description:
							"List of direct child items (usually comments). Empty if no children.",
						nullable: true,
					},
					created_at: {
						type: "string",
						format: "date-time",
						description: "Creation date and time in ISO 8601 format (UTC).",
						example: "2006-10-09T18:21:51.000Z",
					},
					created_at_i: {
						type: "integer",
						format: "int64",
						description:
							"Creation date and time as a Unix timestamp (seconds).",
						example: 1160418111,
					},
					options: {
						type: "array",
						items: {
							type: "string",
						},
						description:
							"List of options for a poll item. Empty for non-poll items.",
						nullable: true,
					},
					parent_id: {
						type: "integer",
						format: "int64",
						description:
							"The HN ID of the parent item (for comments). Null for top-level stories/polls.",
						nullable: true,
						example: 1,
					},
					points: {
						type: "integer",
						format: "int32",
						description:
							"The number of points (upvotes). Null for comments retrieved via /items/{id}.",
						nullable: true,
						example: 57,
					},
					story_id: {
						type: "integer",
						format: "int64",
						description:
							"The HN ID of the story this item belongs to (itself if a story, the parent story otherwise).",
						example: 1,
					},
					text: {
						type: "string",
						description:
							"The text content of the item (comment text, Ask HN text, etc.). Contains HTML. Null for standard link stories.",
						nullable: true,
						example: "Is there anywhere to eat on Sandhill Road?",
					},
					title: {
						type: "string",
						description: "The title of the story or poll. Null for comments.",
						nullable: true,
						example: "Y Combinator",
					},
					type: {
						type: "string",
						description: "The type of the item.",
						enum: ["story", "comment", "poll", "pollopt", "job"],
						example: "story",
					},
					url: {
						type: "string",
						format: "url",
						description:
							"The URL associated with the story/job. Null for comments, Ask HN, etc.",
						nullable: true,
						example: "http://ycombinator.com",
					},
				},
				required: [
					"id",
					"author",
					"children",
					"created_at",
					"created_at_i",
					"options",
					"story_id",
					"type",
				],
			},
			HighlightField: {
				type: "object",
				properties: {
					value: {
						type: "string",
						description:
							"The highlighted text snippet, with matched terms wrapped in `<em>` tags.",
						example: "A Most Peculiar <em>Test</em> Drive",
					},
					matchLevel: {
						type: "string",
						enum: ["none", "partial", "full"],
						description: "Indicates how well the query matched this field.",
						example: "full",
					},
					matchedWords: {
						type: "array",
						items: {
							type: "string",
						},
						description: "List of query words that matched in this field.",
						example: ["test"],
					},
					fullyHighlighted: {
						type: "boolean",
						description:
							"Whether the entire field value was highlighted (present in some cases).",
						nullable: true,
						example: false,
					},
				},
				required: ["value", "matchLevel", "matchedWords"],
			},
			UserProfileMinimal: {
				type: "object",
				description:
					"Represents the minimal user profile returned by the /users/{username} endpoint.",
				properties: {
					username: {
						type: "string",
						description: "The user's unique, case-sensitive username.",
						example: "pg",
					},
					about: {
						type: "string",
						description:
							"The user's profile description (HTML formatted). Can be null or missing.",
						nullable: true,
						example: "Bug fixer.",
					},
					karma: {
						type: "integer",
						format: "int32",
						description: "The user's karma score.",
						example: 157316,
					},
				},
				required: ["username", "karma"],
			},
			ExhaustiveInfo: {
				type: "object",
				properties: {
					nbHits: {
						type: "boolean",
						description: "Corresponds to top-level exhaustiveNbHits.",
						example: false,
					},
					typo: {
						type: "boolean",
						description: "Corresponds to top-level exhaustiveTypo.",
						example: false,
					},
				},
				required: ["nbHits", "typo"],
			},
			ProcessingTimings: {
				type: "object",
				description: "Detailed breakdown of processing time.",
				properties: {
					_request: {
						type: "object",
						properties: {
							roundTrip: {
								type: "integer",
								format: "int32",
								description: "Round trip time for the request component.",
								example: 14,
							},
						},
						required: ["roundTrip"],
					},
					fetch: {
						type: "object",
						description: "Timings related to fetching data.",
						properties: {
							query: {
								type: "integer",
								format: "int32",
								description: "Time spent in the query phase of fetching.",
								example: 2,
							},
							total: {
								type: "integer",
								format: "int32",
								description: "Total time spent fetching.",
								example: 3,
							},
						},
						required: ["query", "total"],
					},
					total: {
						type: "integer",
						format: "int32",
						description:
							"Total processing time (might differ slightly from top-level processingTimeMS due to rounding or measurement points).",
						example: 4,
					},
				},
				required: ["_request", "fetch"],
			},
			Error: {
				type: "object",
				properties: {
					message: {
						type: "string",
						description:
							"A human-readable error message. Note: Actual API might return text/html for 404s.",
						example: "Item not found",
					},
				},
			},
		},
		responses: {
			NotFound: {
				description:
					"The requested resource (Item or User) was not found. The actual API might return HTML/Text.",
				content: {
					"application/json": {
						schema: {
							$ref: "#/components/schemas/Error",
						},
						example: {
							message: "Not Found",
						},
					},
				},
			},
			BadRequest: {
				description:
					"The request was malformed or had invalid parameters (e.g., missing required 'tags' for search_by_date).",
				content: {
					"application/json": {
						schema: {
							$ref: "#/components/schemas/Error",
						},
						example: {
							message:
								"Invalid parameter: 'tags' is required for search_by_date",
						},
					},
				},
			},
			InternalServerError: {
				description: "An unexpected error occurred on the server.",
				content: {
					"application/json": {
						schema: {
							$ref: "#/components/schemas/Error",
						},
						example: {
							message: "Internal Server Error",
						},
					},
				},
			},
		},
	},
} as const;
