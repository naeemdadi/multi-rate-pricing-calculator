"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

type FinalizeDocumentButtonProps = {
  documentId: string;
  onFinalized?: (document: import("@/lib/documents/types").SerializedDocument) => void;
};

export function FinalizeDocumentButton({
  documentId,
  onFinalized,
}: FinalizeDocumentButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFinalize() {
    setIsPending(true);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}/finalize`, {
          method: "POST",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;

          setError(payload?.error ?? "Unable to finalize document");
          setIsPending(false);
          return;
        }

        const payload = (await response.json()) as {
          document: import("@/lib/documents/types").SerializedDocument;
        };
        setShowModal(false);
        onFinalized?.(payload.document);
        router.refresh();
      } catch {
        setError("Unable to finalize document");
        setIsPending(false);
      }
    });
  }

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <button
          className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => setShowModal(true)}
          type="button"
        >
          Finalize Document
        </button>
        {error ? <p className="text-right text-xs text-red-300">{error}</p> : null}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-[var(--foreground)]">
              Finalize Document?
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Finalizing this document locks all pricing rows, discounts, taxes, and metadata.
              This action <strong className="text-[var(--foreground)]">cannot be undone</strong> and the document will become permanently read-only.
            </p>

            {error ? (
              <div className="mt-4 rounded-xl border border-[var(--danger-border)] bg-[var(--danger-surface)] p-3 text-xs text-[var(--danger-text)]">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] disabled:opacity-50"
                disabled={isPending}
                onClick={() => {
                  setShowModal(false);
                  setError(null);
                }}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-50"
                disabled={isPending}
                onClick={handleFinalize}
                type="button"
              >
                {isPending ? "Finalizing..." : "Confirm & Finalize"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
