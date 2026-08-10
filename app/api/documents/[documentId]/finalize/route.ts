import { toErrorResponse } from "@/lib/api/errors";
import { requireUserFromRequest } from "@/lib/auth-route";
import { finalizeDocument } from "@/lib/documents/service";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUserFromRequest(request);
    const { documentId } = await context.params;
    const document = await finalizeDocument(user.id, documentId);

    return Response.json({ document });
  } catch (error) {
    return toErrorResponse(error);
  }
}
