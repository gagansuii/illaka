import Link from 'next/link';
import { IlaakaLogoH } from '@/components/IlaakaLogo';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/40 py-4 px-6">
        <Link href="/" aria-label="Home">
          <IlaakaLogoH markSize={32} />
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">{children}</main>
      <footer className="border-t border-border/40 py-6 px-6 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-6">
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} ILAAKA. All rights reserved.</p>
      </footer>
    </div>
  );
}
