import Link from "next/link";

import { getCurrentUser } from "@/lib/auth-session";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_40%)]" />
      <section className="relative mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-6xl flex-col justify-center px-5 py-16 sm:px-8">
        <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
          Multi-Rate Pricing Calculator
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-6xl">
          Protected document pricing, server-owned totals, and finance-safe editing rules.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg">
          The app now has the auth foundation, protected routes, server-side document APIs,
          and a tested calculation engine that matches the assignment sample exactly.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-foreground)] transition hover:opacity-90"
            href={user ? "/documents" : "/sign-up"}
          >
            {user ? "Open documents" : "Create account"}
          </Link>
          <Link
            className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
            href={user ? "/reports" : "/sign-in"}
          >
            {user ? "View reports" : "Sign in"}
          </Link>
        </div>
      </section>
    </main>
  );
}
