'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { error?: string } | null;
        setError(data?.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] shadow-[0_28px_90px_rgba(17,24,39,0.16)]">
        <div className="flex w-full items-center justify-center p-6 sm:p-10">
          <Card className="w-full max-w-md space-y-6">
            <div>
              <p className="eyebrow">Account recovery</p>
              <h1 className="mt-4 text-3xl font-semibold">Forgot your password?</h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Enter your email and we will send you a link to reset your password.
              </p>
            </div>

            {sent ? (
              <div className="space-y-4">
                <div className="rounded-[1.2rem] bg-[rgba(15,118,110,0.08)] px-4 py-3 text-sm text-[var(--secondary)]">
                  If an account exists for <strong>{email}</strong>, a reset link has been sent. Check your inbox (and spam folder).
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Back to sign in</Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={handleSubmit}>
                <Input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {error ? <p className="text-sm text-red-500">{error}</p> : null}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            )}

            {!sent && (
              <p className="text-sm text-muted">
                Remember it? <Link className="font-semibold text-[var(--accent)]" href="/login">Sign in</Link>
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
