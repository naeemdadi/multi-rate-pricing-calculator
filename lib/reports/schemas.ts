import { z } from "zod";

const isoDateSchema = z.string().date("Date must be a valid ISO date");

export const reportRangeSchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
  })
  .refine((value) => value.from <= value.to, {
    message: "From date must be on or before to date",
    path: ["from"],
  });

export type ReportRangeInput = z.infer<typeof reportRangeSchema>;
