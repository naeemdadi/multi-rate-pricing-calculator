export default function DocumentsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 w-28 rounded-full bg-[var(--surface-soft)]" />
            <div className="h-9 w-64 rounded-2xl bg-[var(--surface-soft)]" />
          </div>
          <div className="h-10 w-36 rounded-full bg-[var(--surface-soft)]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="h-24 rounded-[20px] bg-[var(--surface-soft)]" />
          <div className="h-24 rounded-[20px] bg-[var(--surface-soft)]" />
          <div className="h-24 rounded-[20px] bg-[var(--surface-soft)]" />
        </div>

        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-raised)] p-6 space-y-4">
          <div className="h-6 w-48 rounded-xl bg-[var(--surface-soft)]" />
          <div className="h-12 w-full rounded-xl bg-[var(--surface-soft)]" />
          <div className="h-12 w-full rounded-xl bg-[var(--surface-soft)]" />
          <div className="h-12 w-full rounded-xl bg-[var(--surface-soft)]" />
        </div>
      </div>
    </main>
  );
}
