import { describe, expect, it } from "vitest";

import {
  calculateDocument,
  calculateLineItem,
  PricingCalculationError,
} from "@/lib/calculations";

describe("calculateLineItem", () => {
  it("calculates percent discount before tax", () => {
    const result = calculateLineItem({
      description: "Widget A",
      quantity: 2,
      unitPriceCents: 10_000,
      discount: { type: "percent", value: 10 },
      taxPercent: 5,
    });

    expect(result.subtotalCents).toBe(20_000);
    expect(result.discountAmountCents).toBe(2_000);
    expect(result.afterDiscountCents).toBe(18_000);
    expect(result.taxAmountCents).toBe(900);
    expect(result.lineTotalCents).toBe(18_900);
  });

  it("calculates fixed discount lines with no tax", () => {
    const result = calculateLineItem({
      description: "Service fee",
      quantity: 1,
      unitPriceCents: 20_000,
      discount: { type: "fixed", value: 20 },
      taxPercent: null,
    });

    expect(result.subtotalCents).toBe(20_000);
    expect(result.discountAmountCents).toBe(2_000);
    expect(result.afterDiscountCents).toBe(18_000);
    expect(result.taxAmountCents).toBe(0);
    expect(result.lineTotalCents).toBe(18_000);
  });

  it("supports fractional quantities with line-level rounding", () => {
    const result = calculateLineItem({
      description: "Fractional item",
      quantity: 1.25,
      unitPriceCents: 999,
      taxPercent: 5,
    });

    expect(result.subtotalCents).toBe(1_249);
    expect(result.taxAmountCents).toBe(62);
    expect(result.lineTotalCents).toBe(1_311);
  });

  it("rejects fixed discounts above the line subtotal", () => {
    expect(() =>
      calculateLineItem({
        description: "Invalid fixed discount",
        quantity: 1,
        unitPriceCents: 500,
        discount: { type: "fixed", value: 6 },
      }),
    ).toThrowError(PricingCalculationError);
  });

  it("rejects invalid percent values", () => {
    expect(() =>
      calculateLineItem({
        description: "Invalid percent discount",
        quantity: 1,
        unitPriceCents: 500,
        discount: { type: "percent", value: 120 },
      }),
    ).toThrow("discount percent must be between 0 and 100");
  });
});

describe("calculateDocument", () => {
  it("matches the assignment sample totals exactly", () => {
    const result = calculateDocument([
      {
        description: "Widget A",
        quantity: 2,
        unitPriceCents: 10_000,
        discount: { type: "percent", value: 10 },
        taxPercent: 5,
      },
      {
        description: "Widget B",
        quantity: 1,
        unitPriceCents: 5_000,
        taxPercent: 5,
      },
      {
        description: "Service fee",
        quantity: 1,
        unitPriceCents: 20_000,
        discount: { type: "fixed", value: 20 },
      },
    ]);

    expect(result.lineItems.map((lineItem) => lineItem.lineTotalCents)).toEqual([
      18_900,
      5_250,
      18_000,
    ]);
    expect(result.totals.subtotalCents).toBe(45_000);
    expect(result.totals.totalDiscountCents).toBe(4_000);
    expect(result.totals.totalTaxCents).toBe(1_150);
    expect(result.totals.grandTotalCents).toBe(42_150);
  });
});
