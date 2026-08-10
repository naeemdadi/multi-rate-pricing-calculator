import Link from "next/link";

import { getCurrentUser } from "@/lib/auth-session";

import { SignOutButton } from "./sign-out-button";

export async function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface-raised)]/90 backdrop-blur print:hidden">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-8">
            <Link className="text-sm font-semibold tracking-[0.16em] text-[var(--muted)] uppercase" href="/">
              MRPC
            </Link>
            <nav className="flex items-center gap-5 text-sm text-[var(--muted)]">
              <Link className="transition hover:text-[var(--foreground)]" href="/documents">
                Documents
              </Link>
              <Link className="transition hover:text-[var(--foreground)]" href="/reports">
                Reports
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {user.name ?? user.email}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{user.email}</p>
                </div>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link
                  className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)]"
                  href="/sign-in"
                >
                  Sign In
                </Link>
                <Link
                  className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90"
                  href="/sign-up"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
