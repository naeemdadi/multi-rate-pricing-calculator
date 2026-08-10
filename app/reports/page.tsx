import { requireAuthenticatedUser } from "@/lib/auth-pages";
import { listDocuments } from "@/lib/documents/service";

export default async function ReportsPage() {
  const user = await requireAuthenticatedUser();
  const documents = await listDocuments(user.id);

  const totalGrand = documents.reduce(
    (sum, document) => sum + document.totals.grandTotalCents,
    0,
  );
  const totalTax = documents.reduce(
    (sum, document) => sum + document.totals.totalTaxCents,
    0,
  );
  const totalDiscount = documents.reduce(
    (sum, document) => sum + document.totals.totalDiscountCents,
    0,
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <div className="border-b border-[var(--border)] pb-6">
        <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
          Reports
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          Protected reporting preview
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          This route is server-protected and uses only the authenticated user's data.
          Full date-range reporting comes in the reporting phase.
        </p>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Documents
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            {documents.length}
          </p>
        </article>
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Total tax
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            ${(totalTax / 100).toFixed(2)}
          </p>
        </article>
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            Total discount
          </p>
          <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
            ${(totalDiscount / 100).toFixed(2)}
          </p>
        </article>
      </section>

      <section className="mt-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Grand total
        </p>
        <p className="mt-3 text-4xl font-semibold text-[var(--foreground)]">
          ${(totalGrand / 100).toFixed(2)}
        </p>
      </section>
    </main>
  );
}
