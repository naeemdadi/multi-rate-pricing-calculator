import { ZodError } from "zod";

import { requireAuthenticatedUser } from "@/lib/auth-pages";
import {
  getDefaultReportRange,
  getReportSummary,
} from "@/lib/reports/service";
import { reportRangeSchema } from "@/lib/reports/schemas";

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

type ReportsPageProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const user = await requireAuthenticatedUser();
  const defaults = getDefaultReportRange();
  const params = (await searchParams) ?? {};

  let selectedRange = defaults;
  let errorMessage: string | null = null;

  if (params.from || params.to) {
    try {
      selectedRange = reportRangeSchema.parse({
        from: params.from,
        to: params.to,
      });
    } catch (error) {
      errorMessage =
        error instanceof ZodError
          ? error.issues[0]?.message ?? "Invalid report range"
          : "Invalid report range";
    }
  }

  const summary = await getReportSummary(user.id, selectedRange);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <div className="border-b border-[var(--border)] pb-6">
        <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
          Reports
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Issue-date summary
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Values are aggregated from persisted document totals for the authenticated
          user only, filtered by inclusive issue-date range.
        </p>
      </div>

      <section className="mt-8 rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
        <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="grid gap-2 text-sm text-[var(--muted)]">
            <span>From</span>
            <input
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
              defaultValue={selectedRange.from}
              name="from"
              type="date"
            />
          </label>
          <label className="grid gap-2 text-sm text-[var(--muted)]">
            <span>To</span>
            <input
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
              defaultValue={selectedRange.to}
              name="to"
              type="date"
            />
          </label>
          <button
            className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-[var(--background)] transition hover:opacity-90"
            type="submit"
          >
            Run report
          </button>
        </form>
        {errorMessage ? (
          <p className="mt-3 text-sm text-red-300">{errorMessage}</p>
        ) : null}
        <p className="mt-4 text-sm text-[var(--muted)]">
          Showing documents issued from {summary.from} to {summary.to}.
        </p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Documents
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {summary.documentCount}
          </p>
        </article>
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Total tax
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {formatMoney(summary.totalTaxCents)}
          </p>
        </article>
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Total discount
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {formatMoney(summary.totalDiscountCents)}
          </p>
        </article>
      </section>

      <section className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Grand total
          </p>
          <p className="mt-3 text-4xl font-semibold text-[var(--foreground)]">
            {formatMoney(summary.grandTotalCents)}
          </p>
        </article>
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            API endpoint
          </p>
          <p className="mt-3 break-all text-sm leading-6 text-[var(--muted)]">
            /api/reports/summary?from={summary.from}&to={summary.to}
          </p>
        </article>
      </section>
    </main>
  );
}
