import Link from 'next/link';
import { IlaakaLogoH } from '@/components/IlaakaLogo';

export function Footer() {
  return (
    <footer
      className="mt-auto py-6 px-6 border-t"
      style={{ borderColor: 'var(--ink)', background: 'var(--paper-2)' }}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] uppercase tracking-[0.14em]"
        style={{ fontFamily: 'var(--font-mono), monospace', color: 'var(--ink-muted)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IlaakaLogoH markSize={24} />
          <span style={{ color: 'var(--ink-muted)' }}>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/terms" className="hover:underline underline-offset-2" style={{ color: 'var(--ink-muted)' }}>
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline underline-offset-2" style={{ color: 'var(--ink-muted)' }}>
            Privacy
          </Link>
          <a href="mailto:support@ilaka.app" className="hover:underline underline-offset-2" style={{ color: 'var(--ink-muted)' }}>
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
