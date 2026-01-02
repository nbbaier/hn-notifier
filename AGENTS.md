# Agent Instructions

## Commands
- **Test**: `bun test` - Run all tests, or `bun test src/utils.test.ts` for single file
- **Lint**: `npx @biomejs/biome check src/` - Check code style and linting
- **Format**: `npx @biomejs/biome format --write src/` - Auto-format code
- **Dev**: `wrangler dev --remote` - Start development server
- **Deploy**: `wrangler deploy --minify` - Deploy to production

## Code Style
- **Formatter**: Biome with tab indentation, double quotes
- **Imports**: Organized automatically by Biome, use explicit imports from files
- **Types**: Strict TypeScript enabled, use proper types from `src/types.ts`
- **Error Handling**: Use `handleError()` utility for consistent error responses
- **Comments**: JSDoc comments for exported functions, no inline comments unless necessary
- **Naming**: camelCase for variables/functions, PascalCase for types/interfaces

## Architecture
- **Framework**: Hono.js with Cloudflare Workers
- **Storage**: KV namespace "following" for tracking followed HN items
- **External API**: Hacker News Firebase API
- **Key Pattern**: `hn_${itemId}` for storing followed items
- **Response Format**: JSON with consistent error structure `{ message: string }`