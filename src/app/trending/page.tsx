'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Flame } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import api from '@/lib/api';

interface Trend {
  _id: string;
  count: number;
}

export default function TrendingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    api.get('/wings/trending/hashtags?limit=20')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setTrends(data.slice(0, 30));
      })
      .catch((err) => {
        console.error('Failed to load trends', err);
        setTrends([]);
      })
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Trending
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Top hashtags across Wing right now
          </p>
        </div>

        {trends.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Flame className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm">
              Nothing is trending yet. Post a Wing with a #hashtag to get started!
            </p>
          </div>
        ) : (
          <div>
            {trends.map((t, i) => (
              <Link
                key={t._id}
                href={'/hashtag/' + t._id}
                className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-300 dark:text-gray-700 w-8 text-right">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-gray-900 dark:text-white font-semibold">
                      #{t._id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.count} {t.count === 1 ? 'wing' : 'wings'}
                    </p>
                  </div>
                </div>
                {i < 3 && <Flame className="w-5 h-5 text-orange-500" />}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}