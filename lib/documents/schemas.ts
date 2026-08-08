import { z } from "zod";

const percentNumberSchema = z
  .number()
  .finite()
  .min(0, "Percent must be at least 0")
  .max(100, "Percent must be at most 100");

const fixedDiscountSchema = z.object({
  type: z.literal("fixed"),
  value: z.number().finite().min(0, "Fixed discount must be at least 0"),
});

const percentDiscountSchema = z.object({
  type: z.literal("percent"),
  value: percentNumberSchema,
});

export const discountInputSchema = z
  .union([fixedDiscountSchema, percentDiscountSchema])
  .nullable()
  .optional();

export const lineItemInputSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.number().finite().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().finite().min(0, "Unit price must be at least 0"),
  discount: discountInputSchema,
  taxPercent: percentNumberSchema.nullable().optional(),
});

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  customer: z.string().trim().min(1, "Customer is required"),
  issueDate: z.string().date("Issue date must be a valid ISO date"),
  lineItems: z.array(lineItemInputSchema).default([]),
});

export const updateDocumentSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").optional(),
    customer: z.string().trim().min(1, "Customer is required").optional(),
    issueDate: z.string().date("Issue date must be a valid ISO date").optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one document field must be provided",
  });

export const createLineItemSchema = lineItemInputSchema;

export const updateLineItemSchema = z
  .object({
    description: z.string().trim().min(1, "Description is required").optional(),
    quantity: z.number().finite().min(1, "Quantity must be at least 1").optional(),
    unitPrice: z
      .number()
      .finite()
      .min(0, "Unit price must be at least 0")
      .optional(),
    discount: discountInputSchema,
    taxPercent: percentNumberSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one line item field must be provided",
  });

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type CreateLineItemInput = z.infer<typeof createLineItemSchema>;
export type UpdateLineItemInput = z.infer<typeof updateLineItemSchema>;
