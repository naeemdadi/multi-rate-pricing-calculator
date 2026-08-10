import Link from "next/link";

import { CreateDocumentForm } from "@/components/create-document-form";
import { requireAuthenticatedUser } from "@/lib/auth-pages";

export default async function NewDocumentPage() {
  await requireAuthenticatedUser();

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
            Documents
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
            New document
          </h1>
        </div>
        <Link
          className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
          href="/documents"
        >
          Back
        </Link>
      </div>

      <div className="mt-8">
        <CreateDocumentForm />
      </div>
    </main>
  );
}
