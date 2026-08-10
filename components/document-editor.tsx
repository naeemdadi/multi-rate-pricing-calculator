"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";

import { FinalizeDocumentButton } from "@/components/finalize-document-button";
import { calculateLineItem, PricingCalculationError } from "@/lib/calculations";
import type {
  SerializedDocument,
  SerializedLineItem,
} from "@/lib/documents/types";

type DiscountType = "none" | "fixed" | "percent";

type DocumentEditorProps = {
  initialDocument: SerializedDocument;
};

type MetadataDraft = {
  title: string;
  customer: string;
  issueDate: string;
};

type LineItemDraft = {
  description: string;
  quantity: string;
  unitPrice: string;
  discountType: DiscountType;
  discountValue: string;
  taxPercent: string;
};

const emptyLineItemDraft: LineItemDraft = {
  description: "",
  quantity: "1",
  unitPrice: "0.00",
  discountType: "none",
  discountValue: "",
  taxPercent: "",
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function toLineItemDraft(lineItem: SerializedLineItem): LineItemDraft {
  return {
    description: lineItem.description,
    quantity: String(lineItem.quantity),
    unitPrice: (lineItem.unitPriceCents / 100).toFixed(2),
    discountType:
      lineItem.discount?.type === "fixed"
        ? "fixed"
        : lineItem.discount?.type === "percent"
          ? "percent"
          : "none",
    discountValue:
      lineItem.discount?.type === "fixed"
        ? (lineItem.discount.amountCents / 100).toFixed(2)
        : lineItem.discount?.type === "percent"
          ? String(lineItem.discount.percentage)
          : "",
    taxPercent:
      lineItem.taxPercent == null ? "" : String(lineItem.taxPercent),
  };
}

function buildLineItemPayload(draft: LineItemDraft) {
  const payload: {
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: { type: "fixed" | "percent"; value: number } | null;
    taxPercent?: number | null;
  } = {
    description: draft.description.trim(),
    quantity: Number(draft.quantity),
    unitPrice: Number(draft.unitPrice),
    discount: null,
    taxPercent: draft.taxPercent.trim() === "" ? null : Number(draft.taxPercent),
  };

  if (draft.discountType === "fixed") {
    payload.discount = {
      type: "fixed",
      value: Number(draft.discountValue),
    };
  } else if (draft.discountType === "percent") {
    payload.discount = {
      type: "percent",
      value: Number(draft.discountValue),
    };
  }

  return payload;
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

export function DocumentEditor({ initialDocument }: DocumentEditorProps) {
  const router = useRouter();
  const [document, setDocument] = useState(initialDocument);
  const [metadata, setMetadata] = useState<MetadataDraft>({
    title: initialDocument.title,
    customer: initialDocument.customer,
    issueDate: initialDocument.issueDate,
  });
  const [lineItemDraft, setLineItemDraft] = useState<LineItemDraft>(emptyLineItemDraft);
  const [editingLineItemId, setEditingLineItemId] = useState<string | null>(null);

  const [metadataPending, setMetadataPending] = useState(false);
  const [lineItemPending, setLineItemPending] = useState(false);
  const [duplicatePending, setDuplicatePending] = useState(false);
  const [deleteDocPending, setDeleteDocPending] = useState(false);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);

  const [metadataError, setMetadataError] = useState<string | null>(null);
  const [lineItemError, setLineItemError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isDraft = document.status === "draft";

  const headerStats = useMemo(
    () => [
      { label: "Subtotal", value: money(document.totals.subtotalCents) },
      { label: "Discount", value: money(document.totals.totalDiscountCents) },
      { label: "Tax", value: money(document.totals.totalTaxCents) },
      { label: "Grand total", value: money(document.totals.grandTotalCents) },
    ],
    [document],
  );

  // Live calculation preview for the line item form
  const livePreview = useMemo(() => {
    try {
      const quantityNum = Number(lineItemDraft.quantity);
      const unitPriceNum = Number(lineItemDraft.unitPrice);
      if (
        !lineItemDraft.description.trim() &&
        (!lineItemDraft.quantity || quantityNum <= 0)
      ) {
        return null;
      }

      const discountInput =
        lineItemDraft.discountType === "fixed" && lineItemDraft.discountValue
          ? { type: "fixed" as const, value: Number(lineItemDraft.discountValue) }
          : lineItemDraft.discountType === "percent" && lineItemDraft.discountValue
            ? { type: "percent" as const, value: Number(lineItemDraft.discountValue) }
            : null;

      const taxPercentNum =
        lineItemDraft.taxPercent.trim() !== "" ? Number(lineItemDraft.taxPercent) : null;

      const calc = calculateLineItem({
        description: lineItemDraft.description || "Draft Line Item",
        quantity: quantityNum,
        unitPriceCents: Math.round(unitPriceNum * 100),
        discount: discountInput,
        taxPercent: taxPercentNum,
      });

      return { calc, error: null };
    } catch (err) {
      if (err instanceof PricingCalculationError) {
        return { calc: null, error: err.message };
      }
      return null;
    }
  }, [lineItemDraft]);

  // Compute calculated values for all persisted line items
  const computedLines = useMemo(() => {
    return document.lineItems.map((item) => {
      try {
        const discountInput =
          item.discount?.type === "fixed"
            ? { type: "fixed" as const, value: item.discount.amountCents / 100 }
            : item.discount?.type === "percent"
              ? { type: "percent" as const, value: item.discount.percentage }
              : null;

        const calc = calculateLineItem({
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discount: discountInput,
          taxPercent: item.taxPercent ?? null,
        });
        return { item, calc, error: null };
      } catch {
        return { item, calc: null, error: "Calculation failed" };
      }
    });
  }, [document.lineItems]);

  async function readJson(response: Response) {
    return (await response.json().catch(() => null)) as unknown;
  }

  function syncDocument(nextDocument: SerializedDocument) {
    setDocument(nextDocument);
    setMetadata({
      title: nextDocument.title,
      customer: nextDocument.customer,
      issueDate: nextDocument.issueDate,
    });
  }

  function resetLineItemForm() {
    setLineItemDraft(emptyLineItemDraft);
    setEditingLineItemId(null);
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  async function handleDuplicate() {
    setDuplicatePending(true);
    try {
      const response = await fetch(`/api/documents/${document.id}/duplicate`, {
        method: "POST",
      });
      const payload = await readJson(response);

      if (!response.ok) {
        showToast(parseErrorMessage(payload, "Unable to duplicate document"));
        setDuplicatePending(false);
        return;
      }

      const newDoc = (payload as { document: SerializedDocument }).document;
      showToast("Document duplicated to new draft!");
      router.push(`/documents/${newDoc.id}`);
    } catch {
      showToast("Failed to duplicate document");
      setDuplicatePending(false);
    }
  }

  async function handleDeleteDocument() {
    setDeleteDocPending(true);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await readJson(response);
        showToast(parseErrorMessage(payload, "Unable to delete document"));
        setDeleteDocPending(false);
        setShowDeleteModal(false);
        return;
      }
      showToast("Document deleted");
      router.push("/documents");
    } catch {
      showToast("Failed to delete document");
      setDeleteDocPending(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      {/* Toast notification banner */}
      {toastMessage ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-5 py-3 text-sm text-[var(--foreground)] shadow-xl backdrop-blur-md">
          {toastMessage}
        </div>
      ) : null}

      {/* Header section */}
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
            <span>Document Workspace</span>
            {document.duplicatedFromDocumentId ? (
              <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-0.5 text-[10px] text-[var(--accent)]">
                Cloned
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
              {document.title}
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                isDraft
                  ? "border border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-medium"
              }`}
            >
              {isDraft ? "Draft" : "Finalized 🔒"}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Customer: <strong className="text-[var(--foreground)]">{document.customer}</strong> • Issue date: <strong className="text-[var(--foreground)]">{document.issueDate}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
            href="/documents"
          >
            ← Back
          </Link>
          <button
            className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-raised)] disabled:opacity-50"
            disabled={duplicatePending}
            onClick={handleDuplicate}
            type="button"
          >
            {duplicatePending ? "Duplicating..." : "Duplicate to Draft"}
          </button>
          {isDraft ? (
            <>
              <button
                className="rounded-full border border-[var(--danger-border)] px-4 py-2 text-sm text-[var(--danger-text)] transition hover:bg-[var(--danger-surface)] disabled:opacity-50"
                onClick={() => setShowDeleteModal(true)}
                type="button"
              >
                Delete
              </button>
              <FinalizeDocumentButton
                documentId={document.id}
                onFinalized={(nextDocument) => {
                  syncDocument(nextDocument);
                  resetLineItemForm();
                  showToast("Document successfully finalized!");
                }}
              />
            </>
          ) : (
            <p className="text-xs text-[var(--muted)]">
              Finalized on {new Date(document.finalizedAt ?? document.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Read-Only Status Banner if Finalized */}
      {!isDraft ? (
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-medium text-emerald-100">Document Finalized & Immutable</p>
              <p className="mt-0.5 text-xs text-emerald-300/80">
                This pricing document has been finalized. All line items, calculations, and metadata are locked.
                If you need to make edits, use the <strong>&quot;Duplicate to Draft&quot;</strong> button above.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Summary KPI Stats */}
      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {headerStats.map((item) => (
          <article
            key={item.label}
            className="rounded-[20px] border border-[var(--border)] bg-[var(--surface-raised)] p-5 transition hover:border-[var(--muted)]/40"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              {item.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {item.value}
            </p>
          </article>
        ))}
      </section>

      {/* Main Grid: Document details & Line items */}
      <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        {/* Left Column: Metadata form */}
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-6">
          <div>
            <h2 className="text-lg font-medium text-[var(--foreground)]">
              Document Details
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Title, customer name, and issue date. Immutable once finalized.
            </p>
          </div>

          <form
            className="mt-6 grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!isDraft) return;

              setMetadataPending(true);
              setMetadataError(null);

              startTransition(async () => {
                const response = await fetch(`/api/documents/${document.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(metadata),
                });
                const payload = await readJson(response);

                if (!response.ok) {
                  setMetadataError(parseErrorMessage(payload, "Unable to update document"));
                  setMetadataPending(false);
                  return;
                }

                syncDocument((payload as { document: SerializedDocument }).document);
                setMetadataPending(false);
                showToast("Document details updated");
                router.refresh();
              });
            }}
          >
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span>Title</span>
              <input
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isDraft || metadataPending}
                onChange={(event) =>
                  setMetadata((current) => ({ ...current, title: event.target.value }))
                }
                value={metadata.title}
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span>Customer</span>
              <input
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isDraft || metadataPending}
                onChange={(event) =>
                  setMetadata((current) => ({
                    ...current,
                    customer: event.target.value,
                  }))
                }
                value={metadata.customer}
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--muted)]">
              <span>Issue Date</span>
              <input
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isDraft || metadataPending}
                onChange={(event) =>
                  setMetadata((current) => ({
                    ...current,
                    issueDate: event.target.value,
                  }))
                }
                type="date"
                value={metadata.issueDate}
              />
            </label>

            {metadataError ? (
              <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger-text)]">
                {metadataError}
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3 pt-2">
              <p className="text-xs text-[var(--muted)]">
                {isDraft ? "Draft mode: editable" : "Finalized: read-only"}
              </p>
              <button
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!isDraft || metadataPending}
                type="submit"
              >
                {metadataPending ? "Saving..." : "Save details"}
              </button>
            </div>
          </form>
        </article>

        {/* Right Column: Line items editor and breakdown table */}
        <article className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-medium text-[var(--foreground)]">
                Line Items
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Server-calculated subtotals, discounts, taxes, and line totals.
              </p>
            </div>
            <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
              {document.lineItems.length} item{document.lineItems.length === 1 ? "" : "s"}
            </div>
          </div>

          {/* Line item add/edit form (only enabled in draft) */}
          {isDraft ? (
            <form
              className="mt-6 grid gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--surface-soft)] p-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!isDraft) return;

                setLineItemPending(true);
                setLineItemError(null);

                const isEditing = Boolean(editingLineItemId);
                const url = isEditing
                  ? `/api/documents/${document.id}/line-items/${editingLineItemId}`
                  : `/api/documents/${document.id}/line-items`;
                const method = isEditing ? "PATCH" : "POST";

                startTransition(async () => {
                  const response = await fetch(url, {
                    method,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(buildLineItemPayload(lineItemDraft)),
                  });
                  const payload = await readJson(response);

                  if (!response.ok) {
                    setLineItemError(parseErrorMessage(payload, "Unable to save line item"));
                    setLineItemPending(false);
                    return;
                  }

                  syncDocument((payload as { document: SerializedDocument }).document);
                  resetLineItemForm();
                  setLineItemPending(false);
                  showToast(isEditing ? "Line item updated" : "Line item added");
                  router.refresh();
                });
              }}
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {editingLineItemId ? "✏️ Edit Line Item" : "➕ Add Line Item"}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm text-[var(--muted)] md:col-span-2">
                  <span>Description</span>
                  <input
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
                    disabled={lineItemPending}
                    onChange={(event) =>
                      setLineItemDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="e.g. Consulting Fee or Widget A"
                    value={lineItemDraft.description}
                  />
                </label>
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span>Quantity</span>
                  <input
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
                    disabled={lineItemPending}
                    min="1"
                    onChange={(event) =>
                      setLineItemDraft((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    step="1"
                    type="number"
                    value={lineItemDraft.quantity}
                  />
                </label>
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span>Unit price ($)</span>
                  <input
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
                    disabled={lineItemPending}
                    min="0"
                    onChange={(event) =>
                      setLineItemDraft((current) => ({
                        ...current,
                        unitPrice: event.target.value,
                      }))
                    }
                    step="0.01"
                    type="number"
                    value={lineItemDraft.unitPrice}
                  />
                </label>
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span>Discount type</span>
                  <select
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
                    disabled={lineItemPending}
                    onChange={(event) =>
                      setLineItemDraft((current) => ({
                        ...current,
                        discountType: event.target.value as DiscountType,
                        discountValue:
                          event.target.value === "none" ? "" : current.discountValue,
                      }))
                    }
                    value={lineItemDraft.discountType}
                  >
                    <option value="none">No discount</option>
                    <option value="fixed">Fixed amount ($)</option>
                    <option value="percent">Percent (%)</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-[var(--muted)]">
                  <span>
                    Discount value {lineItemDraft.discountType === "percent" ? "(%)" : "($)"}
                  </span>
                  <input
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)] disabled:opacity-50"
                    disabled={lineItemPending || lineItemDraft.discountType === "none"}
                    min="0"
                    onChange={(event) =>
                      setLineItemDraft((current) => ({
                        ...current,
                        discountValue: event.target.value,
                      }))
                    }
                    placeholder={lineItemDraft.discountType === "none" ? "N/A" : "0.00"}
                    step="0.01"
                    type="number"
                    value={lineItemDraft.discountValue}
                  />
                </label>
                <label className="grid gap-2 text-sm text-[var(--muted)] md:col-span-2">
                  <span>Tax percent (%)</span>
                  <input
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2.5 text-[var(--foreground)] outline-none transition focus:border-[var(--foreground)]"
                    disabled={lineItemPending}
                    min="0"
                    onChange={(event) =>
                      setLineItemDraft((current) => ({
                        ...current,
                        taxPercent: event.target.value,
                      }))
                    }
                    placeholder="Optional, e.g. 5"
                    step="0.01"
                    type="number"
                    value={lineItemDraft.taxPercent}
                  />
                </label>
              </div>

              {/* Real-time live calculation preview */}
              {livePreview ? (
                livePreview.calc ? (
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-200">
                    <div className="font-semibold text-blue-300 uppercase tracking-wider mb-1">
                      Live Calculation Preview
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div>
                        Subtotal: <strong className="text-white">{money(livePreview.calc.subtotalCents)}</strong>
                      </div>
                      <div>
                        Discount: <strong className="text-white">-{money(livePreview.calc.discountAmountCents)}</strong>
                      </div>
                      <div>
                        Tax: <strong className="text-white">+{money(livePreview.calc.taxAmountCents)}</strong>
                      </div>
                      <div>
                        Line Total: <strong className="text-emerald-300 font-bold">{money(livePreview.calc.lineTotalCents)}</strong>
                      </div>
                    </div>
                  </div>
                ) : livePreview.error ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-300">
                    ⚠️ {livePreview.error}
                  </div>
                ) : null
              ) : null}

              {lineItemError ? (
                <div className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger-text)]">
                  {lineItemError}
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex flex-wrap items-center gap-3">
                  {editingLineItemId ? (
                    <button
                      className="rounded-full border border-[var(--border)] px-4 py-2 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-raised)]"
                      disabled={lineItemPending}
                      onClick={() => {
                        resetLineItemForm();
                        setLineItemError(null);
                      }}
                      type="button"
                    >
                      Cancel edit
                    </button>
                  ) : null}
                  <button
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:opacity-60"
                    disabled={lineItemPending}
                    type="submit"
                  >
                    {lineItemPending
                      ? "Saving..."
                      : editingLineItemId
                        ? "Update Line Item"
                        : "Add Line Item"}
                  </button>
                </div>
              </div>
            </form>
          ) : null}

          {/* Line items table with calculated subtotal, discount, tax, line total */}
          <div className="mt-6 overflow-x-auto rounded-[20px] border border-[var(--border)]">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-[var(--surface-soft)] uppercase tracking-[0.14em] text-[var(--muted)]">
                <tr>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3">Subtotal</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Tax</th>
                  <th className="px-4 py-3">Line Total</th>
                  {isDraft ? <th className="px-4 py-3 text-right">Actions</th> : null}
                </tr>
              </thead>
              <tbody className="bg-[var(--surface-raised)] divide-y divide-[var(--border)]">
                {computedLines.length === 0 ? (
                  <tr>
                    <td
                      className="px-4 py-8 text-center text-sm text-[var(--muted)]"
                      colSpan={isDraft ? 8 : 7}
                    >
                      No line items added yet.
                    </td>
                  </tr>
                ) : (
                  computedLines.map(({ item, calc, error }) => (
                    <tr key={item.id} className="transition hover:bg-[var(--surface-soft)]/50">
                      <td className="px-4 py-3.5 font-medium text-[var(--foreground)]">
                        {item.description}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--muted)]">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--muted)]">
                        {money(item.unitPriceCents)}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--foreground)]">
                        {calc ? money(calc.subtotalCents) : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--muted)]">
                        {calc && calc.discountAmountCents > 0 ? (
                          <span className="text-amber-300 font-medium">
                            -{money(calc.discountAmountCents)}
                            <span className="text-[10px] text-[var(--muted)] ml-1">
                              ({item.discount?.type === "fixed" ? "fixed" : `${item.discount?.percentage}%`})
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-[var(--muted)]">
                        {calc && calc.taxAmountCents > 0 ? (
                          <span className="text-blue-300">
                            +{money(calc.taxAmountCents)}
                            <span className="text-[10px] text-[var(--muted)] ml-1">
                              ({item.taxPercent}%)
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[var(--foreground)]">
                        {calc ? money(calc.lineTotalCents) : error ? "Error" : "—"}
                      </td>
                      {isDraft ? (
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
                              disabled={lineItemPending}
                              onClick={() => {
                                setLineItemDraft(toLineItemDraft(item));
                                setEditingLineItemId(item.id);
                                setLineItemError(null);
                              }}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="rounded-full border border-[var(--danger-border)] px-3 py-1 text-xs text-[var(--danger-text)] transition hover:bg-[var(--danger-surface)]"
                              disabled={deletePendingId === item.id}
                              onClick={() => {
                                setDeletePendingId(item.id);
                                setLineItemError(null);

                                startTransition(async () => {
                                  const response = await fetch(
                                    `/api/documents/${document.id}/line-items/${item.id}`,
                                    { method: "DELETE" },
                                  );
                                  const payload = await readJson(response);

                                  if (!response.ok) {
                                    setLineItemError(
                                      parseErrorMessage(
                                        payload,
                                        "Unable to delete line item",
                                      ),
                                    );
                                    setDeletePendingId(null);
                                    return;
                                  }

                                  syncDocument(
                                    (payload as { document: SerializedDocument }).document,
                                  );
                                  if (editingLineItemId === item.id) {
                                    resetLineItemForm();
                                  }
                                  setDeletePendingId(null);
                                  showToast("Line item deleted");
                                  router.refresh();
                                });
                              }}
                              type="button"
                            >
                              {deletePendingId === item.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-[var(--danger-text)]">
              Delete Document?
            </h3>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Are you sure you want to delete <strong className="text-white">&quot;{document.title}&quot;</strong>? This document and all its line items will be permanently removed.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
                disabled={deleteDocPending}
                onClick={() => setShowDeleteModal(false)}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                disabled={deleteDocPending}
                onClick={handleDeleteDocument}
                type="button"
              >
                {deleteDocPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
