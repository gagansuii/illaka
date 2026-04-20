import './globals.css';
import type { Metadata } from 'next';
import { Newsreader, Manrope, Space_Grotesk, Fraunces } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/components/AuthProvider';
import { RouteTransitionProvider } from '@/components/RouteTransitionProvider';

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

// Kept for backwards-compat with existing components
const space    = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' });

export const metadata: Metadata = {
  title: 'ILLAKA | Rediscover your neighbourhood',
  description: 'Cinematic, map-first community discovery for activities, meetups, workshops, and local energy around you.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${newsreader.variable} ${manrope.variable} ${space.variable} ${fraunces.variable} font-body bg-background text-on-surface antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <RouteTransitionProvider>{children}</RouteTransitionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
