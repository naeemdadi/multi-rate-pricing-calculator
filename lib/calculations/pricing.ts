import type {
  CalculatedDocument,
  CalculatedLineItem,
  CalculationLineItemInput,
} from "@/lib/calculations/types";

const PERCENT_SCALE = 100;
const QUANTITY_SCALE = 1000;

export class PricingCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingCalculationError";
  }
}

function roundHalfUp(value: number) {
  return Math.round(value);
}

function toScaledInteger(value: number, scale: number, label: string) {
  if (!Number.isFinite(value)) {
    throw new PricingCalculationError(`${label} must be a finite number`);
  }

  const scaled = roundHalfUp(value * scale);

  if (Math.abs(scaled - value * scale) > 1e-9) {
    throw new PricingCalculationError(
      `${label} supports at most ${String(scale).length - 1} decimal places`,
    );
  }

  return scaled;
}

function validateUnitPriceCents(unitPriceCents: number) {
  if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
    throw new PricingCalculationError(
      "unitPriceCents must be a non-negative integer number of cents",
    );
  }
}

function toBasisPoints(percent: number, label: string) {
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    throw new PricingCalculationError(`${label} must be between 0 and 100`);
  }

  return toScaledInteger(percent, PERCENT_SCALE, label);
}

function calculateSubtotalCents(quantity: number, unitPriceCents: number) {
  const scaledQuantity = toScaledInteger(quantity, QUANTITY_SCALE, "quantity");

  if (scaledQuantity < QUANTITY_SCALE) {
    throw new PricingCalculationError("quantity must be greater than or equal to 1");
  }

  return roundHalfUp((scaledQuantity * unitPriceCents) / QUANTITY_SCALE);
}

function calculateDiscountAmountCents(
  subtotalCents: number,
  discount: CalculationLineItemInput["discount"],
) {
  if (!discount) {
    return 0;
  }

  if (discount.type === "fixed") {
    const fixedDiscountCents = toScaledInteger(
      discount.value,
      100,
      "fixed discount",
    );

    if (fixedDiscountCents > subtotalCents) {
      throw new PricingCalculationError(
        "fixed discount must not exceed the line subtotal",
      );
    }

    return fixedDiscountCents;
  }

  if (discount.type === "percent") {
    const discountBasisPoints = toBasisPoints(discount.value, "discount percent");
    return roundHalfUp((subtotalCents * discountBasisPoints) / 10_000);
  }

  throw new PricingCalculationError("discount type must be fixed or percent");
}

function calculateTaxAmountCents(afterDiscountCents: number, taxPercent?: number | null) {
  if (taxPercent == null) {
    return 0;
  }

  const taxBasisPoints = toBasisPoints(taxPercent, "tax percent");
  return roundHalfUp((afterDiscountCents * taxBasisPoints) / 10_000);
}

export function calculateLineItem(
  input: CalculationLineItemInput,
): CalculatedLineItem {
  validateUnitPriceCents(input.unitPriceCents);

  const subtotalCents = calculateSubtotalCents(
    input.quantity,
    input.unitPriceCents,
  );
  const discountAmountCents = calculateDiscountAmountCents(
    subtotalCents,
    input.discount,
  );
  const afterDiscountCents = subtotalCents - discountAmountCents;
  const taxAmountCents = calculateTaxAmountCents(
    afterDiscountCents,
    input.taxPercent,
  );
  const lineTotalCents = afterDiscountCents + taxAmountCents;

  return {
    description: input.description,
    quantity: input.quantity,
    unitPriceCents: input.unitPriceCents,
    subtotalCents,
    discountAmountCents,
    afterDiscountCents,
    taxAmountCents,
    lineTotalCents,
    discount: input.discount ?? null,
    taxPercent: input.taxPercent ?? null,
  };
}

export function calculateDocument(lineItems: CalculationLineItemInput[]): CalculatedDocument {
  const calculatedLineItems = lineItems.map(calculateLineItem);

  return {
    lineItems: calculatedLineItems,
    totals: {
      subtotalCents: calculatedLineItems.reduce(
        (sum, lineItem) => sum + lineItem.subtotalCents,
        0,
      ),
      totalDiscountCents: calculatedLineItems.reduce(
        (sum, lineItem) => sum + lineItem.discountAmountCents,
        0,
      ),
      totalTaxCents: calculatedLineItems.reduce(
        (sum, lineItem) => sum + lineItem.taxAmountCents,
        0,
      ),
      grandTotalCents: calculatedLineItems.reduce(
        (sum, lineItem) => sum + lineItem.lineTotalCents,
        0,
      ),
    },
  };
}
