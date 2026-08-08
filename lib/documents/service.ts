import { randomUUID } from "node:crypto";

import { ObjectId } from "mongodb";

import { ApiError } from "@/lib/api/errors";
import {
  calculateDocument,
  PricingCalculationError,
  type CalculationLineItemInput,
} from "@/lib/calculations";
import { collections } from "@/lib/db/collections";
import { getAppDb } from "@/lib/db/mongodb";
import type {
  DocumentRecord,
  LineItemDiscountRecord,
  LineItemRecord,
} from "@/lib/db/types";
import type {
  CreateDocumentInput,
  CreateLineItemInput,
  UpdateDocumentInput,
  UpdateLineItemInput,
} from "@/lib/documents/schemas";

function parseDocumentId(documentId: string) {
  if (!ObjectId.isValid(documentId)) {
    throw new ApiError(400, "Invalid document id");
  }

  return new ObjectId(documentId);
}

function toCents(amount: number, label: string) {
  if (!Number.isFinite(amount)) {
    throw new ApiError(400, `${label} must be a finite number`);
  }

  const cents = Math.round(amount * 100);

  if (Math.abs(cents - amount * 100) > 1e-9) {
    throw new ApiError(400, `${label} supports at most 2 decimal places`);
  }

  return cents;
}

function toStoredDiscount(
  discount: CreateLineItemInput["discount"] | UpdateLineItemInput["discount"],
): LineItemDiscountRecord | null {
  if (!discount) {
    return null;
  }

  if (discount.type === "fixed") {
    return {
      type: "fixed",
      amountCents: toCents(discount.value, "Fixed discount"),
    };
  }

  return {
    type: "percent",
    percentage: discount.value,
  };
}

function toCalculationInput(lineItem: LineItemRecord): CalculationLineItemInput {
  return {
    description: lineItem.description,
    quantity: lineItem.quantity,
    unitPriceCents: lineItem.unitPriceCents,
    discount:
      lineItem.discount?.type === "fixed"
        ? { type: "fixed", value: lineItem.discount.amountCents / 100 }
        : lineItem.discount?.type === "percent"
          ? { type: "percent", value: lineItem.discount.percentage }
          : null,
    taxPercent: lineItem.taxPercent ?? null,
  };
}

function toLineItemRecord(input: CreateLineItemInput): LineItemRecord {
  return {
    id: randomUUID(),
    description: input.description,
    quantity: input.quantity,
    unitPriceCents: toCents(input.unitPrice, "Unit price"),
    discount: toStoredDiscount(input.discount),
    taxPercent: input.taxPercent ?? null,
  };
}

function mergeLineItemRecord(
  existing: LineItemRecord,
  input: UpdateLineItemInput,
): LineItemRecord {
  return {
    ...existing,
    description: input.description ?? existing.description,
    quantity: input.quantity ?? existing.quantity,
    unitPriceCents:
      input.unitPrice == null
        ? existing.unitPriceCents
        : toCents(input.unitPrice, "Unit price"),
    discount:
      input.discount === undefined
        ? existing.discount ?? null
        : toStoredDiscount(input.discount),
    taxPercent:
      input.taxPercent === undefined ? existing.taxPercent ?? null : input.taxPercent,
  };
}

function computePersistedValues(lineItems: LineItemRecord[]) {
  try {
    const calculated = calculateDocument(lineItems.map(toCalculationInput));

    return {
      lineItems,
      totals: calculated.totals,
    };
  } catch (error) {
    if (error instanceof PricingCalculationError) {
      throw new ApiError(400, error.message);
    }

    throw error;
  }
}

function serializeDocument(document: DocumentRecord) {
  return {
    id: document._id.toString(),
    userId: document.userId,
    title: document.title,
    customer: document.customer,
    issueDate: document.issueDate.toISOString().slice(0, 10),
    status: document.status,
    lineItems: document.lineItems,
    totals: document.totals,
    finalizedAt: document.finalizedAt?.toISOString() ?? null,
    duplicatedFromDocumentId: document.duplicatedFromDocumentId?.toString() ?? null,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    schemaVersion: document.schemaVersion,
  };
}

async function getOwnedDocument(userId: string, documentId: string) {
  const db = await getAppDb();
  const _id = parseDocumentId(documentId);
  const document = await db
    .collection<DocumentRecord>(collections.documents)
    .findOne({ _id, userId });

  if (!document) {
    throw new ApiError(404, "Document not found");
  }

  return document;
}

function assertDocumentIsEditable(document: DocumentRecord) {
  if (document.status === "finalized") {
    throw new ApiError(409, "Finalized documents cannot be modified");
  }
}

