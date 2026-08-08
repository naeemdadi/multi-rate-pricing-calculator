import { ZodError } from "zod";

import { toErrorResponse } from "@/lib/api/errors";
import { requireUserFromRequest } from "@/lib/auth-route";
import { createDocument, listDocuments } from "@/lib/documents/service";
import { createDocumentSchema } from "@/lib/documents/schemas";

export async function GET(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    const documents = await listDocuments(user.id);

    return Response.json({ documents });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUserFromRequest(request);
    const json = await request.json();
    const input = createDocumentSchema.parse(json);
    const document = await createDocument(user.id, input);

    return Response.json({ document }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          error: "Invalid document input",
          details: error.flatten(),
        },
        { status: 400 },
      );
    }

    return toErrorResponse(error);
  }
}
