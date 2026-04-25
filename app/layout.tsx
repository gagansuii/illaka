import './globals.css';
import type { Metadata } from 'next';
import { Newsreader, Manrope, Space_Grotesk, Fraunces, Caveat, Instrument_Serif, Space_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';
import { RouteTransitionProvider } from '@/components/RouteTransitionProvider';

const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader', weight: ['200', '300', '400', '500', '600', '700', '800'], style: ['normal', 'italic'], display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', weight: ['200', '300', '400', '500', '600', '700', '800'], display: 'swap' });
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });
const caveat = Caveat({ subsets: ['latin'], variable: '--font-caveat', display: 'swap' });
const instrumentSerif = Instrument_Serif({ subsets: ['latin'], style: ['normal', 'italic'], weight: '400', variable: '--font-serif', display: 'swap' });
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono', display: 'swap' });

const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://ilaka.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: 'ILAKA — Rediscover your neighbourhood', template: '%s | ILAKA' },
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
      <body className={`${newsreader.variable} ${manrope.variable} ${space.variable} ${fraunces.variable} ${caveat.variable} ${instrumentSerif.variable} ${spaceMono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <RouteTransitionProvider>{children}</RouteTransitionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
