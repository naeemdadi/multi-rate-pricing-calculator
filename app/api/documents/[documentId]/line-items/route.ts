import { ZodError } from "zod";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUserFromRequest } from "@/lib/auth-route";
import { addLineItem } from "@/lib/documents/service";
import { createLineItemSchema } from "@/lib/documents/schemas";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUserFromRequest(request);
    const { documentId } = await context.params;
    const json = await request.json();
    const input = createLineItemSchema.parse(json);
    const document = await addLineItem(user.id, documentId, input);

    return Response.json({ document });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid line item input",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return toErrorResponse(error);
  }
}
