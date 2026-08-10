import { AuthCard } from "@/components/auth-card";
import { SignInForm } from "@/components/sign-in-form";
import { redirectAuthenticatedUser } from "@/lib/auth-pages";

type SignInPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  await redirectAuthenticatedUser();

  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/documents";

  return (
    <AuthCard
      description="Sign in to create documents, manage line items, and review pricing calculations that always come from the server."
      footer="The protected routes stay server-validated. The client-side redirect is only for navigation flow."
      title="Sign in to the workspace"
    >
      <SignInForm nextPath={nextPath} />
    </AuthCard>
  );
}
