import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-4 text-center">
      <p className="text-6xl font-bold text-muted/30">404</p>
      <div>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted">This page doesn&apos;t exist or has been removed.</p>
      </div>
      <Link
        href="/discover"
        className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-strong)] transition-colors"
      >
        Back to feed
      </Link>
    </div>
  );
}
