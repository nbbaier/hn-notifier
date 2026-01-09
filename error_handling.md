---
title: Error Handling in HN Notifier API
description: A guide to handling errors when using the HN Notifier API, including common error codes, their meanings, and suggested actions.
---

# Error Handling in HN Notifier API

## Introduction

This guide provides information on how to handle errors when using the HN Notifier API. Understanding and properly handling errors is crucial for building robust applications that interact with our API. We'll cover common error codes, their meanings, and suggested actions to resolve issues.

## Error Response Format

When an error occurs, the API returns a JSON object with a `message` property containing a description of the error. The HTTP status code of the response indicates the type of error.

Example error response:

```json
{
  "message": "Error message describing the issue"
}
```

## Common Error Codes and Their Meanings

### 400 Bad Request

This error occurs when the request is invalid or cannot be served. It's often due to missing or invalid parameters.

Common causes:
- Invalid item ID format
- Trying to follow an invalid HN item

Example:

```json
{
  "message": "HN item 12345 is not a valid item"
}
```

Suggested action: Check the request parameters and ensure they are valid and properly formatted.

### 404 Not Found

This error occurs when the requested resource is not found.

Common causes:
- Trying to unfollow an item that is not being followed

Example:

```json
{
  "message": "Not following HN item 12345"
}
```

Suggested action: Verify that the item ID is correct and that you're actually following the item before attempting to unfollow it.

### 500 Internal Server Error

This error indicates that the server encountered an unexpected condition that prevented it from fulfilling the request.

Example:

```json
{
  "message": "An unexpected error occurred."
}
```

Suggested action: If you encounter this error, please report it to our support team along with the steps to reproduce the issue.

## Handling Errors in Your Application

To properly handle errors in your application, we recommend implementing the following practices:

1. Always check the HTTP status code of the response.
2. Parse the error message from the JSON response.
3. Implement appropriate error handling logic based on the status code and error message.

Here's an example of how you might handle errors in JavaScript:

```javascript
async function makeApiRequest(endpoint) {
  try {
    const response = await fetch(`https://api.hnnotifier.com${endpoint}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.message}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error:', error.message);
    // Handle the error appropriately in your application
  }
}
```

## Conclusion

By properly handling errors, you can create a more robust and user-friendly application that interacts seamlessly with the HN Notifier API. If you encounter any errors that are not covered in this guide or need further assistance, please don't hesitate to contact our support team.