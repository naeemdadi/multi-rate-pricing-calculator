"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

type FinalizeDocumentButtonProps = {
  documentId: string;
};

export function FinalizeDocumentButton({
  documentId,
}: FinalizeDocumentButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--background)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={() => {
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

              router.refresh();
            } catch {
              setError("Unable to finalize document");
              setIsPending(false);
            }
          });
        }}
        type="button"
      >
        {isPending ? "Finalizing..." : "Finalize"}
      </button>
      {error ? <p className="text-right text-sm text-red-300">{error}</p> : null}
    </div>
  );
}
