'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type AdminEvent = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  isPaid: boolean;
  rsvpCount: number;
  engagementScore: number;
  organizer: { email: string; name: string | null } | null;
};

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ORGANIZER' | 'ADMIN';
  createdAt: string;
  eventCount: number;
  rsvpCount: number;
};

type Stats = { userCount: number; eventCount: number; revenue: number };

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab, setTab] = useState<'events' | 'users'>('events');
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user?.role !== 'ADMIN') {
      router.replace('/login');
    }
  }, [session, status, router]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [evRes, usRes] = await Promise.all([
        fetch('/api/admin/events'),
        fetch('/api/admin/users')
      ]);
      const evData = await evRes.json();
      const usData = await usRes.json();
      setEvents(evData.events ?? []);
      const us: AdminUser[] = usData.users ?? [];
      setUsers(us);
      setStats({
        userCount: us.length,
        eventCount: evData.events?.length ?? 0,
        revenue: 0
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function deleteEvent(id: string, title: string) {
    if (!confirm(`Delete event "${title}"? This cannot be undone.`)) return;
    setBusy(id);
    const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } else {
      alert('Failed to delete event.');
    }
    setBusy(null);
  }

  async function changeRole(id: string, role: AdminUser['role']) {
    setBusy(id);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    } else {
      alert('Failed to update role.');
    }
    setBusy(null);
  }

  async function deleteUser(id: string, email: string) {
    if (!confirm(`Delete user "${email}"? This will also delete their events.`)) return;
    setBusy(id);
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } else {
      alert('Failed to delete user.');
    }
    setBusy(null);
  }

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.organizer?.email ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = users.filter((u) =>
    (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (status === 'loading' || loading) {
    return (
      <div className="flex h-screen items-center justify-center text-ink/50">
        Loading admin dashboard…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-semibold mb-2">Admin Dashboard</h1>

      {/* Stats */}
      {stats && (
        <div className="mt-4 grid gap-4 grid-cols-2 md:grid-cols-3 mb-8">
          <StatCard label="Total users" value={stats.userCount} />
          <StatCard label="Total events" value={stats.eventCount} />
          <StatCard
            label="Admins"
            value={users.filter((u) => u.role === 'ADMIN').length}
          />
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <TabBtn active={tab === 'events'} onClick={() => setTab('events')}>
            Events ({events.length})
          </TabBtn>
          <TabBtn active={tab === 'users'} onClick={() => setTab('users')}>
            Users ({users.length})
          </TabBtn>
        </div>
        <input
          className="border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm bg-white/50 dark:bg-white/5 w-full sm:w-64"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Events table */}
      {tab === 'events' && (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10 text-left text-xs text-ink/50 dark:text-white/50">
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3 hidden md:table-cell">Organizer</th>
                <th className="px-4 py-3 hidden lg:table-cell">Date</th>
                <th className="px-4 py-3">RSVPs</th>
                <th className="px-4 py-3 hidden sm:table-cell">Visibility</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ink/40">No events found.</td></tr>
              )}
              {filteredEvents.map((event) => (
                <tr key={event.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/2 dark:hover:bg-white/2">
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">{event.title}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-ink/60 dark:text-white/60 truncate max-w-[160px]">
                    {event.organizer?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-ink/60 dark:text-white/60 whitespace-nowrap">
                    {new Date(event.startTime).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-semibold">{event.rsvpCount}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      event.visibility === 'PUBLIC'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white/60'
                    }`}>
                      {event.visibility}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={busy === event.id}
                      onClick={() => deleteEvent(event.id, event.title)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      {busy === event.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users table */}
      {tab === 'users' && (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10 text-left text-xs text-ink/50 dark:text-white/50">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3 hidden sm:table-cell">Role</th>
                <th className="px-4 py-3 hidden md:table-cell">Events</th>
                <th className="px-4 py-3 hidden md:table-cell">RSVPs</th>
                <th className="px-4 py-3 hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-ink/40">No users found.</td></tr>
              )}
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/2 dark:hover:bg-white/2">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[160px]">{user.name ?? '—'}</p>
                    <p className="text-xs text-ink/50 dark:text-white/50 truncate max-w-[160px]">{user.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <select
                      value={user.role}
                      disabled={busy === user.id}
                      onChange={(e) => changeRole(user.id, e.target.value as AdminUser['role'])}
                      className="text-xs border border-black/10 dark:border-white/10 rounded-lg px-2 py-1 bg-white dark:bg-white/10 disabled:opacity-40"
                    >
                      <option value="USER">USER</option>
                      <option value="ORGANIZER">ORGANIZER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{user.eventCount}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{user.rsvpCount}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-ink/60 dark:text-white/60 whitespace-nowrap">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={busy === user.id}
                      onClick={() => deleteUser(user.id, user.email)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium disabled:opacity-40 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      {busy === user.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-xs text-ink/50 dark:text-white/50 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        active
          ? 'bg-ink text-white dark:bg-white dark:text-ink'
          : 'bg-black/5 dark:bg-white/10 text-ink/70 dark:text-white/70 hover:bg-black/10 dark:hover:bg-white/15'
      }`}
    >
      {children}
    </button>
  );
}
