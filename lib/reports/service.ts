import type { Filter } from "mongodb";

import { ApiError } from "@/lib/api/errors";
import { collections } from "@/lib/db/collections";
import { getAppDb } from "@/lib/db/mongodb";
import type { DocumentRecord } from "@/lib/db/types";
import {
  reportRangeSchema,
  type ReportRangeInput,
} from "@/lib/reports/schemas";

import type { SerializedDocument } from "@/lib/documents/types";

export type ReportSummary = {
  from: string;
  to: string;
  documentCount: number;
  subtotalCents: number;
  grandTotalCents: number;
  totalTaxCents: number;
  totalDiscountCents: number;
  documents: SerializedDocument[];
};

function parseDateOnlyUtc(value: string, label: string) {
  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, `${label} must be a valid ISO date`);
  }

  return parsed;
}

function toExclusiveEnd(date: Date) {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

export function getDefaultReportRange(today = new Date()): ReportRangeInput {
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  const to = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const past = new Date(year, month, day - 29);
  const from = `${past.getFullYear()}-${String(past.getMonth() + 1).padStart(2, "0")}-${String(past.getDate()).padStart(2, "0")}`;

  return { from, to };
}

export function normalizeReportRange(input: ReportRangeInput): ReportRangeInput {
  return reportRangeSchema.parse(input);
}

export async function getReportSummary(
  userId: string,
  input: ReportRangeInput,
): Promise<ReportSummary> {
  const range = normalizeReportRange(input);
  const fromDate = parseDateOnlyUtc(range.from, "From date");
  const toDate = parseDateOnlyUtc(range.to, "To date");
  const toExclusive = toExclusiveEnd(toDate);
  const db = await getAppDb();

  const match: Filter<DocumentRecord> = {
    userId,
    issueDate: {
      $gte: fromDate,
      $lt: toExclusive,
    },
  };

  const [summary] = await db
    .collection<DocumentRecord>(collections.documents)
    .aggregate<{
      documentCount: number;
      subtotalCents: number;
      grandTotalCents: number;
      totalTaxCents: number;
      totalDiscountCents: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: null,
          documentCount: { $sum: 1 },
          subtotalCents: { $sum: "$totals.subtotalCents" },
          grandTotalCents: { $sum: "$totals.grandTotalCents" },
          totalTaxCents: { $sum: "$totals.totalTaxCents" },
          totalDiscountCents: { $sum: "$totals.totalDiscountCents" },
        },
      },
      {
        $project: {
          _id: 0,
          documentCount: 1,
          subtotalCents: 1,
          grandTotalCents: 1,
          totalTaxCents: 1,
          totalDiscountCents: 1,
        },
      },
    ])
    .toArray();

  const matchingDocs = await db
    .collection<DocumentRecord>(collections.documents)
    .find(match)
    .sort({ issueDate: -1 })
    .toArray();

  const serializedDocuments: SerializedDocument[] = matchingDocs.map((doc) => ({
    id: doc._id.toString(),
    userId: doc.userId,
    title: doc.title,
    customer: doc.customer,
    issueDate: doc.issueDate.toISOString().slice(0, 10),
    status: doc.status,
    lineItems: doc.lineItems,
    totals: doc.totals,
    finalizedAt: doc.finalizedAt?.toISOString() ?? null,
    duplicatedFromDocumentId: doc.duplicatedFromDocumentId?.toString() ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    schemaVersion: doc.schemaVersion,
  }));

  return {
    from: range.from,
    to: range.to,
    documentCount: summary?.documentCount ?? 0,
    subtotalCents: summary?.subtotalCents ?? 0,
    grandTotalCents: summary?.grandTotalCents ?? 0,
    totalTaxCents: summary?.totalTaxCents ?? 0,
    totalDiscountCents: summary?.totalDiscountCents ?? 0,
    documents: serializedDocuments,
  };
}

