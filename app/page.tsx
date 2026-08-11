import Link from "next/link";

import { getCurrentUser } from "@/lib/auth-session";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_40%)]" />
      <section className="relative mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-6xl flex-col justify-center px-5 py-16 sm:px-8">
        <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
          Financial Operations & Pricing Platform
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-6xl">
          Precision document pricing, server-owned totals, and finance-safe editing rules.
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--muted)] sm:text-lg">
          Create quotes and billing documents with multi-rate per-line discounts, per-line tax rules, strict finalized immutability guards, and issue-date summary analytics.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            className="rounded-full bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-[var(--accent-foreground)] shadow-lg transition hover:opacity-90"
            href={user ? "/documents" : "/sign-up"}
          >
            {user ? "Open Workspace" : "Get Started — Free"}
          </Link>
          <Link
            className="rounded-full border border-[var(--border)] px-6 py-3.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
            href={user ? "/reports" : "/sign-in"}
          >
            {user ? "View Summary Reports" : "Sign In"}
          </Link>
        </div>
      </section>
    </main>
  );
}
