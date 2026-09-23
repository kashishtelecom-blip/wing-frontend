'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mic, Headphones, Radio, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';

export default function SpacesPage() {
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
            <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center">
              <Mic className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Spaces</h1>
              <p className="text-sm text-gray-500">Live audio conversations</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-8 text-white text-center">
            <div className="w-16 h-16 rounded-full bg-white/20 mx-auto flex items-center justify-center mb-4">
              <Radio className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Host a Space</h2>
            <p className="text-sm opacity-90 mb-6 max-w-md mx-auto">
              Start a live audio conversation. Invite speakers, take listeners, and grow your community in real time.
            </p>
            <button className="bg-white text-pink-600 font-semibold py-3 px-8 rounded-full">
              Start a Space
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          {[
            { Icon: Users, label: 'Unlimited listeners', desc: 'Bring your whole community' },
            { Icon: Headphones, label: 'Speaker slots', desc: 'Invite up to 10 speakers' },
          ].map(({ Icon, label, desc }) => (
            <div key={label} className="border border-gray-200 rounded-2xl p-4">
              <Icon className="w-5 h-5 text-pink-500 mb-2" />
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}