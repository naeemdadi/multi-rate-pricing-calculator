import { describe, expect, it } from "vitest";
import { reportRangeSchema } from "./schemas";

describe("reportRangeSchema", () => {
  it("accepts valid date range", () => {
    const result = reportRangeSchema.parse({
      from: "2026-01-01",
      to: "2026-01-31",
    });
    expect(result).toEqual({
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("accepts same-day report range", () => {
    const result = reportRangeSchema.parse({
      from: "2026-05-15",
      to: "2026-05-15",
    });
    expect(result).toEqual({
      from: "2026-05-15",
      to: "2026-05-15",
    });
  });

  it("rejects from date after to date", () => {
    expect(() =>
      reportRangeSchema.parse({
        from: "2026-02-01",
        to: "2026-01-01",
      }),
    ).toThrow("From date must be on or before to date");
  });

  it("rejects invalid date format strings", () => {
    expect(() =>
      reportRangeSchema.parse({
        from: "invalid-date",
        to: "2026-01-31",
      }),
    ).toThrow("Date must be a valid ISO date");
  });
});
