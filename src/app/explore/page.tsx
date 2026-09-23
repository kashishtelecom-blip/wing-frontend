'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/lib/auth-context';
import { getTrendingHashtags, getPublicWings, Wing } from '@/lib/wings';
import { WingCard } from '@/components/WingCard';

export default function ExplorePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [trending, setTrending] = useState<any[]>([]);
  const [wings, setWings] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    Promise.all([getTrendingHashtags(10), getPublicWings(1, 20)])
      .then(([tags, data]) => {
        setTrending(Array.isArray(tags) ? tags : []);
        setWings(data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        {trending.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-lg">Trending now</h2>
            </div>
            <div className="space-y-1">
              {trending.map((t, i) => (
                <div key={t.hashtag} className="py-2 px-2 -mx-2 rounded hover:bg-gray-50">
                  <p className="text-xs text-gray-500">#{i + 1} · Trending</p>
                  <p className="font-semibold text-gray-900">#{t.hashtag}</p>
                  <p className="text-xs text-gray-500">{t.count} wing{t.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg">Latest wings</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : wings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nothing here yet</div>
        ) : (
          wings.map((w) => <WingCard key={w._id} wing={w} />)
        )}
      </main>
    </div>
  );
}