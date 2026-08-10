import { ZodError } from "zod";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUserFromRequest } from "@/lib/auth-route";
import { getReportSummary } from "@/lib/reports/service";
import { reportRangeSchema } from "@/lib/reports/schemas";

export async function GET(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    const { searchParams } = new URL(request.url);

    const input = reportRangeSchema.parse({
      from: searchParams.get("from"),
      to: searchParams.get("to"),
    });
    const summary = await getReportSummary(user.id, input);

    return Response.json({ summary });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid report range",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return toErrorResponse(error);
  }
}
