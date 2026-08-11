# Multi-Rate Pricing Calculator

A production-grade, full-stack Next.js web application for creating quotes, proposals, and billing documents with multi-rate per-line discounts, per-line tax rules, strict server-side calculation engine, document lifecycle enforcement (`draft` vs. `finalized`), issue-date summary analytics, and printable view export.

---

## Deployed Live URL & Demo

- **Live App URL:** [https://multi-rate-pricing-calculator-chi.vercel.app/](https://multi-rate-pricing-calculator-chi.vercel.app/)
- **Tech Stack:** Next.js (App Router), TypeScript, Tailwind CSS, MongoDB, Better Auth, Vitest, Zod

---

## Features & Implementation Overview

### 1. Document Management & Line Items

- Create, edit, duplicate, print, and delete financial documents.
- Per-line inputs for item description, quantity ($\ge 1$, supporting up to 3 decimal places), unit price (in integer cents), discount (fixed amount or percentage rate), and tax rate (percentage).
- Dynamic real-time calculation preview in the editor while preserving server-side source-of-truth calculations on save.

### 2. Strict Server-Side Calculation Engine

- **Integer Cents Storage:** Eliminates floating-point precision drift by storing all monetary figures as integer cents.
- **Mixed Discount Rules:** Accepts either fixed dollar discounts or percentage discounts per line (never both simultaneously).
- **Subtotal Cap Enforcement:** Rejects fixed discounts that exceed the line subtotal (returns a strict HTTP 400 error rather than silently clamping).
- **Discount-Before-Tax:** Tax rates are applied to the net discounted line subtotal.

### 3. Document Lifecycle & Immutability Rules

- **Draft Status (`draft`):** Fully editable (add, edit, remove line items; update metadata).
- **Finalized Status (`finalized`):** Read-only immutable record. Any attempt to modify, add, or delete line items or update metadata via UI or REST API is rejected with **HTTP 409 Conflict** and a clear error payload.
- **Finalize Validation:** Finalization requires at least one line item with valid quantity and price.
- **Duplication (Stretch Goal):** Users can duplicate any document (draft or finalized) into a fresh editable draft document with a `- Copy` title suffix.

### 4. Reporting & Date-Range Summary Analytics

- Filter documents by inclusive issue-date range (`from` and `to`).
- Computes aggregate metrics across filtered documents:
  - Total Document Count
  - Sum of Subtotals
  - Sum of Total Discounts
  - Sum of Total Taxes
  - Sum of Grand Totals
- Interactive date presets (**This Month**, **Last Month**, **Year-to-Date**, **All Time**).
- Breakdown list table of matching documents with direct navigation.

### 5. Multi-User Authentication & Data Isolation

- Email + password authentication powered by Better Auth.
- Every API endpoint and database query is strictly scoped by the authenticated user session (`userId`).

### 6. Printable View & PDF Export (Stretch Goal)

- Clean, printer-optimized HTML layout at `/documents/[documentId]/print`.
- Includes automated browser trigger (`window.print()`) for PDF generation and JSON export downloads.

---

## Calculation & Rounding Policy

### Policy Definition

1. **Internal Monetary Unit:** All prices, subtotals, discount amounts, tax amounts, and totals are represented as **integer cents** (e.g., `$100.00` is stored as `10000` cents).
2. **Line Subtotal:**
   $$\text{Line Subtotal Cents} = \text{Quantity} \times \text{Unit Price Cents}$$
3. **Line Discount Amount:**
   - **Fixed Discount:** $\text{Discount Cents} = \text{Fixed Discount Cents}$ (validated to ensure $\text{Discount Cents} \le \text{Line Subtotal Cents}$).
   - **Percent Discount:**
     $$\text{Discount Cents} = \text{RoundHalfUp}\left( \frac{\text{Line Subtotal Cents} \times \text{Discount Percent}}{100} \right)$$
4. **Discounted Line Subtotal:**
   $$\text{After Discount Cents} = \text{Line Subtotal Cents} - \text{Discount Cents}$$
5. **Line Tax Amount:**
   $$\text{Tax Cents} = \text{RoundHalfUp}\left( \frac{\text{After Discount Cents} \times \text{Tax Percent}}{100} \right)$$
6. **Line Total:**
   $$\text{Line Total Cents} = \text{After Discount Cents} + \text{Tax Cents}$$
7. **Document Totals:** Document totals are computed as the exact sum of the already-rounded per-line amounts:
   - $\text{Document Subtotal} = \sum \text{Line Subtotals}$
   - $\text{Document Total Discount} = \sum \text{Line Discounts}$
   - $\text{Document Total Tax} = \sum \text{Line Taxes}$
   - $\text{Document Grand Total} = \sum \text{Line Totals}$

### Worked Example (Sample Document Verification)

The calculation engine is verified against the sample document specified in the assignment prompt:

| Line Item       | Qty | Unit Price |    Discount    | Tax Rate | Line Subtotal | Discount Amount | Net Amount | Tax Amount | Line Total  |
| :-------------- | :-: | :--------: | :------------: | :------: | :-----------: | :-------------: | :--------: | :--------: | :---------: |
| **WidgetA**     |  2  |  $100.00   |      10%       |    5%    |    $200.00    |     $20.00      |  $180.00   |   $9.00    | **$189.00** |
| **WidgetB**     |  1  |   $50.00   |       —        |    5%    |    $50.00     |      $0.00      |   $50.00   |   $2.50    | **$52.50**  |
| **Service fee** |  1  |  $200.00   | $20.00 (Fixed) |    —     |    $200.00    |     $20.00      |  $180.00   |   $0.00    | **$180.00** |

#### Derived Document Totals:

- **Subtotal:** $\$200.00 + \$50.00 + \$200.00 = \mathbf{\$450.00}$
- **Total Discount:** $\$20.00 + \$0.00 + \$20.00 = \mathbf{\$40.00}$
- **Total Tax:** $\$9.00 + \$2.50 + \$0.00 = \mathbf{\$11.50}$
- **Grand Total:** $\$189.00 + \$52.50 + \$180.00 = \mathbf{\$421.50}$ (Equal to $\$450.00 - \$40.00 + \$11.50$)

_(This worked example is covered by automated unit tests in `lib/calculations/pricing.test.ts`)._

---

## Finalize & Immutability Rules

1. **Transition:** A document in `draft` status transitions to `finalized` via `POST /api/documents/:documentId/finalize`.
2. **Validation on Finalize:** Finalization checks that:
   - The document contains at least 1 line item.
   - All line items have quantity $\ge 1$ and unit price $\ge 0$.
3. **Immutability Protection:** Once `finalized`:
   - `PUT /api/documents/:documentId` rejects updates to metadata (title, customer, issue date) with **409 Conflict**.
   - `POST /api/documents/:documentId/line-items` rejects adding line items with **409 Conflict**.
   - `PUT /api/documents/:documentId/line-items/:lineItemId` rejects line edits with **409 Conflict**.
   - `DELETE /api/documents/:documentId/line-items/:lineItemId` rejects line deletion with **409 Conflict**.
4. **Duplication:** Finalized documents can be duplicated via `POST /api/documents/:documentId/duplicate`. This creates a brand new document in `draft` status with copied line items, leaving the original finalized document untouched.

---

## Assumptions & Tradeoffs

1. **Integer Cents vs. Decimal Fractions:** Money is represented as integer cents. Tax rates and discount percentages are stored as numeric percentages (e.g., `5.5` for 5.5%). This avoids floating-point binary representation errors while keeping DB schemas clean.
2. **Fixed Discount Cap Choice:** When a user inputs a fixed discount higher than the line subtotal, the API rejects the request with HTTP 400 rather than silently capping it at the subtotal. This ensures user intent is explicit and prevents unintended pricing errors.
3. **Native MongoDB Driver over Mongoose:** Native MongoDB driver was chosen for direct control over document queries, array updates (`$push`, `$set`, `$pull`), indexing, and transaction-free atomic operations.
4. **Code-based Migrations (`migrate-mongo`):** Database indexes (`userId_1_issueDate_1`, `userId_1_status_1`) are maintained using standard `migrate-mongo` scripts stored in `/migrations`.

---

## What Would Be Improved Before Production

1. **Multi-Currency Support:** Support ISO currency codes (`USD`, `EUR`, `GBP`) per document with localized formatting and exchange rate tracking.
2. **PDF Server-side Generation:** Complement client-side `window.print()` with server-rendered PDF generation (e.g., via `@react-pdf/renderer` or Playwright) for direct email attachments.
3. **Audit Trail & Activity History:** Add an immutable audit log tracking when documents are created, edited, finalized, or duplicated.
4. **Batch Operations:** Add bulk document deletion and bulk finalization actions on the dashboard table.

---

## Setup & Local Development

### Prerequisites

- **Node.js** v18.x or v20.x
- **pnpm** v9+ (or `npm`/`yarn`)
- **MongoDB** (Local instance via Docker or MongoDB Atlas cluster)

### Environment Configuration

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Configure environment variables in `.env.local`:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/multi-rate-pricing-calculator
   MONGODB_DB=multi-rate-pricing-calculator
   BETTER_AUTH_SECRET=your-random-32-character-secret
   BETTER_AUTH_URL=http://localhost:3000
   ```

### Step-by-Step Execution

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```
2. **Start Local Database (Docker):**
   ```bash
   docker run --name mrc-mongo -p 27017:27017 -d mongo:7
   ```
3. **Run Database Migrations:**
   ```bash
   pnpm db:migrate
   ```
4. **Run Unit Tests:**
   ```bash
   pnpm test
   ```
5. **Start Development Server:**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Reference

| Endpoint                                |   Method   | Description                                        | Status Codes            |
| :-------------------------------------- | :--------: | :------------------------------------------------- | :---------------------- |
| `/api/auth/*`                           | `POST/GET` | Sign up, sign in, sign out, and session management | 200, 400, 401           |
| `/api/documents`                        |   `GET`    | List all documents for authenticated user          | 200, 401                |
| `/api/documents`                        |   `POST`   | Create a new draft document                        | 201, 400, 401           |
| `/api/documents/:id`                    |   `GET`    | Get single document by ID                          | 200, 401, 404           |
| `/api/documents/:id`                    |   `PUT`    | Update document metadata                           | 200, 400, 401, 404, 409 |
| `/api/documents/:id`                    |  `DELETE`  | Delete draft or finalized document                 | 200, 401, 404           |
| `/api/documents/:id/line-items`         |   `POST`   | Add line item to draft document                    | 201, 400, 401, 404, 409 |
| `/api/documents/:id/line-items/:lineId` |   `PUT`    | Update line item in draft document                 | 200, 400, 401, 404, 409 |
| `/api/documents/:id/line-items/:lineId` |  `DELETE`  | Remove line item from draft document               | 200, 401, 404, 409      |
| `/api/documents/:id/finalize`           |   `POST`   | Finalize draft document (locks edits)              | 200, 400, 401, 404, 409 |
| `/api/documents/:id/duplicate`          |   `POST`   | Duplicate document into a new draft                | 201, 401, 404           |
| `/api/reports/summary`                  |   `GET`    | Aggregate analytics by `from` and `to` issue dates | 200, 400, 401           |

---

## Test Suite Execution

Run the complete test suite:

```bash
pnpm test
```

Expected output:

```text
 ✓ lib/calculations/pricing.test.ts (9 tests)
 ✓ lib/reports/schemas.test.ts (4 tests)
 ✓ lib/documents/schemas.test.ts (10 tests)

 Test Files  3 passed (3)
      Tests  23 passed (23)
```
