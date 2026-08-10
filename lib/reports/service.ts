import type { Filter } from "mongodb";

import { ApiError } from "@/lib/api/errors";
import { collections } from "@/lib/db/collections";
import { getAppDb } from "@/lib/db/mongodb";
import type { DocumentRecord } from "@/lib/db/types";
import {
  reportRangeSchema,
  type ReportRangeInput,
} from "@/lib/reports/schemas";

export type ReportSummary = {
  from: string;
  to: string;
  documentCount: number;
  grandTotalCents: number;
  totalTaxCents: number;
  totalDiscountCents: number;
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
  const to = today.toISOString().slice(0, 10);
  const fromDate = new Date(today);
  fromDate.setUTCDate(fromDate.getUTCDate() - 29);

  return {
    from: fromDate.toISOString().slice(0, 10),
    to,
  };
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
      grandTotalCents: number;
      totalTaxCents: number;
      totalDiscountCents: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: null,
          documentCount: { $sum: 1 },
          grandTotalCents: { $sum: "$totals.grandTotalCents" },
          totalTaxCents: { $sum: "$totals.totalTaxCents" },
          totalDiscountCents: { $sum: "$totals.totalDiscountCents" },
        },
      },
      {
        $project: {
          _id: 0,
          documentCount: 1,
          grandTotalCents: 1,
          totalTaxCents: 1,
          totalDiscountCents: 1,
        },
      },
    ])
    .toArray();

  return {
    from: range.from,
    to: range.to,
    documentCount: summary?.documentCount ?? 0,
    grandTotalCents: summary?.grandTotalCents ?? 0,
    totalTaxCents: summary?.totalTaxCents ?? 0,
    totalDiscountCents: summary?.totalDiscountCents ?? 0,
  };
}
