# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HN Notifier is a Cloudflare Workers service that allows users to follow Hacker News items (stories, comments) and track new comments. The service stores followed items in Cloudflare KV and provides REST endpoints for managing follows and checking for updates.

**Tech Stack:**
- Cloudflare Workers (serverless runtime)
- Hono (web framework)
- Bun (runtime, bundler, test runner)
- TypeScript
- Biome (formatter/linter)

## Development Commands

```bash
# Install dependencies
bun install

# Run local development server (uses remote Cloudflare resources)
bun run dev
# Development server runs on localhost:8787

# Run tests
bun test

# Format and lint code
bunx @biomejs/biome format --write .
bunx @biomejs/biome check --write .

# Deploy to Cloudflare
bun run deploy
```

## Code Architecture

### Core Files Structure

- **src/index.ts**: Main application entry point with Hono route definitions
- **src/utils.ts**: Utility functions for HN API interaction, KV operations, and notification formatting
- **src/types.ts**: TypeScript type definitions for the entire application
- **src/utils.test.ts**: Comprehensive test suite using Bun's test runner

### Key Architectural Patterns

**KV Storage Pattern:**
- All followed items are stored in Cloudflare KV with keys prefixed by `hn_`
- Format: `hn_{itemId}` → stored value is the last known comment count (as string)
- Example: `hn_38102234` → `"123"`

**Data Flow for Following an Item:**
1. Validate HN item ID from URL params using Zod schema
2. Fetch item from HN Firebase API to validate it exists
3. Extract current comment count from `kids` array length
4. Store in KV: `hn_{id}` → `"{commentCount}"`

**Data Flow for Checking Updates:**
1. List all keys with `hn_` prefix from KV
2. For each followed item:
   - Fetch current state from HN API
   - Compare stored comment count with current `kids.length`
   - If increased, update KV and return notification object
3. Return array of notifications (includes items with 0 new comments)

**Type System:**
- `HNItem`: Matches HN Firebase API response structure
- `FollowedItem`: Internal representation combining KV data with metadata
- `NotificationResponse`: Standardized response for comment updates
- `Env`: Type-safe binding for Cloudflare Workers environment (KV namespace)

### Testing Approach

Tests use Bun's built-in test runner with:
- Module mocking for `@better-fetch/fetch` (HN API calls)
- Mock KV namespace implementation
- Mock Hono context with environment bindings
- Spy pattern for `console.error` in error handling tests

**Test Coverage:**
- URL generation and formatting
- Error handling for various input types
- HN API validation and fetching
- KV update operations
- Notification creation logic with edge cases (no kids, missing type, etc.)

## Cloudflare Workers Specifics

**Environment Bindings:**
The `c.env` object in Hono context provides access to Cloudflare bindings. Currently defined:
- `c.env.following`: KVNamespace for storing followed items

**KV Namespace Configuration:**
KV namespaces must be configured in `wrangler.toml` (not committed to repo). Example structure:
```toml
kv_namespaces = [
  { binding = "following", id = "...", preview_id = "..." }
]
```

**Development Notes:**
- `bun run dev` uses `--remote` flag, meaning it connects to actual Cloudflare resources (not local simulation)
- KV operations during development hit the preview KV namespace

## Code Style

**Biome Configuration:**
- Tabs for indentation
- Double quotes for strings
- Organize imports enabled
- Recommended linter rules active

**Key Conventions:**
- Async/await for all external operations (HN API, KV)
- Explicit error handling with `handleError()` utility
- Type safety enforced throughout (no implicit `any`)
- Request validation using Zod schemas at route level
