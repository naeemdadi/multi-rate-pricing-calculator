export default function GlobalLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <div className="animate-pulse space-y-6">
        <div className="h-4 w-32 rounded-full bg-[var(--surface-soft)]" />
        <div className="h-10 w-96 rounded-2xl bg-[var(--surface-soft)]" />
        <div className="h-5 w-2/3 rounded-xl bg-[var(--surface-soft)]" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-28 rounded-[20px] bg-[var(--surface-soft)]" />
          <div className="h-28 rounded-[20px] bg-[var(--surface-soft)]" />
          <div className="h-28 rounded-[20px] bg-[var(--surface-soft)]" />
          <div className="h-28 rounded-[20px] bg-[var(--surface-soft)]" />
        </div>
        <div className="h-64 rounded-[24px] bg-[var(--surface-soft)]" />
      </div>
    </div>
  );
}
