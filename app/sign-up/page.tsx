import { AuthCard } from "@/components/auth-card";
import { SignUpForm } from "@/components/sign-up-form";
import { redirectAuthenticatedUser } from "@/lib/auth-pages";

type SignUpPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  await redirectAuthenticatedUser();

  const params = await searchParams;
  const nextPath = params.next?.startsWith("/") ? params.next : "/documents";

  return (
    <AuthCard
      description="Create an account to access the protected document and reporting flows. Email and password are enough for this assignment."
      footer="Account creation uses Better Auth email/password with the same MongoDB-backed auth store as the rest of the app."
      title="Create your account"
    >
      <SignUpForm nextPath={nextPath} />
    </AuthCard>
  );
}
