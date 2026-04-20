'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Mail, Radar, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type MemberSummary = {
  id: string;
  name: string;
  email: string;
  role: string;
  latitude: number | null;
  longitude: number | null;
  radiusPreference: number;
  subscriptionType: string | null;
  createdAt: string;
};

type RegistrationSummary = {
  currentUserEmail: string;
  currentUserName: string;
  joinedAt: string;
  members: MemberSummary[];
  totalMembers: number;
};

function formatJoinDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

function formatRadius(radiusPreference: number) {
  return `${(radiusPreference / 1000).toFixed(radiusPreference % 1000 === 0 ? 0 : 1)} km radius`;
}

function formatCoordinates(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) {
    return 'Not shared yet';
  }

  return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [summary, setSummary] = useState<RegistrationSummary | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    if (!summary) return undefined;

    setShowPopup(true);
    const timeoutId = window.setTimeout(() => {
      setShowPopup(false);
    }, 4200);

    return () => window.clearTimeout(timeoutId);
  }, [summary]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    if (!res.ok) {
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      setError(data?.error ?? 'Unable to register');
      setIsSubmitting(false);
      return;
    }
    const signInRes = await signIn('credentials', { email, password, redirect: false, callbackUrl: '/' });
    if (signInRes?.error) {
      setError('Account created, but sign-in failed. Please sign in manually.');
      setIsSubmitting(false);
      return;
    }

    const fallbackJoinedAt = new Date().toISOString();
    const fallbackMember: MemberSummary = {
      id: 'local-member',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'USER',
      latitude: null,
      longitude: null,
      radiusPreference: 5000,
      subscriptionType: null,
      createdAt: fallbackJoinedAt
    };

    try {
      const membersRes = await fetch('/api/users/members', { cache: 'no-store' });
      if (!membersRes.ok) {
        let data: any = null;
        try {
          data = await membersRes.json();
        } catch {
          data = null;
        }

        setSummary({
          currentUserEmail: fallbackMember.email,
          currentUserName: fallbackMember.name,
          joinedAt: fallbackJoinedAt,
          members: [fallbackMember],
          totalMembers: 1
        });

        if (data?.error) {
          setError(data.error);
        }
      } else {
        const data = (await membersRes.json()) as { members?: MemberSummary[]; totalMembers?: number };
        const members = data.members?.length ? data.members : [fallbackMember];
        const currentMember = members.find((member) => member.email === fallbackMember.email) ?? fallbackMember;

        setSummary({
          currentUserEmail: currentMember.email,
          currentUserName: currentMember.name,
          joinedAt: currentMember.createdAt,
          members,
          totalMembers: data.totalMembers ?? members.length
        });
      }
    } catch {
      setSummary({
        currentUserEmail: fallbackMember.email,
        currentUserName: fallbackMember.name,
        joinedAt: fallbackJoinedAt,
        members: [fallbackMember],
        totalMembers: 1
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <AnimatePresence>
        {showPopup && summary ? (
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="pointer-events-none fixed right-4 top-24 z-50 w-[min(92vw,24rem)]"
          >
            <div className="relative overflow-hidden rounded-[2rem] border border-white/16 bg-[linear-gradient(145deg,rgba(200,102,63,0.98)_0%,rgba(15,118,110,0.96)_100%)] p-5 text-white shadow-[0_28px_90px_rgba(17,24,39,0.24)]">
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/72">
                  Text message
                </p>
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/14">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">Registration complete</p>
                    <p className="mt-1 text-sm leading-6 text-white/82">
                      Welcome, {summary.currentUserName}. Your account is live and your local member circle is ready to explore.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-5xl overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--surface-strong)] shadow-[0_28px_90px_rgba(17,24,39,0.16)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden overflow-hidden bg-[linear-gradient(145deg,rgba(200,102,63,0.96)_0%,rgba(15,118,110,0.94)_100%)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-white/12 blur-3xl" />
          <div className="absolute right-14 top-16 h-32 w-32 rounded-full border border-white/16" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/72">
              Join ILLAKA
            </p>
            <h1 className="mt-5 font-[family:var(--font-fraunces)] text-5xl leading-[0.94]">
              Build your own neighborhood signal.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/80">
              Create an account, set your local radius, and start discovering or hosting gatherings that feel actually close to home.
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-3">
            <div className="rounded-[1.6rem] border border-white/14 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/68">Host</p>
              <p className="mt-2 text-3xl font-semibold">Local</p>
            </div>
            <div className="rounded-[1.6rem] border border-white/14 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/68">Discover</p>
              <p className="mt-2 text-3xl font-semibold">Nearby</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <AnimatePresence mode="wait">
            {summary ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="w-full max-w-2xl"
              >
                <Card className="space-y-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="eyebrow">Registration complete</p>
                      <h1 className="mt-4 text-3xl font-semibold">You are now part of the ILLAKA circle.</h1>
                      <p className="mt-2 text-sm leading-6 text-muted">
                        Your account is active, the member roster is live, and you can move straight into your profile or the home experience.
                      </p>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-[1.4rem] bg-[linear-gradient(145deg,var(--accent)_0%,var(--secondary)_100%)] text-white shadow-[0_18px_40px_rgba(17,24,39,0.14)]">
                      <Sparkles className="h-6 w-6" />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.44)] p-4 dark:bg-[rgba(15,23,42,0.24)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--secondary)]">Joined</p>
                      <p className="mt-2 text-xl font-semibold">{formatJoinDate(summary.joinedAt)}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.44)] p-4 dark:bg-[rgba(15,23,42,0.24)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--secondary)]">Visible members</p>
                      <p className="mt-2 text-xl font-semibold">{summary.totalMembers}</p>
                    </div>
                    <div className="rounded-[1.5rem] border border-[var(--line)] bg-[rgba(255,255,255,0.44)] p-4 dark:bg-[rgba(15,23,42,0.24)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--secondary)]">Your role</p>
                      <p className="mt-2 text-xl font-semibold">USER</p>
                    </div>
                  </div>

                  <div className="rounded-[1.7rem] border border-[var(--line)] bg-[linear-gradient(145deg,rgba(255,250,244,0.92)_0%,rgba(238,251,249,0.84)_100%)] p-5 shadow-[0_20px_50px_rgba(17,24,39,0.08)] dark:bg-[linear-gradient(145deg,rgba(35,23,19,0.52)_0%,rgba(16,35,33,0.42)_100%)]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(200,102,63,0.16)] text-[var(--accent-strong)]">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                          Message bubble
                        </p>
                        <p className="mt-2 text-sm leading-7 text-muted">
                          You registered successfully as {summary.currentUserName}. The list below shows the latest members in your circle with their role, contact, join date, neighborhood radius, subscription state, and shared map coordinates.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold">Registered members</h2>
                        <p className="text-sm leading-6 text-muted">
                          A clear roster of the most recently registered members in your current circle.
                        </p>
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--secondary)]">
                        Showing latest {summary.members.length}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {summary.members.map((member, index) => {
                        const isCurrentUser = member.email === summary.currentUserEmail;

                        return (
                          <motion.article
                            key={member.id}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.06 }}
                            className={`rounded-[1.7rem] border p-4 shadow-[0_18px_44px_rgba(17,24,39,0.08)] ${
                              isCurrentUser
                                ? 'border-[rgba(200,102,63,0.28)] bg-[linear-gradient(145deg,rgba(255,247,240,0.94)_0%,rgba(240,252,250,0.86)_100%)] dark:bg-[linear-gradient(145deg,rgba(40,24,19,0.54)_0%,rgba(15,33,31,0.48)_100%)]'
                                : 'border-[var(--line)] bg-[rgba(255,255,255,0.42)] dark:bg-[rgba(15,23,42,0.22)]'
                            }`}
                          >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div className="flex items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgba(15,118,110,0.12)] text-[var(--secondary)]">
                                  <Users className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-lg font-semibold">{member.name}</h3>
                                    {isCurrentUser ? (
                                      <span className="rounded-full bg-[rgba(200,102,63,0.14)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                                        You
                                      </span>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-sm text-muted">{member.email}</p>
                                </div>
                              </div>

                              <div className="rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.52)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] dark:bg-[rgba(15,23,42,0.28)]">
                                {member.role}
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.35)] p-3 dark:bg-[rgba(15,23,42,0.2)]">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Joined</p>
                                <p className="mt-2 text-sm font-medium">{formatJoinDate(member.createdAt)}</p>
                              </div>
                              <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.35)] p-3 dark:bg-[rgba(15,23,42,0.2)]">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Neighborhood focus</p>
                                <p className="mt-2 text-sm font-medium">{formatRadius(member.radiusPreference)}</p>
                              </div>
                              <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.35)] p-3 dark:bg-[rgba(15,23,42,0.2)]">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Subscription</p>
                                <p className="mt-2 text-sm font-medium">{member.subscriptionType ?? 'Standard'}</p>
                              </div>
                              <div className="rounded-[1.2rem] border border-[var(--line)] bg-[rgba(255,255,255,0.35)] p-3 dark:bg-[rgba(15,23,42,0.2)] sm:col-span-2 lg:col-span-3">
                                <div className="flex items-center gap-2">
                                  <Radar className="h-4 w-4 text-[var(--secondary)]" />
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Map coordinates</p>
                                </div>
                                <p className="mt-2 text-sm font-medium">{formatCoordinates(member.latitude, member.longitude)}</p>
                              </div>
                            </div>
                          </motion.article>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href="/profile">Open your profile</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/">Continue to Illaka</Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-full max-w-md"
              >
                <Card className="space-y-6">
                  <div>
                    <p className="eyebrow">Create account</p>
                    <h1 className="mt-4 text-3xl font-semibold">Create your ILLAKA</h1>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      Start with a profile, then tune the map to your neighborhood and the kinds of moments you want more of.
                    </p>
                  </div>

                  <form className="space-y-3" onSubmit={handleSubmit}>
                    <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    {error ? <p className="text-sm text-red-500">{error}</p> : null}
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating account...' : 'Create account'}
                    </Button>
                  </form>

                  <p className="text-sm text-muted">
                    Already have an account? <Link className="font-semibold text-[var(--accent)]" href="/login">Sign in</Link>
                  </p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
