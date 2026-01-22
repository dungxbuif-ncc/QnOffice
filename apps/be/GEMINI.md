# Project Context: QN Official API

## Overview
This is the backend repository for **QnOffice** (`qn-official-api`), a NestJS application designed to manage various office administrative tasks and integrate with the Mezon chat platform. It handles functionalities like staff management, cleaning schedules, opentalk events, holidays, penalties, pantry orders, and audit logging.

## Tech Stack
*   **Framework:** [NestJS](https://nestjs.com/) (Node.js)
*   **Database:** PostgreSQL
*   **ORM:** TypeORM (with `typeorm-transactional`)
*   **Chat Integration:** Mezon SDK (via custom `@src/libs/nezon` wrapper)
*   **Authentication:** JWT, Passport
*   **Other Services:** AWS S3 (storage), SendGrid (email)

## Architecture
The project follows a standard NestJS modular architecture:
*   **`src/app.module.ts`**: The root module aggregating all feature modules.
*   **`src/modules/`**: Contains domain-specific modules (e.g., `auth`, `cleaning`, `opentalk`, `staff`, `order`, `penalty`).
*   **`src/bot/`**: Dedicated module for Bot/Chat interactions (`ChannelMessageHandler`, `OrderHandler`, etc.).
*   **`src/common/`**: Shared resources (configs, constants, database setup, filters, guards).
*   **`libs/`**: Local libraries, specifically `nezon` for Mezon integration.
*   **`migrations/`**: Database migration files.

## Key Directories
*   `src/modules`: Feature implementation (Controllers, Services, Entities).
*   `src/bot`: Bot event handlers and logic.
*   `src/common/database`: Database configuration and base entities (`abstract.entity.ts`).
*   `src/common/configs`: Configuration loaders (e.g., `boostrap-config.ts`).

## Development Workflow

### Prerequisites
*   Node.js & npm/yarn
*   PostgreSQL instance

### Key Commands
*   **Start Dev Server:** `npm run dev` (or `nest start --debug --watch`)
*   **Start Bot Dev:** `npm run dev:bot`
*   **Build:** `npm run build`
*   **Lint:** `npm run lint`
*   **Format:** `npm run format`

### Database Management
*   **Run Migrations:** `npm run migrate`
*   **Generate Migration:** `npm run migration:generate --name=MigrationName`
*   **Create Empty Migration:** `npm run migration:create --name=MigrationName`
*   **Revert Migration:** `npm run migration:revert`
*   **Seed Database:** `npm run seed`

### Testing
*   **Unit Tests:** `npm run test`
*   **Watch Mode:** `npm run test:watch`
*   **Coverage:** `npm run test:cov`

## Conventions
*   **Naming:** Snake case for database columns (`SnakeNamingStrategy`).
*   **Code Style:** Prettier and ESLint are enforced.
*   **Imports:** Path aliases are configured (e.g., `@src/`, `@qnoffice/shared`).
*   **Environment:** Configuration via `.env` files loaded by `dotenv`.
