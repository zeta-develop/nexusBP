# License Management System API

This project is a Node.js-based API for managing software licenses, subscriptions, and users. It's designed to be the backend for a system that issues and validates licenses for self-hosted software products.

## Features (Planned & In-Progress)

*   User registration and authentication (JWT-based)
*   Core license management (create, read, update, delete, validate)
*   Subscription management
*   Role-based access control (client, admin)
*   CLI tool for module installation (`@zeta-develop/invoxa-cli`) - Basic structure in place.
*   Payment integration placeholders

## Project Structure

*   `src/`: Main application source code
    *   `config/`: Configuration files (e.g., environment variables)
    *   `controllers/`: Business logic for API endpoints
    *   `db/migrations/`: SQL database migration files
    *   `middleware/`: Express middleware (e.g., authentication)
    *   `models/`: Database models and connection setup
    *   `routes/`: API route definitions
    *   `tests/`: Unit and integration tests
    *   `server.js`: Main application entry point
*   `packages/invoxa-cli/`: Source code for the associated CLI tool
*   `.env`: Environment variable configuration (gitignored - create your own from `.env.example` if provided)
*   `.gitignore`: Specifies intentionally untracked files that Git should ignore
*   `package.json`: Project metadata and dependencies

## Prerequisites

*   [Node.js](https://nodejs.org/) (version 14.x or later recommended)
*   [npm](https://www.npmjs.com/) (usually comes with Node.js)
*   [PostgreSQL](https://www.postgresql.org/) (running instance for database persistence - currently using in-memory stores for development)

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the project root. You can copy the structure from the `echo` command in the initial subtask or use the example below, adjusting values as necessary:
    ```env
    NODE_ENV=development
    PORT=3000
    # Replace with your actual PostgreSQL connection string
    DATABASE_URL=postgresql://user:password@localhost:5432/licensedb
    JWT_SECRET=yourjwtsecretfallback # Change this to a strong, unique secret
    ```
    *Note: Currently, database interactions are mocked with in-memory stores. The `DATABASE_URL` is for future database integration.*

4.  **Database Migrations (Future Step):**
    Once the database is fully configured and `node-pg-migrate` issues are resolved in the environment:
    ```bash
    # npm run migrate:up
    ```
    *(Currently, migration files are in `src/db/migrations/` but running them might require environment adjustments.)*


## Running the Application

```bash
npm star` + `t
```
This will typically start the server on `http://localhost:3000` (or the port specified in your `.env` file).

## Running Tests

```bash
npm test
```
This command will execute the Jest unit tests. *(Note: Test execution in some sandbox environments might have issues with `node_modules` visibility. The tests are structured to work in a standard Node.js environment.)*

## Basic API Endpoints Overview

All endpoints are prefixed with `/api`.

### Authentication (`/auth`)

*   `POST /auth/register`: Register a new user.
    *   Body: `{ "email": "user@example.com", "password": "yourpassword", "role": "client" (optional) }`
*   `POST /auth/login`: Login an existing user.
    *   Body: `{ "email": "user@example.com", "password": "yourpassword" }`
    *   Returns: JWT token.

### Licenses (`/licenses`) - Requires `x-auth-token` header

*   `POST /licenses`: Create a new license (admin or self for now).
    *   Body: `{ "userId": 1, "status": "active", "expiresAt": "YYYY-MM-DDTHH:mm:ss.sssZ" (optional) }`
*   `GET /licenses`: List licenses (all for admin, own for client).
*   `GET /licenses/:id`: Get a specific license.
*   `PUT /licenses/:id`: Update a license (admin).
*   `DELETE /licenses/:id`: Delete a license (admin).
*   `POST /licenses/validate`: Validate a license key.
    *   Body: `{ "licenseKey": "uuid-license-key" }`

### Subscriptions (`/subscriptions` & `/users`) - Requires `x-auth-token` header

*   `POST /subscriptions`: Create a new subscription.
*   `GET /subscriptions/mine`: Get logged-in user's subscriptions.
*   `GET /subscriptions`: Get all subscriptions (admin).
*   `GET /users/:userId/subscriptions`: Get subscriptions for a specific user (admin or self).
*   `PUT /subscriptions/:subscriptionId`: Update a subscription.

### Payments (`/payments`)

*   `POST /payments/initiate`: Placeholder for initiating a payment (requires auth).
*   `POST /payments/webhook`: Placeholder for receiving payment provider webhooks.


## CLI Tool (`@zeta-develop/invoxa-cli`)

A basic CLI tool structure is located in `packages/invoxa-cli/`.

### Setup (for local testing)

1.  Navigate to the CLI package directory:
    ```bash
    cd packages/invoxa-cli
    ```
2.  Link the package for global-like access:
    ```bash
    npm link
    ```
3.  Navigate back or to any other directory.

### Usage

```bash
@zeta-develop/invoxa-cli install:<module_name>
# or
invoxa-cli install:<module_name>
```
Example: `invoxa-cli install:pterodactyl`

*(Note: The CLI's dependency installation might face issues in some sandbox environments.)*

---

This README provides a starting point. Further details will be added as the project progresses.
