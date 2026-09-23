'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { WingCard } from '@/components/WingCard';
import { Wing } from '@/lib/wings';
import api from '@/lib/api';

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    api.get('/users/me/bookmarks')
      .then((res) => {
        const list = (res.data || []).map((b: any) => b.wing).filter(Boolean);
        setBookmarks(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const handleUnbookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((w) => w._id !== id));
  };

  if (authLoading || loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Bookmark className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bookmarks</h1>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>
        </div>

        {bookmarks.length === 0 ? (
          <div className="p-12 text-center">
            <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-900">Save wings for later</p>
            <p className="text-sm text-gray-500 mt-1">Tap the bookmark icon on any wing to save it here.</p>
          </div>
        ) : (
          bookmarks.map((w) => (
            <WingCard key={w._id} wing={w} onDeleted={handleUnbookmark} />
          ))
        )}
      </main>
    </div>
  );
}