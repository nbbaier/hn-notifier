# Agent Instructions

Guidance for AI coding agents working in this repository.

## Project Overview

HN Notifier is a Cloudflare Workers service that lets users "follow" Hacker News items (stories, comments, polls) and track new comments. Followed items are stored in Cloudflare KV, and REST endpoints manage follows and check for updates.

**Tech Stack:**
- Cloudflare Workers (serverless runtime)
- Hono (web framework)
- Bun (runtime, bundler, test runner)
- TypeScript
- Biome (formatter/linter)

## Commands

```bash
bun install                              # Install dependencies
bun run dev                              # Dev server → wrangler dev --remote (localhost:8787)
bun test                                 # Run all tests
bun test src/utils.test.ts               # Run a single test file
bunx @biomejs/biome check --write .      # Lint + apply safe fixes
bunx @biomejs/biome format --write .     # Format
bun run deploy                           # Deploy → wrangler deploy --minify
```

`bun run dev` uses the `--remote` flag, so it connects to actual Cloudflare resources (not local simulation); KV operations during development hit the preview KV namespace.

## Code Architecture

### Core files

- **src/index.ts**: Application entry point with Hono route definitions
- **src/utils.ts**: HN API interaction, KV operations, and notification formatting
- **src/types.ts**: TypeScript type definitions for the entire application
- **src/utils.test.ts**: Test suite using Bun's test runner

### KV storage pattern

- Followed items are stored in Cloudflare KV with keys prefixed by `hn_`
- Format: `hn_{itemId}` → last known comment count (as a string)
- Example: `hn_38102234` → `"123"`

### Data flow — following an item

1. Validate the HN item ID from URL params using a Zod schema
2. Fetch the item from the HN Firebase API to confirm it exists
3. Extract the current comment count from `kids` array length
4. Store in KV: `hn_{id}` → `"{commentCount}"`

### Data flow — checking updates

1. List all keys with the `hn_` prefix from KV
2. For each followed item: fetch current state, compare stored count with current `kids.length`, and if increased, update KV and return a notification object
3. Return an array of notifications (includes items with 0 new comments)

### Type system

- `HNItem`: Matches the HN Firebase API response structure
- `FollowedItem`: Internal representation combining KV data with metadata
- `NotificationResponse`: Standardized response for comment updates
- `Env`: Type-safe binding for the Cloudflare Workers environment (KV namespace)

## Cloudflare Workers Specifics

**Environment bindings:** The `c.env` object in Hono context exposes Cloudflare bindings. Currently `c.env.following` is the `KVNamespace` for storing followed items.

**KV namespace configuration:** KV namespaces are configured in `wrangler.toml` (not committed to the repo):

```toml
kv_namespaces = [
  { binding = "following", id = "...", preview_id = "..." }
]
```

## Testing

Tests use Bun's built-in test runner with:
- Module mocking for `@better-fetch/fetch` (HN API calls)
- A mock KV namespace implementation
- A mock Hono context with environment bindings
- A spy on `console.error` for error-handling tests

Coverage spans URL generation/formatting, error handling for varied inputs, HN API validation/fetching, KV update operations, and notification creation edge cases (no kids, missing type, etc.).

## Code Style

- **Formatter**: Biome — tab indentation, double quotes, organize-imports enabled, recommended lint rules active
- **Imports**: Organized automatically by Biome; use explicit imports from files
- **Types**: Strict TypeScript; use the proper types from `src/types.ts`; no implicit `any`
- **Naming**: camelCase for variables/functions, PascalCase for types/interfaces
- **Comments**: JSDoc for exported functions; no inline comments unless necessary
- **Error handling**: Use the `handleError()` utility for consistent error responses (`{ message: string }`)
- **Async**: async/await for all external operations (HN API, KV)
- **Validation**: Zod schemas at the route level

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (`nbbaier/hn-notifier`) via the `gh` CLI. External PRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
