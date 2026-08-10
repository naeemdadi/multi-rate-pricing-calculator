import Link from "next/link";
import { ZodError } from "zod";

import { ReportDatePresets } from "@/components/report-date-presets";
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
          Reports & Analytics
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Issue-Date Summary Report
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Summary values aggregated strictly from your persisted document database records, filtered by inclusive issue-date range.
        </p>
      </div>

      <section className="mt-8 rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-6">
        <form className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
          <label className="grid gap-2 text-sm text-[var(--muted)]">
            <span>From Issue Date</span>
            <input
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
              defaultValue={selectedRange.from}
              name="from"
              type="date"
            />
          </label>
          <label className="grid gap-2 text-sm text-[var(--muted)]">
            <span>To Issue Date</span>
            <input
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
              defaultValue={selectedRange.to}
              name="to"
              type="date"
            />
          </label>
          <button
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            type="submit"
          >
            Filter Report
          </button>
        </form>

        <ReportDatePresets />

        {errorMessage ? (
          <p className="mt-3 text-sm text-red-300">{errorMessage}</p>
        ) : null}
        <p className="mt-4 text-xs text-[var(--muted)]">
          Range: <strong>{summary.from}</strong> to <strong>{summary.to}</strong>
        </p>
      </section>

      {/* Summary KPI Cards */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
            Subtotal
          </p>
          <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            {formatMoney(summary.subtotalCents)}
          </p>
        </article>

        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Total Discount
          </p>
          <p className="mt-3 text-2xl font-semibold text-amber-300">
            -{formatMoney(summary.totalDiscountCents)}
          </p>
        </article>

        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Total Tax
          </p>
          <p className="mt-3 text-2xl font-semibold text-blue-300">
            +{formatMoney(summary.totalTaxCents)}
          </p>
        </article>

        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5 sm:col-span-2 lg:col-span-1">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Grand Total
          </p>
          <p className="mt-3 text-2xl font-bold text-emerald-300">
            {formatMoney(summary.grandTotalCents)}
          </p>
        </article>
      </section>

      {/* Breakdown list of documents in range */}
      <section className="mt-8 rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-6">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <h2 className="text-lg font-medium text-[var(--foreground)]">
            Documents in Date Range
          </h2>
          <span className="text-xs text-[var(--muted)]">
            {summary.documents.length} matching
          </span>
        </div>

        {summary.documents.length === 0 ? (
          <p className="mt-6 text-sm text-[var(--muted)]">
            No documents issued within this date range ({summary.from} to {summary.to}).
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-[var(--surface-soft)] uppercase tracking-[0.14em] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Document Title</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 text-right">Discount</th>
                  <th className="px-4 py-3 text-right">Tax</th>
                  <th className="px-4 py-3 text-right">Grand Total</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--surface-raised)]">
                {summary.documents.map((doc) => (
                  <tr key={doc.id} className="transition hover:bg-[var(--surface-soft)]/50">
                    <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">
                      <Link
                        className="hover:underline"
                        href={`/documents/${doc.id}`}
                      >
                        {doc.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted)]">{doc.customer}</td>
                    <td className="px-4 py-3.5 text-[var(--muted)]">{doc.issueDate}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider ${
                          doc.status === "draft"
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-medium"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-[var(--muted)]">
                      {formatMoney(doc.totals.subtotalCents)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-amber-300">
                      -{formatMoney(doc.totals.totalDiscountCents)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-blue-300">
                      +{formatMoney(doc.totals.totalTaxCents)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-[var(--foreground)]">
                      {formatMoney(doc.totals.grandTotalCents)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Link
                        className="rounded-full border border-[var(--border)] px-3 py-1 text-[11px] text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
                        href={`/documents/${doc.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
