# HN Notifier

## Project Description
HN Notifier is a service that allows users to "follow" Hacker News (HN) items (stories, comments, polls, etc.) and receive notifications when new comments are posted on those items. It's built to run on Cloudflare Workers.

## Features
- Follow HN items to track new comments.
- Unfollow HN items to stop tracking.
- Check for new comments on followed items.
- Simple API for integration with other services or for direct use.

## API Endpoints

### Follow an Item
- **Method & Path**: `POST /follow/:id`
- **Description**: Starts following an HN item. The item ID is fetched from the official HN API to ensure it's a valid item.
- **Parameters**:
    - `:id` (path): The ID of the HN item to follow.
- **Example Request**:
  ```bash
  curl -X POST https://<YOUR_WORKER_URL>/follow/38102234
  ```
- **Example Success Response** (`200 OK`):
  ```json
  {
    "status": "success",
    "message": "Successfully followed item 38102234. Current comment count: 123. New comments will be checked from now on."
  }
  ```
- **Example Error Response** (`400 Bad Request` - Invalid ID, `404 Not Found` - Item not found on HN, `500 Internal Server Error`):
  ```json
  {
    "status": "error",
    "message": "Invalid item ID format."
  }
  ```
  ```json
  {
    "status": "error",
    "message": "Item 38102234 not found on Hacker News."
  }
  ```

### Unfollow an Item
- **Method & Path**: `POST /unfollow/:id`
- **Description**: Stops following an HN item.
- **Parameters**:
    - `:id` (path): The ID of the HN item to unfollow.
- **Example Request**:
  ```bash
  curl -X POST https://<YOUR_WORKER_URL>/unfollow/38102234
  ```
- **Example Success Response** (`200 OK`):
  ```json
  {
    "status": "success",
    "message": "Successfully unfollowed item 38102234."
  }
  ```
- **Example Error Response** (`400 Bad Request` - Invalid ID, `404 Not Found` - Item not currently followed):
  ```json
  {
    "status": "error",
    "message": "Invalid item ID format."
  }
  ```
  ```json
  {
    "status": "error",
    "message": "Item 38102234 is not currently followed."
  }
  ```

### Check for New Comments (Manual Trigger - Primarily for a scheduled CRON)
- **Method & Path**: `GET /check`
- **Description**: This endpoint is intended to be called by a Cloudflare Worker CRON trigger. It checks all followed items for new comments since the last check. If new comments are found, it would typically send a notification (details of notification mechanism depend on further implementation, e.g., email, webhook).
- **Parameters**: None.
- **Example Request**:
  ```bash
  curl https://<YOUR_WORKER_URL>/check
  ```
- **Example Success Response** (`200 OK` - new comments found and processed):
  ```json
  {
    "status": "success",
    "message": "Checked 5 items. Found new comments on 2 items.",
    "details": [
      { "itemId": "38102234", "newCommentCount": 5, "status": "processed" },
      { "itemId": "38102235", "newCommentCount": 0, "status": "no new comments" },
      { "itemId": "38102236", "newCommentCount": 12, "status": "processed" }
    ]
  }
  ```
- **Example Success Response** (`200 OK` - no new comments found):
  ```json
  {
    "status": "success",
    "message": "Checked 5 items. No new comments found on any followed items."
  }
  ```
- **Example Error Response** (`500 Internal Server Error`):
  ```json
  {
    "status": "error",
    "message": "An error occurred while checking for new comments."
  }
  ```

### List Followed Items
- **Method & Path**: `GET /followed`
- **Description**: Retrieves a list of all HN items currently being followed.
- **Parameters**: None.
- **Example Request**:
  ```bash
  curl https://<YOUR_WORKER_URL>/followed
  ```
- **Example Success Response** (`200 OK`):
  ```json
  {
    "status": "success",
    "data": [
      { "itemId": "38102234", "followedAt": "2023-10-27T10:00:00Z", "lastKnownCommentCount": 123 },
      { "itemId": "38102236", "followedAt": "2023-10-27T10:05:00Z", "lastKnownCommentCount": 50 }
    ]
  }
  ```
  _Note: `lastKnownCommentCount` reflects the count when the item was followed or last checked._
