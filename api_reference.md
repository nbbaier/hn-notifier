---
title: API Reference
description: Complete API reference for the HN Notifier, including all available endpoints, parameters, and example requests and responses.
---

# API Reference

This document provides a comprehensive reference for the HN Notifier API. It includes details on all available endpoints, their purposes, required parameters, and example requests and responses.

## Base URL

All API requests should be made to:

```
https://api.hnnotifier.com
```

## Available Endpoints

### GET /

Lists all available routes and their purposes.

**Example Request:**

```
GET /
```

**Example Response:**

```json
{
  "GET /follow/:id": "follow an item",
  "GET /unfollow/:id": "unfollow an item",
  "GET /get/:id": "get an item's details",
  "GET /list": "list all items you're following",
  "GET /check": "check for new comments on items you're following"
}
```

### GET /follow/:id

Follow a Hacker News item to receive notifications about new comments.

**Parameters:**

- `id` (required): The ID of the Hacker News item to follow.

**Example Request:**

```
GET /follow/12345
```

**Example Response:**

```json
{
  "message": "Followed HN item 12345",
  "item": {
    "id": 12345,
    "comments": 10,
    "url": "https://news.ycombinator.com/item?id=12345"
  }
}
```

### GET /unfollow/:id

Unfollow a previously followed Hacker News item.

**Parameters:**

- `id` (required): The ID of the Hacker News item to unfollow.

**Example Request:**

```
GET /unfollow/12345
```

**Example Response:**

```json
{
  "message": "Unfollowed HN item 12345"
}
```

### GET /get/:id

Retrieve details about a specific Hacker News item.

**Parameters:**

- `id` (required): The ID of the Hacker News item to retrieve.

**Example Request:**

```
GET /get/12345
```

**Example Response:**

```json
{
  "id": 12345,
  "comments": 15,
  "url": "https://news.ycombinator.com/item?id=12345"
}
```

### GET /list

List all Hacker News items you're currently following.

**Example Request:**

```
GET /list
```

**Example Response:**

```json
[
  {
    "id": 12345,
    "comments": 15,
    "url": "https://news.ycombinator.com/item?id=12345"
  },
  {
    "id": 67890,
    "comments": 8,
    "url": "https://news.ycombinator.com/item?id=67890"
  }
]
```

### GET /check

Check for new comments on all items you're following.

**Example Request:**

```
GET /check
```

**Example Response:**

```json
[
  {
    "id": 12345,
    "newComments": 5,
    "url": "https://news.ycombinator.com/item?id=12345",
    "notification": true,
    "type": "story",
    "title": "Example Story Title"
  },
  {
    "id": 67890,
    "newComments": 0,
    "url": "https://news.ycombinator.com/item?id=67890",
    "notification": false,
    "type": "comment",
    "text": "Example comment text",
    "parent": 54321
  }
]
```

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests. In case of an error, the response will include a JSON object with an error message.

**Example Error Response:**

```json
{
  "error": "Item not found"
}
```

Common error codes:

- 400: Bad Request (e.g., invalid ID format)
- 404: Not Found (e.g., item not being followed)
- 500: Internal Server Error

## Rate Limiting

The API does not currently implement rate limiting. However, please be considerate and avoid making excessive requests in a short period.

## Data Types

### HNItem

```typescript
type HNItem = {
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
```

### NotificationResponse

```typescript
type NotificationResponse = {
  id: number;
  newComments: number;
  url: string;
  notification: boolean;
  type?: "job" | "story" | "comment" | "poll" | "pollopt";
  text?: string;
  title?: string;
  parent?: number;
};
```

### FollowedItem

```typescript
type FollowedItem = {
  key: string;
  id: number;
  comments: number;
  url: string;
};
```

## Conclusion

This API reference provides all the necessary information to interact with the HN Notifier API. If you have any questions or need further clarification, please don't hesitate to reach out to our support team.