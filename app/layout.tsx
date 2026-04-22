import './globals.css';
import type { Metadata } from 'next';
import { Space_Grotesk, Fraunces } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';

const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' });

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://ilaka.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'ILAKA — Rediscover your neighbourhood',
    template: '%s | ILAKA'
  },
  description: 'Cinematic, map-first community discovery for activities, meetups, workshops, and local energy around you.',
  openGraph: {
    type: 'website',
    siteName: 'ILAKA',
    title: 'ILAKA — Rediscover your neighbourhood',
    description: 'Find events happening near you. Discover what makes your neighbourhood feel alive.',
    url: BASE_URL
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ILAKA — Rediscover your neighbourhood',
    description: 'Find events happening near you. Discover what makes your neighbourhood feel alive.'
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${space.variable} ${fraunces.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
