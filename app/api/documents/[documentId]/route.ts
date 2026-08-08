import { ZodError } from "zod";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUserFromRequest } from "@/lib/auth-route";
import {
  deleteDocument,
  getDocument,
  updateDocument,
} from "@/lib/documents/service";
import { updateDocumentSchema } from "@/lib/documents/schemas";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireUserFromRequest(request);
    const { documentId } = await context.params;
    const document = await getDocument(user.id, documentId);

    return Response.json({ document });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUserFromRequest(request);
    const { documentId } = await context.params;
    const json = await request.json();
    const input = updateDocumentSchema.parse(json);
    const document = await updateDocument(user.id, documentId, input);

    return Response.json({ document });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid document update input",
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
    const { documentId } = await context.params;
    await deleteDocument(user.id, documentId);

    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
