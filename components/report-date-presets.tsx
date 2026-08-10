"use client";

import { useRouter, useSearchParams } from "next/navigation";

function getPresetDates(preset: "30days" | "month" | "year" | "all") {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (preset === "30days") {
    const past = new Date(now);
    past.setDate(past.getDate() - 29);
    return { from: past.toISOString().slice(0, 10), to: todayStr };
  }

  if (preset === "month") {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: firstDay.toISOString().slice(0, 10), to: todayStr };
  }

  if (preset === "year") {
    const firstDay = new Date(now.getFullYear(), 0, 1);
    return { from: firstDay.toISOString().slice(0, 10), to: todayStr };
  }

  if (preset === "all") {
    return { from: "2020-01-01", to: todayStr };
  }

  return { from: todayStr, to: todayStr };
}

export function ReportDatePresets() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFrom = searchParams.get("from");
  const currentTo = searchParams.get("to");

  function applyPreset(preset: "30days" | "month" | "year" | "all") {
    const { from, to } = getPresetDates(preset);
    router.push(`/reports?from=${from}&to=${to}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <span className="text-xs text-[var(--muted)]">Presets:</span>
      <button
        className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-raised)]"
        onClick={() => applyPreset("30days")}
        type="button"
      >
        Last 30 Days
      </button>
      <button
        className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-raised)]"
        onClick={() => applyPreset("month")}
        type="button"
      >
        This Month
      </button>
      <button
        className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-raised)]"
        onClick={() => applyPreset("year")}
        type="button"
      >
        This Year
      </button>
      <button
        className="rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs text-[var(--foreground)] transition hover:bg-[var(--surface-raised)]"
        onClick={() => applyPreset("all")}
        type="button"
      >
        All Time
      </button>
    </div>
  );
}
