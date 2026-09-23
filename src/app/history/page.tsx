'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Bookmark, Repeat2, PenSquare } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { WingCard } from '@/components/WingCard';
import { Wing } from '@/lib/wings';
import api from '@/lib/api';

type Tab = 'wings' | 'bookmarks' | 'reposts';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('wings');
  const [wings, setWings] = useState<Wing[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [reposts, setReposts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    Promise.all([
      api.get('/users/me/bookmarks').catch(() => ({ data: [] })),
      api.get('/users/me/reposts').catch(() => ({ data: [] })),
      api.get('/wings?limit=100').catch(() => ({ data: { data: [] } })),
    ])
      .then(([b, r, allWings]) => {
        setBookmarks(b.data || []);
        setReposts(r.data || []);
        const mine = (allWings.data?.data || []).filter(
          (w: any) => w.author?._id === user.userId,
        );
        setWings(mine);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  const tabs: { key: Tab; label: string; Icon: any; count: number }[] = [
    { key: 'wings', label: 'Your wings', Icon: PenSquare, count: wings.length },
    { key: 'bookmarks', label: 'Bookmarks', Icon: Bookmark, count: bookmarks.length },
    { key: 'reposts', label: 'Reposts', Icon: Repeat2, count: reposts.length },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">History</h1>
              <p className="text-sm text-gray-500">Your activity on Wing</p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 flex">
          {tabs.map(({ key, label, Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-3 px-2 text-sm font-semibold flex items-center justify-center gap-2 transition border-b-2 ${
                tab === key
                  ? 'text-blue-500 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50 border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span className="text-xs text-gray-400">({count})</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : tab === 'wings' ? (
          wings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">You haven&apos;t posted any wings yet.</div>
          ) : (
            wings.map((w) => <WingCard key={w._id} wing={w} />)
          )
        ) : tab === 'bookmarks' ? (
          bookmarks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No bookmarks yet.</div>
          ) : (
            bookmarks.map((b) => (b.wing ? <WingCard key={b._id} wing={b.wing} /> : null))
          )
        ) : (
          reposts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No reposts yet.</div>
          ) : (
            reposts.map((r) => (r.wing ? <WingCard key={r._id} wing={r.wing} /> : null))
          )
        )}
      </main>
    </div>
  );
}