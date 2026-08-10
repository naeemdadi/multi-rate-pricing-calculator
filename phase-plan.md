# Phase Plan

This plan is aligned to the assignment requirements in `multi-rate-pricing-calculator.md`
and to the current state of the codebase.

## Phase 0: Project Setup

Status: complete

- Choose the stack and scaffold the Next.js app.
- Add environment/config handling.
- Set up pnpm, TypeScript, linting, and the initial app shell.
- Add the requirements file into the project as the source of truth.

## Phase 1: Persistence and Auth Foundation

Status: complete

- Define the core document and line-item data model.
- Choose the persistence layer and migration strategy.
- Set up MongoDB migrations with `migrate-mongo`.
- Wire Better Auth with MongoDB.
- Add the auth route, auth client, and server-side session helper.

Note:
- This phase only covers the auth foundation.
- End-to-end signup/login UX and enforced per-user document isolation are not finished yet.

## Phase 2: Calculation Engine

Status: complete

- Build the shared money-calculation module.
- Implement subtotal, discount, tax, and grand-total rules.
- Decide and document the rounding policy.
- Add unit tests for the sample document and core edge cases.

## Phase 3: Document Validation and REST API

Status: complete

- Add request validation for documents and line items.
- Implement REST endpoints for document CRUD.
- Implement line-item create/update/delete within draft documents.
- Ensure totals are always computed server-side from trusted input.
- Scope every document query and mutation by the authenticated user.

## Phase 4: Auth UX and Protected Flows

Status: complete

- Build signup and login screens.
- Implement logout and session-aware navigation.
- Protect document and report flows behind authentication.
- Verify that each user can only see and modify their own data.

## Phase 5: Document Lifecycle

Status: complete

- Implement finalize document behavior.
- Enforce finalized-document immutability in the API.
- Return clear errors for invalid edit attempts.
- Duplicate-to-draft is intentionally deferred as a stretch goal.

## Phase 6: Reporting

Status: complete

- Implement the issue-date-range summary report.
- Return number of documents, grand-total sum, tax sum, and discount sum.
- Ensure report values come from persisted document data correctly.
- Add any query/index adjustments needed for the report path.

## Phase 7: UI and UX

Status: complete

- Build the document editor UI with live line item calculation preview and per-line calculated breakdown (Subtotal, Discount, Tax, Line Total).
- Build the finalize flow UI with modal confirmation dialog and read-only locked status banner.
- Build the summary report UI with date range quick presets and matching documents breakdown table.
- Surface validation and server errors clearly next to form fields and toast alerts.
- Added document duplication to draft and document deletion modal.


## Phase 8: Testing and Hardening

Status: complete

- Added test suites for pricing engine (`lib/calculations/pricing.test.ts`), document Zod schemas (`lib/documents/schemas.test.ts`), and report range schema (`lib/reports/schemas.test.ts`) covering 23 unit tests.
- Covered money-math precision, zero unit price, 100% discount, decimal tax/discount rates, line subtotal fixed discount caps, and sample document totals.
- Verified document lifecycle enforcement (finalized documents reject updates and return 409 conflict).
- Verified per-user authentication and data isolation in service methods.


## Phase 9: Deployment and README

Status: pending

- Deploy the app and verify the live URL.
- Write the final README with setup, rounding policy, immutability rules, assumptions, and tradeoffs.
- Add any final submission polish.
