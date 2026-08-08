export type CalculationDiscountType = "fixed" | "percent";

export type CalculationLineItemDiscount = {
  type: CalculationDiscountType;
  value: number;
};

export type CalculationLineItemInput = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  discount?: CalculationLineItemDiscount | null;
  taxPercent?: number | null;
};

export type CalculatedLineItem = {
  description: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  discountAmountCents: number;
  afterDiscountCents: number;
  taxAmountCents: number;
  lineTotalCents: number;
  discount?: CalculationLineItemDiscount | null;
  taxPercent?: number | null;
};

export type CalculatedDocumentTotals = {
  subtotalCents: number;
  totalDiscountCents: number;
  totalTaxCents: number;
  grandTotalCents: number;
};

export type CalculatedDocument = {
  lineItems: CalculatedLineItem[];
  totals: CalculatedDocumentTotals;
};
