'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { List, Plus, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';

const DEFAULT_LISTS = [
  { name: 'Tech', emoji: '💻', desc: 'Developers and makers', count: 0 },
  { name: 'News', emoji: '📰', desc: 'Breaking stories and journalists', count: 0 },
  { name: 'Friends', emoji: '👥', desc: 'People I know personally', count: 0 },
];

export default function ListsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [lists] = useState(DEFAULT_LISTS);

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
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <List className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Lists</h1>
              <p className="text-sm text-gray-500">Curated groups of people</p>
            </div>
          </div>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New list
          </button>
        </div>

        <div className="p-4">
          {lists.map((list) => (
            <div key={list.name} className="p-4 border border-gray-200 rounded-2xl mb-3 hover:bg-gray-50 transition cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                  {list.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{list.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{list.desc}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Users className="w-3 h-3" />
                    <span>{list.count} members</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 mt-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
            <p className="text-sm font-semibold text-blue-900 mb-2">🚀 Coming soon</p>
            <p className="text-sm text-blue-800">
              Create private or public lists, add people, and switch between your curated timelines.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}