'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Hash } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { WingCard } from '@/components/WingCard';
import { Wing } from '@/lib/wings';
import api from '@/lib/api';

export default function HashtagPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [wings, setWings] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(true);
  const tag = (params.tag as string) || '';

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user || !tag) return;
    setLoading(true);
    api
      .get(`/wings/hashtag/${tag}`)
      .then((res) => setWings(res.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user, tag]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Hash className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">#{tag}</h1>
              <p className="text-sm text-gray-500">
                {wings.length} wing{wings.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : wings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No wings with #{tag} yet.
          </div>
        ) : (
          wings.map((w) => <WingCard key={w._id} wing={w} />)
        )}
      </main>
    </div>
  );
}