- **Example Error Response** (`500 Internal Server Error`):
  ```json
  {
    "status": "error",
    "message": "An error occurred while retrieving the list of followed items."
  }
  ```

## Technologies Used
- **Cloudflare Workers**: Serverless execution environment.
- **Hono**: Lightweight, fast web framework for Cloudflare Workers.
- **Zod**: TypeScript-first schema declaration and validation.
- **TypeScript**: Typed superset of JavaScript.
- **Bun**: JavaScript runtime, bundler, and package manager (for local development).

## Configuration

The primary configuration for the Cloudflare Worker, including KV namespace bindings, is managed through the `wrangler.toml` file. When you create a KV namespace using `wrangler kv:namespace create "following"`, Wrangler automatically adds its ID to `wrangler.toml` for the `main` environment and a `preview_id` for local development.

Example snippet from `wrangler.toml`:
```toml
# Top-level configuration or within an [env.your_env_name] section
kv_namespaces = [
  { binding = "following", id = "YOUR_KV_NAMESPACE_ID_HERE", preview_id = "YOUR_PREVIEW_KV_NAMESPACE_ID_HERE" }
]
```

**Production Configuration:**

For production environments, it is highly recommended to manage sensitive IDs like KV namespace IDs using secrets or environment variables rather than committing them directly to `wrangler.toml`. This enhances security and flexibility.

You can achieve this by referencing environment variables within your `wrangler.toml` file. These variables can then be set in your Cloudflare dashboard (under Worker > Settings > Variables) or via Wrangler CLI secrets.

**Example using Environment Variables in `wrangler.toml`:**
```toml
# wrangler.toml

# For the main (production) environment
[env.production.kv_namespaces]
# The binding name 'following' must match what your code expects (e.g., c.env.following)
binding = "following"
id = "$KV_FOLLOWING_PROD_ID" # Variable for production ID

# For local development/preview, Wrangler often uses a 'preview_id'.
# If you want to use a specific KV for all local/dev, you might configure it like this:
[env.dev.kv_namespaces] # Example for a 'dev' environment or adjust for default local behavior
binding = "following"
id = "$KV_FOLLOWING_DEV_ID" # Variable for a specific dev KV namespace ID
# Alternatively, for default 'wrangler dev' which uses 'preview_id':
# If your main kv_namespaces entry looks like:
# kv_namespaces = [ { binding = "following", preview_id = "$KV_FOLLOWING_PREVIEW_ID" } ]
# Then set KV_FOLLOWING_PREVIEW_ID as a secret or environment variable.
```

**Managing Secrets:**

You can set these environment variables as secrets using the Wrangler CLI:
```bash
wrangler secret put KV_FOLLOWING_PROD_ID
# wrangler will then prompt you to enter the value for the secret.
# Repeat for KV_FOLLOWING_DEV_ID or KV_FOLLOWING_PREVIEW_ID as needed.
```
These secrets are encrypted and stored by Cloudflare. Your worker will have access to them at runtime. Ensure the variables in `wrangler.toml` (e.g., `"$KV_FOLLOWING_PROD_ID"`) match the secret names you define.

By using environment variables or secrets:
- You avoid hardcoding sensitive IDs in your version-controlled `wrangler.toml`.
- You can easily use different KV namespaces for different environments (dev, staging, prod) by setting the appropriate environment variables/secrets for each.
- You can update KV namespace IDs without code changes and redeployments if your `wrangler.toml` is already set up to use variables.

Refer to the official Cloudflare Wrangler documentation for the most up-to-date practices on configuration and secrets management.

## Setup and Deployment

### Development
To run the project locally for development:
```bash
bun install
bun run dev
```
This will typically start a development server on `localhost:8787`.

### Deploy
To deploy the worker to your Cloudflare account:
```bash
bun run deploy
```
This command uses `wrangler` (Cloudflare's CLI tool) to publish the worker. Ensure you have `wrangler` configured and authenticated with your Cloudflare account. You might need to edit `wrangler.toml` to set your account ID and worker name.
