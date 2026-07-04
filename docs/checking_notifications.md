---
title: Checking Notifications for Followed Hacker News Items
description: A guide on how to check for notifications on followed Hacker News items using the API.
---

# Checking Notifications for Followed Hacker News Items

## Introduction

This guide explains how to check for notifications on Hacker News items you're following. You'll learn how to use the API to check for new comments, interpret the API response, and understand best practices for polling.

## Checking for New Comments

To check for new comments on the Hacker News items you're following, you can use the `/check` endpoint of the API. This endpoint will return information about new comments for all the items you're currently following.

### Making the API Request

To check for notifications, send a GET request to the `/check` endpoint:

```http
GET /check
```

### Interpreting the API Response

The API will respond with an array of `NotificationResponse` objects. Each object represents a followed item that has new comments. Here's an example of what the response might look like:

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
    "newComments": 3,
    "url": "https://news.ycombinator.com/item?id=67890",
    "notification": true,
    "type": "comment"
  }
]
```

Each `NotificationResponse` object contains the following fields:

- `id`: The Hacker News item ID
- `newComments`: The number of new comments since you last checked
- `url`: The URL to view the item on Hacker News
- `notification`: A boolean indicating whether there are new comments (always true for items in this response)
- `type`: The type of the item ("story" or "comment")
- `title`: The title of the story (only present for items of type "story")

## Best Practices for Polling

When checking for notifications, it's important to follow best practices to avoid overloading the API or your own server. Here are some recommendations:

1. **Implement rate limiting**: Avoid making too many requests in a short period. A reasonable interval might be once every 5-15 minutes, depending on your use case.

2. **Use caching**: Store the last check time and only make new requests after a certain interval has passed.

3. **Handle errors gracefully**: If the API returns an error, implement exponential backoff before retrying.

4. **Process all notifications**: When you receive notifications, make sure to process all of them to avoid missing updates in subsequent checks.

## Implementation Example

Here's a simple example of how you might implement notification checking in JavaScript:

```javascript
async function checkNotifications() {
  try {
    const response = await fetch('https://your-api-url.com/check');
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    const notifications = await response.json();
    
    notifications.forEach(notification => {
      console.log(`New comments for item ${notification.id}: ${notification.newComments}`);
      console.log(`View at: ${notification.url}`);
    });
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

// Check notifications every 15 minutes
setInterval(checkNotifications, 15 * 60 * 1000);
```

## Conclusion

By using the `/check` endpoint and following these best practices, you can efficiently monitor new comments on the Hacker News items you're following. Remember to handle the API responses appropriately and implement proper error handling and rate limiting in your application.