# Multi-Rate Pricing Calculator

Phase 0 scaffold for the take-home assignment.

## Stack

- Next.js
- TypeScript
- Better Auth
- MongoDB
- REST API via Next.js route handlers

## Data Layer

- Persistence is native MongoDB driver based, not Mongoose.
- Document data will live in a `documents` collection with embedded line items.
- Migration strategy uses `migrate-mongo`, which stores state in its own `changelog` collection and gives standard `up`, `down`, `status`, and `create` commands.
- App-level users are defined as a domain type now; auth-owned user persistence is handled by Better Auth.

## Calculation Policy

- Money is stored and calculated in integer cents.
- Quantity supports up to 3 decimal places.
- Percent values support up to 2 decimal places.
- Rounding policy is line-level round half up to the nearest cent.
- Discount is applied before tax.
- Tax is applied to the discounted line amount.
- Document totals are sums of already-rounded line values.
- Fixed discounts above the line subtotal are rejected, not clamped.

## Setup

1. Copy `.env.example` to `.env.local`
2. Set `MONGODB_URI`, `MONGODB_DB`, and `BETTER_AUTH_SECRET`
3. Install dependencies with `pnpm install`
4. Run migrations with `pnpm db:migrate`
5. Start the app with `pnpm dev`

## MongoDB Setup

You can use either local MongoDB or MongoDB Atlas.

### Local MongoDB

1. Start MongoDB with Docker:

```bash
docker run --name mrc-mongo -p 27017:27017 -d mongo:7
```

2. Set `MONGODB_URI` to:

```bash
mongodb://127.0.0.1:27017/multi-rate-pricing-calculator
```

3. Run `pnpm db:migrate`

### MongoDB Atlas

1. Create a cluster in Atlas
2. Create a database user
3. Allow your IP in the network access list
4. Copy the Atlas connection string into `MONGODB_URI`
5. Set `MONGODB_DB` to the database name you want to use
6. Run `pnpm db:migrate`

## Migrations

- Migrations are code-based and idempotent.
- `pnpm db:migrate` applies pending migrations and creates the required indexes.
- `pnpm db:migrate:status` prints the current migration status without changing data.
- `pnpm db:migrate:down` reverts the most recent migration.
- `pnpm db:migrate:create` scaffolds a new migration file.
- Schema changes are tracked in code rather than through an ORM migration generator.

## Lifecycle Rules

- Draft documents are fully editable.
- Finalized documents are read-only for metadata and line items.
- Finalization is exposed through `POST /api/documents/:documentId/finalize`.
- Invalid edit attempts against finalized documents return HTTP `409` with a clear API error.
- Duplicate-to-draft is not implemented in the current submission and remains a documented stretch goal.

## Current status

- App shell exists
- Health endpoint exists at `/api/health`
- Database layer types, indexes, and migration strategy are in place
- Better Auth route, client, and session helper are in place
- Shared calculation engine and unit tests are in place
- Document validation and REST API routes are in place
- Sign-up, sign-in, sign-out, and protected document/report pages are in place
- Document finalize flow and finalized-document immutability are in place
- Feature work will continue phase by phase
