'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { useAuth } from '@/lib/auth-context';
import { getTrendingHashtags, getPublicWings, Wing } from '@/lib/wings';
import { WingCard } from '@/components/WingCard';
import { WingCardSkeleton } from '@/components/WingCardSkeleton'; // NEW

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
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-lg text-gray-900 dark:text-white">Trending now</h2>
            </div>
            <div className="space-y-1">
              {trending.map((t, i) => (
                /* FIXED: Added fallback to index (i) to prevent duplicate/undefined key crashes */
                <div key={`${t.hashtag}-${i}`} className="py-2 px-2 -mx-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition cursor-pointer">
                  <p className="text-xs text-gray-500 dark:text-gray-400">#{i + 1} · Trending</p>
                  <p className="font-semibold text-gray-900 dark:text-white">#{t.hashtag}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.count} wing{t.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Latest wings</h2>
        </div>

        {/* NEW: Replaced text loader with Skeleton Loaders */}
        {loading ? (
          <div className="flex flex-col">
            <WingCardSkeleton />
            <WingCardSkeleton />
            <WingCardSkeleton />
          </div>
        ) : wings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Nothing here yet</div>
        ) : (
          wings.map((w) => <WingCard key={w._id} wing={w} />)
        )}
      </main>
    </div>
  );
}