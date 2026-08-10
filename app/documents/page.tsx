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
            Documents
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            Your pricing documents
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            This page is protected on the server and only queries documents for the
            authenticated user.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-sm text-[var(--muted)]">
          {documents.length} document{documents.length === 1 ? "" : "s"}
        </div>
      </div>

      {documents.length === 0 ? (
        <section className="mt-8 rounded-[28px] border border-dashed border-[var(--border)] bg-[var(--surface-raised)] p-8">
          <h2 className="text-lg font-medium text-[var(--foreground)]">No documents yet</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
            Phase 4 protects the workspace and verifies user isolation. The document
            creation UI comes in the next phase, but the API layer is already ready for it.
          </p>
        </section>
      ) : (
        <section className="mt-8 grid gap-4">
          {documents.map((document) => (
            <article
              key={document.id}
              className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-medium text-[var(--foreground)]">
                      {document.title}
                    </h2>
                    <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                      {document.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {document.customer} • {document.issueDate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Grand total
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--foreground)]">
                    ${(document.totals.grandTotalCents / 100).toFixed(2)}
                  </p>
                  {document.status === "draft" ? (
                    <div className="mt-4">
                      <FinalizeDocumentButton documentId={document.id} />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      Finalized {new Date(document.finalizedAt ?? document.updatedAt).toLocaleDateString()}
                    </p>
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
          Go to reports
        </Link>
      </div>
    </main>
  );
}
