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

Status: next

- Build signup and login screens.
- Implement logout and session-aware navigation.
- Protect document and report flows behind authentication.
- Verify that each user can only see and modify their own data.

## Phase 5: Document Lifecycle

Status: pending

- Implement finalize document behavior.
- Enforce finalized-document immutability in the API.
- Return clear errors for invalid edit attempts.
- Decide whether duplicate-to-draft is included as a stretch goal.

## Phase 6: Reporting

Status: pending

- Implement the issue-date-range summary report.
- Return number of documents, grand-total sum, tax sum, and discount sum.
- Ensure report values come from persisted document data correctly.
- Add any query/index adjustments needed for the report path.

## Phase 7: UI and UX

Status: pending

- Build the document editor UI.
- Build the finalize flow UI.
- Build the summary report UI.
- Surface validation and server errors clearly.

## Phase 8: Testing and Hardening

Status: pending

- Add integration tests for auth-protected API behavior.
- Add tests for lifecycle enforcement and report correctness.
- Cover key money-math regressions and validation edge cases.
- Review security, assumptions, and operational gaps.

## Phase 9: Deployment and README

Status: pending

- Deploy the app and verify the live URL.
- Write the final README with setup, rounding policy, immutability rules, assumptions, and tradeoffs.
- Add any final submission polish.
