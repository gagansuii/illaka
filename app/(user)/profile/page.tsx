'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { PaymentButton } from '@/components/PaymentButton';
import { OrganizerDashboard } from '@/components/OrganizerDashboard';

export default function ProfilePage() {
  const router = useRouter();
  const { data } = useSession();
  const [name, setName] = useState('');
  const [radius, setRadius] = useState(5000);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const canViewOrganizerDashboard = data?.user?.role === 'ORGANIZER' || data?.user?.role === 'ADMIN';

  useEffect(() => {
    if (data?.user?.name) setName(data.user.name);
  }, [data]);

  async function saveProfile() {
    setSaving(true);
    setSaveError('');
    const res = await fetch('/api/users/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, radiusPreference: radius })
    });
    if (!res.ok) {
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      setSaveError(data?.error ?? 'Could not save profile');
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-10 w-10 rounded-full p-0" onClick={() => router.back()} aria-label="Go back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Your profile</h1>
        <Button asChild variant="outline" size="sm" className="ml-auto">
          <Link href="/">Home</Link>
        </Button>
      </div>
      <Card className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted">Radius preference (meters)</label>
          <Input type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
        </div>
        <Button onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
        {saveError && <p className="text-sm text-red-500">{saveError}</p>}
        <PaymentButton
          label="Upgrade to Premium Customization"
          reason="subscription"
          amount={Number(process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE ?? 49900)}
        />
        <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/login' })}>Sign out</Button>
      </Card>

      {canViewOrganizerDashboard ? (
        <Card className="space-y-4">
          <OrganizerDashboard />
        </Card>
      ) : null}
    </div>
  );
}
