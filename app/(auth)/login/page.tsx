'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useRouteTransition } from '@/components/RouteTransitionProvider';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { navigate } = useRouteTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      rememberMe: rememberMe ? 'true' : 'false',
      redirect: false,
      callbackUrl: '/'
    });
    setLoading(false);
    if (!res) {
      setError('Unable to sign in. Please try again.');
      return;
    }
    if (res.error) {
      setError('Invalid email or password.');
      return;
    }
    if (res.url) {
      const nextUrl = new URL(res.url, window.location.origin);
      navigate(`${nextUrl.pathname}${nextUrl.search}`);
    }
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] shadow-[0_28px_90px_rgba(17,24,39,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,rgba(15,118,110,0.96)_0%,rgba(200,102,63,0.94)_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-16 top-14 h-64 w-64 rounded-full bg-white/12 blur-3xl" />
          <div className="absolute left-10 top-24 h-28 w-28 rounded-full border border-white/16" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
              Welcome back
            </p>
            <h1 className="mt-5 font-[family:var(--font-fraunces)] text-5xl leading-[0.94]">
              Step back into your neighborhood rhythm.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/80">
              Pick up where your last evening left off, watch the live map, and move straight into what is happening around you.
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            <div className="rounded-[1.6rem] border border-white/14 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/68">Live map</p>
              <p className="mt-2 text-3xl font-semibold">24/7</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/14 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/68">Local pulse</p>
              <p className="mt-2 text-3xl font-semibold">Near you</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <Card className="w-full max-w-md space-y-6">
            <div>
              <p className="eyebrow">Sign in</p>
              <h1 className="mt-4 text-3xl font-semibold">Welcome back</h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Sign in to keep discovering local events, RSVPs, and the map around your Illaka.
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              {/* Remember Me */}
              <label className="flex cursor-pointer items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--line)] accent-[var(--accent)]"
                />
                <span className="text-sm text-muted">Remember me for 30 days</span>
              </label>

              {error ? <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/30">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <p className="text-sm text-muted">
              New here?{' '}
              <Link className="font-semibold text-[var(--accent)]" href="/register">
                Create an account
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
