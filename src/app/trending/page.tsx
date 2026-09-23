'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Hash, Flame } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { WingCard } from '@/components/WingCard';
import { getTrendingHashtags, getPublicWings, Wing } from '@/lib/wings';

export default function TrendingPage() {
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
    Promise.all([getTrendingHashtags(20), getPublicWings(1, 30)])
      .then(([tags, data]) => {
        setTrending(Array.isArray(tags) ? tags : []);
        const sorted = (data.data || []).sort((a: Wing, b: Wing) => {
          const scoreA = a.likesCount * 3 + a.repostsCount * 2 + a.commentsCount * 2 + a.views * 0.1;
          const scoreB = b.likesCount * 3 + b.repostsCount * 2 + b.commentsCount * 2 + b.views * 0.1;
          return scoreB - scoreA;
        });
        setWings(sorted);
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
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Trending</h1>
              <p className="text-sm text-gray-500">What&apos;s hot on Wing right now</p>
            </div>
          </div>
        </div>

        {trending.length > 0 && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <h2 className="font-bold">Trending hashtags</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {trending.map((t, i) => (
                <Link
                  key={t.hashtag}
                  href={`/hashtag/${t.hashtag}`}
                  className="border border-gray-200 rounded-xl p-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-400">#{i + 1}</span>
                    <Hash className="w-3 h-3 text-blue-500" />
                    <span className="font-semibold text-gray-900 truncate">{t.hashtag}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t.count} wing{t.count !== 1 ? 's' : ''}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold">Hot wings</h2>
          <p className="text-xs text-gray-500 mt-1">Ranked by likes, reposts, comments & views</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : wings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Nothing trending yet</div>
        ) : (
          wings.map((w) => <WingCard key={w._id} wing={w} />)
        )}
      </main>
    </div>
  );
}