import { auth } from "@/lib/auth";
import { ApiError } from "@/lib/api/errors";

export async function requireUserFromRequest(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    throw new ApiError(401, "Authentication required");
  }

  return session.user;
}
