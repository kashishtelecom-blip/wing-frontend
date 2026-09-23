'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Megaphone, Target, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';

export default function AdsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ads</h1>
              <p className="text-sm text-gray-500">Reach the right audience</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-3 gap-3">
          {[
            { Icon: Target, label: 'Precise targeting', value: '50M+' },
            { Icon: TrendingUp, label: 'Avg. CTR', value: '3.2%' },
            { Icon: DollarSign, label: 'Starting from', value: '$1/day' },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="border border-gray-200 rounded-2xl p-4 text-center">
              <Icon className="w-5 h-5 text-orange-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold mb-2">Promote your wings</h2>
            <p className="text-sm opacity-90 mb-4">
              Boost your posts, gain followers, and reach new audiences with Wing Ads.
            </p>
            <button className="bg-white text-orange-600 font-semibold py-2 px-6 rounded-full">
              Start a campaign
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}