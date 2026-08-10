"use client";

import Link from "next/link";
import { calculateLineItem } from "@/lib/calculations";
import type { SerializedDocument } from "@/lib/documents/types";

type PrintableDocumentProps = {
  document: SerializedDocument;
};

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function PrintableDocument({ document }: PrintableDocumentProps) {
  const computedLines = document.lineItems.map((item) => {
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
      return { item, calc };
    } catch {
      return { item, calc: null };
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 print:bg-white print:p-0 print:text-black">
      {/* Top action controls (hidden on print) */}
      <div className="mx-auto mb-8 flex max-w-4xl items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-lg print:hidden">
        <Link
          className="rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 transition hover:bg-slate-700"
          href={`/documents/${document.id}`}
        >
          ← Back to Workspace
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Use browser print dialog to save as PDF or print
          </span>
          <button
            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 shadow-md"
            onClick={() => window.print()}
            type="button"
          >
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Main Printable Document Card */}
      <main className="mx-auto max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl print:max-w-none print:rounded-none print:border-none print:bg-white print:p-0 print:shadow-none">
        {/* Document Header */}
        <header className="border-b border-slate-800 pb-6 print:border-slate-300">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 print:text-slate-600">
                PRICING DOCUMENT & PROPOSAL
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white print:text-black">
                {document.title}
              </h1>
              <p className="mt-1 text-xs text-slate-400 print:text-slate-600">
                Ref ID: <code className="font-mono">{document.id}</code>
              </p>
            </div>
            <div className="text-right">
              <span
                className={`inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
                  document.status === "finalized"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 print:border-slate-400 print:bg-slate-100 print:text-slate-900"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/30 print:border-slate-400 print:bg-slate-100 print:text-slate-900"
                }`}
              >
                {document.status === "finalized" ? "FINALIZED 🔒" : "DRAFT"}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <span className="block text-xs uppercase tracking-wider text-slate-400 print:text-slate-500">
                Customer Name
              </span>
              <strong className="mt-1 block text-slate-200 print:text-black font-semibold">
                {document.customer}
              </strong>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wider text-slate-400 print:text-slate-500">
                Issue Date
              </span>
              <strong className="mt-1 block text-slate-200 print:text-black">
                {document.issueDate}
              </strong>
            </div>
            <div>
              <span className="block text-xs uppercase tracking-wider text-slate-400 print:text-slate-500">
                Line Items
              </span>
              <strong className="mt-1 block text-slate-200 print:text-black">
                {document.lineItems.length} item{document.lineItems.length === 1 ? "" : "s"}
              </strong>
            </div>
          </div>
        </header>

        {/* Itemized Line Items Table */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 print:text-slate-700">
            Itemized Pricing Breakdown
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/50 uppercase tracking-wider text-slate-400 print:border-slate-300 print:bg-slate-100 print:text-slate-700">
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="px-3 py-2.5 text-right">Qty</th>
                  <th className="px-3 py-2.5 text-right">Unit Price</th>
                  <th className="px-3 py-2.5 text-right">Subtotal</th>
                  <th className="px-3 py-2.5 text-right">Discount</th>
                  <th className="px-3 py-2.5 text-right">Tax</th>
                  <th className="px-3 py-2.5 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                {computedLines.length === 0 ? (
                  <tr>
                    <td
                      className="px-3 py-6 text-center text-sm text-slate-400 print:text-slate-600"
                      colSpan={8}
                    >
                      No line items included.
                    </td>
                  </tr>
                ) : (
                  computedLines.map(({ item, calc }, index) => (
                    <tr key={item.id} className="print:text-black">
                      <td className="px-3 py-3 text-slate-500 print:text-slate-600">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-200 print:text-black">
                        {item.description}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-300 print:text-black">
                        {item.quantity}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-300 print:text-black">
                        {money(item.unitPriceCents)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-300 print:text-black">
                        {calc ? money(calc.subtotalCents) : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-amber-400 print:text-black">
                        {calc && calc.discountAmountCents > 0
                          ? `-${money(calc.discountAmountCents)}`
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-right text-blue-400 print:text-black">
                        {calc && calc.taxAmountCents > 0
                          ? `+${money(calc.taxAmountCents)}`
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-100 print:text-black">
                        {calc ? money(calc.lineTotalCents) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Document Totals Section */}
        <section className="mt-8 flex justify-end border-t border-slate-800 pt-6 print:border-slate-300">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-slate-400 print:text-slate-600">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-200 print:text-black">
                {money(document.totals.subtotalCents)}
              </span>
            </div>
            <div className="flex justify-between text-amber-400 print:text-slate-600">
              <span>Total Discount:</span>
              <span className="font-medium">
                -{money(document.totals.totalDiscountCents)}
              </span>
            </div>
            <div className="flex justify-between text-blue-400 print:text-slate-600">
              <span>Total Tax:</span>
              <span className="font-medium">
                +{money(document.totals.totalTaxCents)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-800 pt-2 text-base font-bold text-white print:border-slate-400 print:text-black">
              <span>Grand Total:</span>
              <span className="text-emerald-400 print:text-black">
                {money(document.totals.grandTotalCents)}
              </span>
            </div>
          </div>
        </section>

        {/* Document Footnote / Sign-off */}
        <footer className="mt-12 border-t border-slate-800 pt-6 text-xs text-slate-500 print:border-slate-300 print:text-slate-600">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Generated by Multi-Rate Pricing Calculator • All totals computed server-side.
            </p>
            <p>
              Status: <strong className="text-slate-400 print:text-slate-700 uppercase">{document.status}</strong>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
