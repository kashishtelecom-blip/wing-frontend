'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, TrendingUp, Eye, Heart, MessageCircle, Repeat2, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { getWingsByAuthor, getFollowers, getFollowing } from '@/lib/users';
import { Wing } from '@/lib/wings';

export default function CreatorStudioPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [wings, setWings] = useState<Wing[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    Promise.all([
      getWingsByAuthor(user.userId),
      getFollowers(user.userId).catch(() => []),
      getFollowing(user.userId).catch(() => []),
    ])
      .then(([w, f, g]) => {
        setWings(w.data || []);
        setFollowers(f.length || 0);
        setFollowing(g.length || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user]);

  const totals = wings.reduce(
    (acc, w) => ({
      views: acc.views + (w.views || 0),
      likes: acc.likes + (w.likesCount || 0),
      comments: acc.comments + (w.commentsCount || 0),
      reposts: acc.reposts + (w.repostsCount || 0),
    }),
    { views: 0, likes: 0, comments: 0, reposts: 0 },
  );

  const engagementRate = totals.views > 0
    ? (((totals.likes + totals.comments + totals.reposts) / totals.views) * 100).toFixed(1)
    : '0.0';

  if (authLoading || loading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  const stats = [
    { label: 'Wings', value: wings.length, Icon: Rocket, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Total views', value: totals.views, Icon: Eye, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Likes', value: totals.likes, Icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Comments', value: totals.comments, Icon: MessageCircle, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Reposts', value: totals.reposts, Icon: Repeat2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Followers', value: followers, Icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="max-w-3xl mx-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Creator Studio</h1>
              <p className="text-sm text-gray-500">Your performance on Wing</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map(({ label, value, Icon, color, bg }) => (
            <div key={label} className="border border-gray-200 rounded-2xl p-4">
              <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <span className="font-semibold">Engagement rate</span>
            </div>
            <p className="text-4xl font-bold">{engagementRate}%</p>
            <p className="text-sm opacity-90 mt-1">
              Interactions per view across all your wings
            </p>
          </div>
        </div>

        {wings.length > 0 && (
          <div className="px-6 pb-6">
            <h2 className="font-bold text-lg mb-3">Top performing wings</h2>
            {wings
              .sort((a, b) => b.views - a.views)
              .slice(0, 3)
              .map((w) => (
                <div key={w._id} className="border border-gray-200 rounded-xl p-4 mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm">{w.title}</h3>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {w.views}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {w.likesCount}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {w.commentsCount}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  );
}