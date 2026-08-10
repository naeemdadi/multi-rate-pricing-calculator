import Link from "next/link";

import { FinalizeDocumentButton } from "@/components/finalize-document-button";
import { requireAuthenticatedUser } from "@/lib/auth-pages";
import { listDocuments } from "@/lib/documents/service";

export default async function DocumentsPage() {
  const user = await requireAuthenticatedUser();
  const documents = await listDocuments(user.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
            Documents Workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Your Pricing Documents
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Manage your draft proposals and finalized pricing documents. All totals are computed server-side.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--muted)]">
            {documents.length} document{documents.length === 1 ? "" : "s"}
          </div>
          <Link
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            href="/documents/new"
          >
            + New Document
          </Link>
        </div>
      </div>

      {documents.length === 0 ? (
        <section className="mt-8 rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface-raised)] p-8 text-center">
          <h2 className="text-lg font-medium text-[var(--foreground)]">No documents yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Create a draft document, add line items with custom discounts and tax rules, and finalize it once your pricing totals are ready.
          </p>
          <div className="mt-6">
            <Link
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              href="/documents/new"
            >
              Create your first document
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-8 grid gap-4">
          {documents.map((document) => (
            <article
              key={document.id}
              className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-6 transition hover:border-[var(--muted)]/40"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      className="text-xl font-medium text-[var(--foreground)] transition hover:text-[var(--accent)]"
                      href={`/documents/${document.id}`}
                    >
                      {document.title}
                    </Link>
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs uppercase tracking-[0.18em] ${
                        document.status === "draft"
                          ? "border border-amber-500/40 bg-amber-500/10 text-amber-300"
                          : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium"
                      }`}
                    >
                      {document.status === "draft" ? "Draft" : "Finalized 🔒"}
                    </span>
                    {document.duplicatedFromDocumentId ? (
                      <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-0.5 text-[10px] text-[var(--accent)]">
                        Cloned
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    Customer: <strong className="text-[var(--foreground)]">{document.customer}</strong> • Issued: {document.issueDate} • Line items: {document.lineItems.length}
                  </p>
                </div>
                <div className="flex flex-col items-start sm:items-end">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Grand Total
                  </p>
                  <p className="mt-1 text-2xl font-bold text-emerald-300">
                    ${(document.totals.grandTotalCents / 100).toFixed(2)}
                  </p>
                  {document.status === "draft" ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <Link
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
                        href={`/documents/${document.id}`}
                      >
                        Edit Document
                      </Link>
                      <FinalizeDocumentButton documentId={document.id} />
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-3">
                      <p className="text-xs text-[var(--muted)]">
                        Finalized {new Date(document.finalizedAt ?? document.updatedAt).toLocaleDateString()}
                      </p>
                      <Link
                        className="rounded-full border border-[var(--border)] px-4 py-1.5 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
                        href={`/documents/${document.id}`}
                      >
                        View Details
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <div className="mt-8">
        <Link
          className="text-sm text-[var(--muted)] underline underline-offset-4 transition hover:text-[var(--foreground)]"
          href="/reports"
        >
          View Summary Reports →
        </Link>
      </div>
    </main>
  );
}
