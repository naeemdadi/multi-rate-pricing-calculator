"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  return (
    <button
      className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-50"
      disabled={isPending}
      onClick={() => {
        setIsPending(true);

        startTransition(async () => {
          const result = await signOut();

          if (result.error) {
            setIsPending(false);
            return;
          }

          router.push("/");
          router.refresh();
        });
      }}
      type="button"
    >
      {isPending ? "Signing out..." : "Sign Out"}
    </button>
  );
}
