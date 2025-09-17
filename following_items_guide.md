---
title: Following Items Guide
description: A guide on how to follow and unfollow Hacker News items using the API
---

# Following Items Guide

This guide explains how to follow and unfollow Hacker News items using the API. You'll learn how to track specific items and receive notifications about new comments.

## Table of Contents

1. [Introduction](#introduction)
2. [Following an Item](#following-an-item)
3. [Unfollowing an Item](#unfollowing-an-item)
4. [Checking Followed Items](#checking-followed-items)
5. [Error Handling](#error-handling)

## Introduction

The API allows you to follow specific Hacker News items and receive updates about new comments. This feature is useful for tracking discussions on interesting topics or your own submissions.

## Following an Item

To follow a Hacker News item, you need to make a GET request to the `/follow/:id` endpoint, where `:id` is the ID of the Hacker News item you want to follow.

### Example API Call

```
GET /follow/12345
```

### Process

1. The API validates the provided ID.
2. It checks if the item is already being followed.
3. If not, it fetches the item's data from the Hacker News API.
4. The item is then added to your list of followed items.

### Response

A successful follow request will return a JSON response with a 201 status code:

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

If you're already following the item, you'll receive a 200 status code with a message indicating that.

## Unfollowing an Item

To unfollow a Hacker News item, make a GET request to the `/unfollow/:id` endpoint, where `:id` is the ID of the item you want to unfollow.

### Example API Call

```
GET /unfollow/12345
```

### Process

1. The API validates the provided ID.
2. It checks if the item is currently being followed.
3. If it is, the item is removed from your list of followed items.

### Response

A successful unfollow request will return a JSON response with a 200 status code:

```json
{
  "message": "Unfollowed HN item 12345"
}
```

If you're not following the item, you'll receive a 404 status code with a message indicating that.

## Checking Followed Items

You can check the items you're following and any new comments using two endpoints:

1. `/list`: Lists all items you're following
2. `/check`: Checks for new comments on followed items

### Listing Followed Items

To get a list of all items you're following, make a GET request to the `/list` endpoint.

```
GET /list
```

This will return an array of followed items with their details.

### Checking for New Comments

To check for new comments on your followed items, make a GET request to the `/check` endpoint.

```
GET /check
```

This will return an array of notifications for items with new comments.

## Error Handling

The API uses standardized error handling. If an error occurs, you'll receive a JSON response with an error message and an appropriate HTTP status code.

Common error scenarios include:

- Invalid item ID (400 Bad Request)
- Item not found (404 Not Found)
- Server errors (500 Internal Server Error)

Always check the response status code and message to handle errors appropriately in your application.

---

By following this guide, you can effectively use the API to follow, unfollow, and track Hacker News items. This allows you to stay updated on discussions that interest you without constantly checking the Hacker News website.