import type { ObjectId } from "mongodb";

export type DocumentStatus = "draft" | "finalized";

export type LineItemDiscountRecord =
  | {
      type: "fixed";
      amountCents: number;
    }
  | {
      type: "percent";
      percentage: number;
    };

export type LineItemRecord = {
  id: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discount?: LineItemDiscountRecord | null;
  taxPercent?: number | null;
};

export type DocumentTotalsRecord = {
  subtotalCents: number;
  totalDiscountCents: number;
  totalTaxCents: number;
  grandTotalCents: number;
};

export type DocumentRecord = {
  _id: ObjectId;
  userId: string;
  title: string;
  customer: string;
  issueDate: Date;
  status: DocumentStatus;
  lineItems: LineItemRecord[];
  totals: DocumentTotalsRecord;
  finalizedAt?: Date | null;
  duplicatedFromDocumentId?: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  schemaVersion: 1;
};

export type AppUserRecord = {
  id: string;
  email: string;
  displayName?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type MigrationRecord = {
  _id: string;
  version: number;
  appliedAt: Date;
  note: string;
};