export async function listDocuments(userId: string) {
  const db = await getAppDb();
  const documents = await db
    .collection<DocumentRecord>(collections.documents)
    .find({ userId })
    .sort({ updatedAt: -1 })
    .toArray();

  return documents.map(serializeDocument);
}

export async function createDocument(userId: string, input: CreateDocumentInput) {
  const db = await getAppDb();
  const now = new Date();
  const { lineItems, totals } = computePersistedValues(
    input.lineItems.map(toLineItemRecord),
  );

  const document: Omit<DocumentRecord, "_id"> = {
    userId,
    title: input.title,
    customer: input.customer,
    issueDate: new Date(input.issueDate),
    status: "draft",
    lineItems,
    totals,
    finalizedAt: null,
    duplicatedFromDocumentId: null,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
  };

  const result = await db
    .collection<DocumentRecord>(collections.documents)
    .insertOne(document as DocumentRecord);

  return serializeDocument({
    ...document,
    _id: result.insertedId,
  });
}

export async function getDocument(userId: string, documentId: string) {
  const document = await getOwnedDocument(userId, documentId);
  return serializeDocument(document);
}

export async function updateDocument(
  userId: string,
  documentId: string,
  input: UpdateDocumentInput,
) {
  const db = await getAppDb();
  const document = await getOwnedDocument(userId, documentId);
  assertDocumentIsEditable(document);

  const nextDocument: DocumentRecord = {
    ...document,
    title: input.title ?? document.title,
    customer: input.customer ?? document.customer,
    issueDate: input.issueDate ? new Date(input.issueDate) : document.issueDate,
    updatedAt: new Date(),
  };

  await db.collection<DocumentRecord>(collections.documents).updateOne(
    { _id: document._id, userId },
    {
      $set: {
        title: nextDocument.title,
        customer: nextDocument.customer,
        issueDate: nextDocument.issueDate,
        updatedAt: nextDocument.updatedAt,
      },
    },
  );

  return serializeDocument(nextDocument);
}

export async function deleteDocument(userId: string, documentId: string) {
  const db = await getAppDb();
  const document = await getOwnedDocument(userId, documentId);
  assertDocumentIsEditable(document);

  await db
    .collection<DocumentRecord>(collections.documents)
    .deleteOne({ _id: document._id, userId });
}

export async function addLineItem(
  userId: string,
  documentId: string,
  input: CreateLineItemInput,
) {
  const db = await getAppDb();
  const document = await getOwnedDocument(userId, documentId);
  assertDocumentIsEditable(document);

  const nextLineItems = [...document.lineItems, toLineItemRecord(input)];
  const { lineItems, totals } = computePersistedValues(nextLineItems);
  const updatedAt = new Date();

  await db.collection<DocumentRecord>(collections.documents).updateOne(
    { _id: document._id, userId },
    {
      $set: {
        lineItems,
        totals,
        updatedAt,
      },
    },
  );

  return serializeDocument({
    ...document,
    lineItems,
    totals,
    updatedAt,
  });
}

export async function updateLineItem(
  userId: string,
  documentId: string,
  lineItemId: string,
  input: UpdateLineItemInput,
) {
  const db = await getAppDb();
  const document = await getOwnedDocument(userId, documentId);
  assertDocumentIsEditable(document);

  const lineItemExists = document.lineItems.some((lineItem) => lineItem.id === lineItemId);

  if (!lineItemExists) {
    throw new ApiError(404, "Line item not found");
  }

  const nextLineItems = document.lineItems.map((lineItem) =>
    lineItem.id === lineItemId ? mergeLineItemRecord(lineItem, input) : lineItem,
  );
  const { lineItems, totals } = computePersistedValues(nextLineItems);
  const updatedAt = new Date();

  await db.collection<DocumentRecord>(collections.documents).updateOne(
    { _id: document._id, userId },
    {
      $set: {
        lineItems,
        totals,
        updatedAt,
      },
    },
  );

  return serializeDocument({
    ...document,
    lineItems,
    totals,
    updatedAt,
  });
}

export async function deleteLineItem(
  userId: string,
  documentId: string,
  lineItemId: string,
) {
  const db = await getAppDb();
  const document = await getOwnedDocument(userId, documentId);
  assertDocumentIsEditable(document);

  const nextLineItems = document.lineItems.filter(
    (lineItem) => lineItem.id !== lineItemId,
  );

  if (nextLineItems.length === document.lineItems.length) {
    throw new ApiError(404, "Line item not found");
  }

  const { lineItems, totals } = computePersistedValues(nextLineItems);
  const updatedAt = new Date();

  await db.collection<DocumentRecord>(collections.documents).updateOne(
    { _id: document._id, userId },
    {
      $set: {
        lineItems,
        totals,
        updatedAt,
      },
    },
  );

  return serializeDocument({
    ...document,
    lineItems,
    totals,
    updatedAt,
  });
}
