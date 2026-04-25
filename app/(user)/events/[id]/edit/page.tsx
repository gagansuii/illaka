'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useRouteTransition } from '@/components/RouteTransitionProvider';

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const { navigate } = useRouteTransition();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) {
        setError('Invalid event id');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) {
          setError('Failed to load event');
          setLoading(false);
          return;
        }
        const data = await res.json();
        const event = data.event;
        setTitle(event.title || '');
        setDescription(event.description || '');
        setVisibility(event.visibility || 'PUBLIC');
        setLoading(false);
      } catch (err) {
        setError('Failed to load event');
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!eventId) {
      setError('Invalid event id');
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, visibility })
    });
    setSaving(false);
    if (!res.ok) {
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      setError(data?.error ?? 'Failed to update event');
      return;
    }
    navigate(`/events/${eventId}`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Card className="space-y-4">
          <p>Loading event...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Card className="space-y-4">
        <h1 className="text-2xl font-semibold">Edit event</h1>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <select value={visibility} onChange={(e) => setVisibility(e.target.value as any)} className="rounded-xl border border-ink/10 bg-white/80 px-3 py-2">
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
        </form>
      </Card>
    </div>
  );
}
