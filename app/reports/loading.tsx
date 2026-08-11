export default function ReportsLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <div className="animate-pulse space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-full bg-[var(--surface-soft)]" />
          <div className="h-9 w-80 rounded-2xl bg-[var(--surface-soft)]" />
        </div>

        <div className="h-28 rounded-[24px] bg-[var(--surface-soft)]" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="h-24 rounded-[24px] bg-[var(--surface-soft)]" />
          <div className="h-24 rounded-[24px] bg-[var(--surface-soft)]" />
          <div className="h-24 rounded-[24px] bg-[var(--surface-soft)]" />
          <div className="h-24 rounded-[24px] bg-[var(--surface-soft)]" />
          <div className="h-24 rounded-[24px] bg-[var(--surface-soft)]" />
        </div>

        <div className="h-80 rounded-[24px] bg-[var(--surface-soft)]" />
      </div>
    </main>
  );
}
