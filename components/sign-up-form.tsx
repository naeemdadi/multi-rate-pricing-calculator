"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { signUp } from "@/lib/auth-client";

type SignUpFormProps = {
  nextPath: string;
};

export function SignUpForm({ nextPath }: SignUpFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setIsPending(true);

        startTransition(async () => {
          const result = await signUp.email({
            name,
            email,
            password,
          });

          if (result.error) {
            setError(result.error.message ?? "Unable to create account");
            setIsPending(false);
            return;
          }

          router.push(nextPath);
          router.refresh();
        });
      }}
    >
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Full name
        </span>
        <input
          autoComplete="name"
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          onChange={(event) => setName(event.target.value)}
          placeholder="John Doe"
          required
          type="text"
          value={name}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Email
        </span>
        <input
          autoComplete="email"
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          required
          type="email"
          value={email}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Password
        </span>
        <input
          autoComplete="new-password"
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimum 8 characters"
          required
          type="password"
          value={password}
        />
      </label>

      {error ? (
        <p className="rounded-2xl border border-[var(--danger-border)] bg-[var(--danger-surface)] px-4 py-3 text-sm text-[var(--danger-text)]">
          {error}
        </p>
      ) : null}

      <button
        className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-foreground)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Creating account..." : "Create Account"}
      </button>

      <p className="text-sm text-[var(--muted)]">
        Already have an account?{" "}
        <Link className="text-[var(--foreground)] underline underline-offset-4" href="/sign-in">
          Sign in
        </Link>
      </p>
    </form>
  );
}
