import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-[family:var(--font-fraunces)] text-[clamp(7rem,20vw,11rem)] font-semibold leading-none text-[var(--accent)] opacity-80 select-none">
        404
      </p>

      <h1 className="mt-4 font-[family:var(--font-fraunces)] text-3xl font-semibold leading-tight sm:text-4xl">
        This page doesn&apos;t exist.
      </h1>

      <p className="mt-4 max-w-md text-base leading-7 text-[var(--muted)]">
        The event, page, or link you followed may have moved or been removed.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-7 text-sm font-semibold text-white transition-opacity hover:opacity-88 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          Go home
        </Link>
        <Link
          href="/discover"
          className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-7 text-sm font-semibold text-[var(--text)] transition-colors hover:bg-[var(--surface-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          Explore events
        </Link>
      </div>
    </div>
  );
}
