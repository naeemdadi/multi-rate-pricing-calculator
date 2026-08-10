import { redirect } from "next/navigation";

import { getCurrentSession, getCurrentUser } from "@/lib/auth-session";

export async function requireAuthenticatedUser() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/sign-in");
  }

  return session.user;
}

export async function redirectAuthenticatedUser(path = "/documents") {
  const user = await getCurrentUser();

  if (user) {
    redirect(path);
  }
}
