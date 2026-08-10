export function AuthCard({
  title,
  description,
  footer,
  children,
}: Readonly<{
  title: string;
  description: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}>) {
  return (
    <main className="relative overflow-hidden bg-[var(--surface)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.14),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_40%)]" />
      <section className="relative mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-6xl items-center px-5 py-12 sm:px-8">
        <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-xl">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-[var(--muted)]">
              Protected workspace
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[var(--muted)] sm:text-lg">
              {description}
            </p>
          </div>

          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--surface-raised)] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.26)] sm:p-8">
            {children}
            <div className="mt-6 border-t border-[var(--border)] pt-5 text-sm text-[var(--muted)]">
              {footer}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
