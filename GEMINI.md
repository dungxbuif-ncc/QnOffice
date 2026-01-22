# QN Office Management System (QnOffice) - Project Context

## Overview
**QnOffice** is a comprehensive office management system designed to handle administrative tasks such as pantry transactions, cleaning schedules, open talk event management, staff tracking, and penalty management. It integrates a Web Portal and a Mezon Bot for seamless interaction.

The project is structured as an **Nx Monorepo**, containing both the frontend (Web) and backend (API/Bot) applications, along with shared libraries.

## Architecture & Tech Stack

### Workspace
*   **Manager:** [Nx](https://nx.dev/)
*   **Package Manager:** Yarn (`yarn@1.22.19`) / NPM
*   **Structure:**
    *   `apps/web`: Frontend application (Next.js).
    *   `apps/be`: Backend application (NestJS). **Note:** Referred to as `api` in Nx projects.
    *   `libs/`: Shared libraries used by both applications.
    *   `docs/`: Detailed system documentation.

### Frontend (`apps/web`)
*   **Framework:** Next.js (React)
*   **Styling:** TailwindCSS
*   **Language:** TypeScript

### Backend (`apps/be` - Nx Project: `api`)
*   **Framework:** NestJS
*   **ORM:** TypeORM
*   **Database:** PostgreSQL
*   **Integration:** Mezon SDK (for Chat Bot)
*   **Key Modules:** Staff, Cleaning, Opentalk, Penalty, Order, Bot.

## Key Operational Commands

### Development
Run these commands from the root directory:

*   **Start All Services:**
    ```bash
    npm run dev
    # OR
    nx run-many --target=dev --all
    ```

*   **Start Frontend (Web) Only:**
    ```bash
    npm run dev:web
    # OR
    nx dev web
    ```

*   **Start Backend (API) Only:**
    ```bash
    npm run dev:api
    # OR
    nx dev api
    ```

*   **Start Bot (Backend) Only:**
    ```bash
    nx dev:bot api
    # OR (inside apps/be)
    npm run dev:bot
    ```

### Building
*   **Build All:**
    ```bash
    npm run build
    ```
*   **Build Specific App:**
    ```bash
    nx build web
    nx build api
    ```

### Database Management (Backend)
Database commands are primarily executed within the `apps/be` context or via npm scripts wrapping them.

*   **Run Migrations:**
    ```bash
    nx migrate api
    # OR (inside apps/be)
    npm run migrate
    ```

*   **Generate Migration:**
    ```bash
    # (Inside apps/be)
    npm run migration:generate --name=NameOfMigration
    ```

*   **Seed Database:**
    ```bash
    # (Inside apps/be)
    npm run seed
    ```

### Linting & Testing
*   **Lint All:** `npm run lint`
*   **Test All:** `npm run test`

## Infrastructure & Docker

*   **Docker Compose:** `docker-compose.yml` defines the `backend` and `frontend` services for containerized execution.
    *   **Note:** The root `docker-compose.yml` currently defines app services but *does not* appear to include a PostgreSQL database service, despite the README mentioning `docker-compose up -d db`. Ensure a local PostgreSQL instance is running and configured in `.env` or `apps/be/.env` before starting the backend.

## Documentation References
Detailed documentation is available in the `docs/` directory:
*   `docs/SYSTEM_OVERVIEW.md`: High-level architecture.
*   `docs/AUTHENTICATION.md`: Auth flows (Mezon OAuth).
*   `docs/BOT_FEATURES.md`: Bot specific features and commands.
*   `docs/CRON_SYSTEM.md`: Scheduled tasks (Cron) details.
*   `docs/CODING_STANDARDS.md`: Project coding guidelines.

## Directory Map
*   `apps/be/src/modules`: Backend feature modules.
*   `apps/be/src/bot`: Bot handler logic.
*   `apps/web/src/app`: Frontend pages (App Router).
*   `apps/web/src/components`: Frontend UI components.
*   `libs/src`: Shared code (Types, DTOs, Utils).
