# Qn Official API & Doino Bot

## Project Overview

This project is a dual-purpose application built with **NestJS**. It serves as:
1.  **Qn Official API:** A backend system for managing office operations, including staff, branches, cleaning schedules, "opentalk" sessions, holidays, and more.
2.  **Doino Bot:** A chat bot (integrated with the **Mezon** platform) designed for debt management ("ghi nợ"), order tracking, and automated notifications.

## Technology Stack

*   **Framework:** [NestJS](https://nestjs.com/) (Node.js)
*   **Database:** PostgreSQL
*   **ORM:** TypeORM
*   **Bot Integration:** Mezon SDK
*   **Language:** TypeScript

## Getting Started

### Prerequisites
*   Node.js
*   PostgreSQL database
*   Mezon credentials (for Bot functionality)

### Installation
```bash
npm install
```

### Running the Application

This project runs two separate entry points: one for the API and one for the Bot.

**1. API Server:**
*   **Development (Watch Mode):**
    ```bash
    npm run dev
    ```
*   **Production:**
    ```bash
    npm run start
    ```

**2. Bot Service:**
*   **Development (Watch Mode):**
    ```bash
    npm run dev:bot
    ```
    *(Debug port: 9230)*
*   **Production:**
    ```bash
    npm run start:bot
    ```

### Database Management
*   **Run Migrations:**
    ```bash
    npm run migrate
    ```
*   **Generate Migration:**
    ```bash
    npm run migration:generate --name=MigrationName
    ```
*   **Create Empty Migration:**
    ```bash
    npm run migration:create --name=MigrationName
    ```
*   **Revert Migration:**
    ```bash
    npm run migration:revert
    ```
*   **Seed Database:**
    ```bash
    npm run seed
    ```

### Testing
*   **Run Unit Tests:**
    ```bash
    npm run test
    ```
*   **Test Coverage:**
    ```bash
    npm run test:cov
    ```

## Project Structure

*   **`src/main.ts`**: Entry point for the REST API application.
*   **`src/app.module.ts`**: Main application module registering all API features.
*   **`src/bot/`**: Contains all logic specific to the Doino Bot.
    *   `src/bot/main.ts`: Entry point for the Bot application.
*   **`src/modules/`**: Feature-specific modules (Business Logic).
    *   `auth`, `user`, `staff`: User management.
    *   `opentalk`, `cleaning`, `holiday`: Office scheduling features.
    *   `penalty`, `audit-log`: Governance and logging.
*   **`src/common/`**: Shared configurations, database entities, filters, guards, and utilities.
*   **`migrations/`**: Database migration files.

## Development Conventions

*   **Architecture:** Modular NestJS architecture (Module -> Controller -> Service -> Repository/Entity).
*   **Code Style:** Enforced via `eslint` and `prettier`. Run `npm run lint` or `npm run format` to ensure compliance.
*   **Configuration:** Environment variables are likely managed via `.env` (see `.env.example`).
*   **API Documentation:** Swagger is configured (see `src/common/configs/swagger.config.ts`).
