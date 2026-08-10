"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

import type { SerializedDocument } from "@/lib/documents/types";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function parseErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const record = payload as {
    error?: string;
    details?: {
      fieldErrors?: Record<string, string[] | undefined>;
      formErrors?: string[];
    };
  };

  const fieldMessage = record.details?.fieldErrors
    ? Object.values(record.details.fieldErrors).flat().find(Boolean)
    : null;
  const formMessage = record.details?.formErrors?.[0];

  return fieldMessage ?? formMessage ?? record.error ?? fallback;
}

export function CreateDocumentForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [customer, setCustomer] = useState("");
  const [issueDate, setIssueDate] = useState(todayIso());
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-4 rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-6"
      onSubmit={(event) => {
        event.preventDefault();
        setIsPending(true);
        setError(null);

        startTransition(async () => {
          const response = await fetch("/api/documents", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title,
              customer,
              issueDate,
              lineItems: [],
            }),
          });

          const payload = (await response.json().catch(() => null)) as unknown;

          if (!response.ok) {
            setError(parseErrorMessage(payload, "Unable to create document"));
            setIsPending(false);
            return;
          }

          const document = (payload as { document: SerializedDocument }).document;
          router.push(`/documents/${document.id}`);
          router.refresh();
        });
      }}
    >
      <div>
        <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
          Create draft
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Start a new pricing document
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
          Create the shell first, then add line items and finalize once the totals are
          correct.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm text-[var(--muted)] md:col-span-2">
          <span>Title</span>
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <span>Customer</span>
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
            onChange={(event) => setCustomer(event.target.value)}
            value={customer}
          />
        </label>
        <label className="grid gap-2 text-sm text-[var(--muted)]">
          <span>Issue date</span>
          <input
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
            onChange={(event) => setIssueDate(event.target.value)}
            type="date"
            value={issueDate}
          />
        </label>
      </div>

      {error ? (
        <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger-text)]">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Creating..." : "Create document"}
        </button>
      </div>
    </form>
  );
}
