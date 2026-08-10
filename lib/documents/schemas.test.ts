import { describe, expect, it } from "vitest";
import {
  createDocumentSchema,
  lineItemInputSchema,
  updateDocumentSchema,
  updateLineItemSchema,
} from "./schemas";

describe("lineItemInputSchema", () => {
  it("validates a standard line item", () => {
    const input = {
      description: " Consulting Work ",
      quantity: 5,
      unitPrice: 150.5,
      discount: { type: "percent", value: 10 },
      taxPercent: 5.5,
    };
    const parsed = lineItemInputSchema.parse(input);
    expect(parsed.description).toBe("Consulting Work");
    expect(parsed.quantity).toBe(5);
    expect(parsed.unitPrice).toBe(150.5);
    expect(parsed.discount).toEqual({ type: "percent", value: 10 });
    expect(parsed.taxPercent).toBe(5.5);
  });

  it("rejects empty description", () => {
    expect(() =>
      lineItemInputSchema.parse({
        description: "   ",
        quantity: 1,
        unitPrice: 10,
      }),
    ).toThrow("Description is required");
  });

  it("rejects quantity less than 1", () => {
    expect(() =>
      lineItemInputSchema.parse({
        description: "Test Item",
        quantity: 0,
        unitPrice: 10,
      }),
    ).toThrow("Quantity must be at least 1");
  });

  it("rejects negative unit price", () => {
    expect(() =>
      lineItemInputSchema.parse({
        description: "Test Item",
        quantity: 1,
        unitPrice: -5,
      }),
    ).toThrow("Unit price must be at least 0");
  });

  it("rejects invalid percent discount outside 0-100", () => {
    expect(() =>
      lineItemInputSchema.parse({
        description: "Test Item",
        quantity: 1,
        unitPrice: 100,
        discount: { type: "percent", value: 150 },
      }),
    ).toThrow("Percent must be at most 100");
  });

  it("rejects negative fixed discount", () => {
    expect(() =>
      lineItemInputSchema.parse({
        description: "Test Item",
        quantity: 1,
        unitPrice: 100,
        discount: { type: "fixed", value: -10 },
      }),
    ).toThrow("Fixed discount must be at least 0");
  });
});

describe("createDocumentSchema", () => {
  it("validates document creation payload", () => {
    const parsed = createDocumentSchema.parse({
      title: " Q3 Proposal ",
      customer: " Acme Corp ",
      issueDate: "2026-08-10",
      lineItems: [
        {
          description: "Service A",
          quantity: 2,
          unitPrice: 100,
        },
      ],
    });
    expect(parsed.title).toBe("Q3 Proposal");
    expect(parsed.customer).toBe("Acme Corp");
    expect(parsed.issueDate).toBe("2026-08-10");
    expect(parsed.lineItems).toHaveLength(1);
  });

  it("rejects invalid ISO issueDate", () => {
    expect(() =>
      createDocumentSchema.parse({
        title: "Proposal",
        customer: "Acme",
        issueDate: "2026/08/10",
      }),
    ).toThrow("Issue date must be a valid ISO date");
  });
});

describe("updateDocumentSchema & updateLineItemSchema", () => {
  it("requires at least one field for document update", () => {
    expect(() => updateDocumentSchema.parse({})).toThrow(
      "At least one document field must be provided",
    );
  });

  it("requires at least one field for line item update", () => {
    expect(() => updateLineItemSchema.parse({})).toThrow(
      "At least one line item field must be provided",
    );
  });
});
