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

  it("supports zero unit price with zero total", () => {
    const result = calculateLineItem({
      description: "Free item",
      quantity: 5,
      unitPriceCents: 0,
      discount: null,
      taxPercent: 10,
    });

    expect(result.subtotalCents).toBe(0);
    expect(result.discountAmountCents).toBe(0);
    expect(result.afterDiscountCents).toBe(0);
    expect(result.taxAmountCents).toBe(0);
    expect(result.lineTotalCents).toBe(0);
  });

  it("handles exact 100% fixed discount (after discount = 0)", () => {
    const result = calculateLineItem({
      description: "100% discounted item",
      quantity: 1,
      unitPriceCents: 5_000,
      discount: { type: "fixed", value: 50 },
      taxPercent: 8,
    });

    expect(result.subtotalCents).toBe(5_000);
    expect(result.discountAmountCents).toBe(5_000);
    expect(result.afterDiscountCents).toBe(0);
    expect(result.taxAmountCents).toBe(0);
    expect(result.lineTotalCents).toBe(0);
  });

  it("handles decimal percent discount and tax accurately with half-up rounding", () => {
    const result = calculateLineItem({
      description: "Custom rates",
      quantity: 3,
      unitPriceCents: 4_999, // $49.99
      discount: { type: "percent", value: 12.5 },
      taxPercent: 7.25,
    });

    // subtotal = 3 * 4999 = 14997 cents ($149.97)
    expect(result.subtotalCents).toBe(14_997);
    // discount = 14997 * 0.125 = 1874.625 -> rounds to 1875 cents ($18.75)
    expect(result.discountAmountCents).toBe(1_875);
    // after discount = 14997 - 1875 = 13122 cents ($131.22)
    expect(result.afterDiscountCents).toBe(13_122);
    // tax = 13122 * 0.0725 = 951.345 -> rounds to 951 cents ($9.51)
    expect(result.taxAmountCents).toBe(951);
    // total = 13122 + 951 = 14073 cents ($140.73)
    expect(result.lineTotalCents).toBe(14_073);
  });

  it("rejects quantity less than 1", () => {
    expect(() =>
      calculateLineItem({
        description: "Zero quantity item",
        quantity: 0,
        unitPriceCents: 1000,
      }),
    ).toThrow("quantity must be greater than or equal to 1");
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
