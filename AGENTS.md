<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

# Project Coding Standards

## Type Management

- All shared types should be defined in `/libs/src/types/`
- Common enums should be defined in `/libs/src/enums/`
- Import types from `@qn-utilities/shared` package
- Never duplicate type definitions across apps

## Pagination

- Always use base pagination utilities from `@/shared/lib/base-paginated-service`
- Use `getServerPaginationParams` for server-side pagination
- All list APIs must implement pagination
- Follow the standard pagination response structure with `result`, `page`, `pageSize`, `total`

## Database (TypeORM)

- Do not use QueryBuilder
- Prefer repository methods with `find`, `findOne`, `save`, `update`, `delete`
- Use relation loading with `relations` option
- Use `where` conditions for filtering

## Code Style

- Do not add comments in code
- Code should be self-documenting with clear variable and function names
- Remove all TODO, FIXME, or explanatory comments

## Frontend Architecture

### API Handling

- Prefer server-side data fetching in Next.js
- Use Next.js API routes (`/app/api/`) as proxy to backend
- Fetch data in Server Components using server services
- Pass data as props to Client Components
- Client-side API calls should go through Next.js API routes, not directly to backend

### Data Fetching Pattern

```typescript
// Server Component (page.tsx)
export default async function Page({ searchParams }) {
  const params = getServerPaginationParams(searchParams);
  const response = await serverService.getAll(params);
  return <ClientComponent data={response.result} pagination={...} />
}
```

## Backend Architecture

### Controller Standards

- All list endpoints must support pagination
- Use DTOs for validation
- Return standardized response format

### Service Standards

- Use repository pattern
- Keep business logic in services
- Use TypeORM repository methods, not QueryBuilder
