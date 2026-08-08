import { ZodError } from "zod";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUserFromRequest } from "@/lib/auth-route";
import {
  deleteLineItem,
  updateLineItem,
} from "@/lib/documents/service";
import { updateLineItemSchema } from "@/lib/documents/schemas";

type RouteContext = {
  params: Promise<{
    documentId: string;
    lineItemId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUserFromRequest(request);
    const { documentId, lineItemId } = await context.params;
    const json = await request.json();
    const input = updateLineItemSchema.parse(json);
    const document = await updateLineItem(user.id, documentId, lineItemId, input);

    return Response.json({ document });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid line item update input",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return toErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireUserFromRequest(request);
    const { documentId, lineItemId } = await context.params;
    const document = await deleteLineItem(user.id, documentId, lineItemId);

    return Response.json({ document });
  } catch (error) {
    return toErrorResponse(error);
  }
}
