import type { DocumentTotalsRecord } from "@/lib/db/types";

export type SerializedLineItemDiscount =
  | {
      type: "fixed";
      amountCents: number;
    }
  | {
      type: "percent";
      percentage: number;
    }
  | null;

export type SerializedLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discount?: SerializedLineItemDiscount;
  taxPercent?: number | null;
};

export type SerializedDocument = {
  id: string;
  userId: string;
  title: string;
  customer: string;
  issueDate: string;
  status: "draft" | "finalized";
  lineItems: SerializedLineItem[];
  totals: DocumentTotalsRecord;
  finalizedAt: string | null;
  duplicatedFromDocumentId: string | null;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
};
