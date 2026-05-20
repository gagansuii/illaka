'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number.');
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain at least one special character.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json().catch(() => null) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-red-500">
        Invalid or missing reset token. Please request a new{' '}
        <Link className="underline" href="/forgot-password">password reset</Link>.
      </p>
    );
  }

  return success ? (
    <div className="space-y-4">
      <div className="rounded-[1.2rem] bg-[rgba(15,118,110,0.08)] px-4 py-3 text-sm text-[var(--secondary)]">
        Your password has been updated. You can now sign in.
      </div>
      <Button asChild className="w-full">
        <Link href="/login">Sign in</Link>
      </Button>
    </div>
  ) : (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />
      <p className="text-xs text-muted">Min 8 characters, with uppercase, number, and special character.</p>
      <Input
        type="password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Saving…' : 'Set new password'}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center justify-center overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] shadow-[0_28px_90px_rgba(17,24,39,0.16)]">
        <div className="flex w-full items-center justify-center p-6 sm:p-10">
          <Card className="w-full max-w-md space-y-6">
            <div>
              <p className="eyebrow">Account recovery</p>
              <h1 className="mt-4 text-3xl font-semibold">Set a new password</h1>
              <p className="mt-2 text-sm leading-6 text-muted">Choose a strong password you have not used before.</p>
            </div>
            <Suspense>
              <ResetPasswordForm />
            </Suspense>
          </Card>
        </div>
      </div>
    </div>
  );
}
