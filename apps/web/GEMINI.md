# QnOffice Web Application Context

## Project Overview

This directory contains the `web` application for the **QN Office Management System**. It is a **Next.js 16** project using **React 19**, built within an **Nx workspace** environment (referencing local libraries via `../../libs`).

The application handles office management features such as authentication, dashboarding, staff management, penalties, auditing, and more.

## Technology Stack

*   **Framework**: Next.js 16 (App Router)
*   **Language**: TypeScript 5+ (Strict mode)
*   **Styling**: Tailwind CSS v4, Lucide React (Icons)
*   **UI Library**: shadcn/ui (Radix UI primitives)
*   **State Management / Data Fetching**: TanStack Query (React Query) v5
*   **Forms**: React Hook Form + Zod validation
*   **Authentication**: Iron Session (Server-side session management)
*   **HTTP Client**: Axios (implied by usage in services)

## Architecture & Directory Structure

The project follows a `src` directory structure with specific conventions:

### `src/`

*   **`app/`**: Next.js App Router pages and layouts.
    *   `api/`: Next.js API Routes (proxies, auth handlers).
    *   `dashboard/`: Main application interface (protected routes).
    *   `auth/`: Authentication pages (login, error).
*   **`components/`**: React components.
    *   `ui/`: Shared, generic UI components (mostly shadcn/ui).
    *   `[feature]/`: Feature-specific components (e.g., `audit-logs`, `branches`, `staff`).
*   **`shared/`**: Shared logic and utilities (a key architectural pattern here).
    *   `auth/`: Authentication logic and permission hooks.
    *   `config.ts`: Centralized environment configuration.
    *   `constants/`: App-wide constants and API paths.
    *   `contexts/`: React Contexts (e.g., `AuthContext`).
    *   `hooks/`: Custom React hooks.
    *   `lib/`: Utility libraries (e.g., base services).
    *   `providers/`: Global providers (QueryProvider).
    *   `services/`: Business logic, separated into `client` and `server`.
    *   `types/`: TypeScript type definitions.
    *   `utils/`: Helper functions.

### Workspace Integration

*   **`@qnoffice/shared`**: Mapped to `../../libs/src/index.ts` in `tsconfig.json`. This implies shared code exists in a sibling directory outside this project root.

## Development Workflow

### Commands

*   **Development Server**: `npm run dev` (Runs `next dev`)
*   **Build**: `npm run build` (Runs `next build`)
*   **Start Production**: `npm run start` (Runs `next start`)
*   **Lint**: `npm run lint` (Runs `eslint`)
*   **Type Check**: `npx tsc --noEmit` (via `project.json` targets)

### Configuration

*   **Environment Variables**: Managed via `.env` (see `.env.example`).
*   **Config Access**: Access configuration through `src/shared/config.ts`. Do not use `process.env` directly in application code if possible; use the typed config object.

## Coding Conventions

*   **Path Aliases**: Extensive use of path aliases defined in `tsconfig.json`:
    *   `@/*` -> `src/*`
    *   `@/components/*` -> `src/components/*`
    *   `@/hooks/*` -> `src/shared/hooks/*`
    *   (and many others under `src/shared/*`)
*   **Component Location**: Place reusable generic components in `components/ui` and feature-specific components in `components/[feature-name]`.
*   **Data Fetching**: Use custom hooks wrapping TanStack Query for data fetching.
*   **Styling**: Use Tailwind CSS utility classes. Avoid CSS files where possible (except global styles).
*   **Validation**: Use Zod schemas for form validation and API response parsing.
