# HN Notifier - Codebase Overview

**Last Updated:** November 20, 2025

## Project Summary
HN Notifier is a Cloudflare Worker service that tracks Hacker News items (stories, comments, polls) and notifies users when new comments are posted. It uses KV storage to persist followed items and the HN Firebase API to fetch real-time data.

## Architecture Overview

### Core Components
- **Entry Point**: `src/index.ts` - Hono.js web framework setup with 5 main endpoints
- **Types**: `src/types.ts` - TypeScript definitions for HN items, responses, and environment bindings
- **Utilities**: `src/utils.ts` - Helper functions for HN API calls, error handling, and notification formatting
- **Storage**: Cloudflare KV namespace "following" with key pattern `hn_${itemId}`

### API Endpoints
1. `GET /` - Lists available routes
2. `GET /follow/:id` - Follow an HN item (stores current comment count)
3. `GET /unfollow/:id` - Stop following an HN item
4. `GET /get/:id` - Get details of a followed item
5. `GET /list` - List all followed items with their comment counts
6. `GET /check` - Check all followed items for new comments (intended for CRON)

### Data Flow
1. User follows item → Validate HN item exists → Store comment count in KV
2. Check endpoint runs → Fetch current HN data → Compare comment counts → Return notifications for items with new comments
3. All responses follow consistent JSON format with `{ message: string }` for errors

### Key Patterns
- **Error Handling**: Centralized via `handleError()` utility function
- **HN API Integration**: Uses `better-fetch` for Firebase API calls
- **Type Safety**: Strict TypeScript with Zod validation for route parameters
- **Storage**: Simple KV store storing comment counts as strings

## Development Commands
- `bun test` - Run tests
- `npx @biomejs/biome check src/` - Lint code
- `wrangler dev --remote` - Start dev server
- `wrangler deploy --minify` - Deploy to production

## First Tasks When Resuming
1. **Check KV namespace**: Verify `following` KV binding is properly configured in `wrangler.jsonc`
2. **Test HN API integration**: Run `/check` endpoint to ensure HN Firebase API is accessible
3. **Add notification mechanism**: Currently returns JSON notifications - implement email/webhook delivery
4. **Add CRON trigger**: Set up scheduled checks (currently manual via `/check` endpoint)
5. **Enhance error handling**: Add retry logic for HN API failures
6. **Add rate limiting**: Prevent abuse of follow/unfollow endpoints

## Code Style Notes
- Biome formatter with tabs, double quotes
- JSDoc comments for exported functions
- camelCase for variables, PascalCase for types
- Explicit imports from files (auto-organized by Biome)