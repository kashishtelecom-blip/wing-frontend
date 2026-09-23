'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { WingCard } from '@/components/WingCard';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Wing } from '@/lib/wings';
import { searchAll } from '@/lib/search';

type Tab = 'all' | 'users' | 'wings';

interface UserResult {
  _id: string;
  username: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

function SearchPageInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [tab, setTab] = useState<Tab>('all');
  const [users, setUsers] = useState<UserResult[]>([]);
  const [wings, setWings] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setUsers([]); setWings([]); setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchAll(q);
      setUsers(data.users || []);
      setWings(data.wings?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'Top', count: users.length + wings.length },
    { key: 'users', label: 'People', count: users.length },
    { key: 'wings', label: 'Wings', count: wings.length },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-4 border-b border-gray-200 sticky top-14 bg-white/95 backdrop-blur z-10">
          <div className="relative">
            <SearchIcon className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Wing"
              autoFocus
              className="w-full pl-12 pr-10 py-3 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {searched && (
          <div className="border-b border-gray-200 flex">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition ${
                  tab === key
                    ? 'text-blue-500 border-blue-500'
                    : 'text-gray-600 hover:bg-gray-50 border-transparent'
                }`}
              >
                {label}
                {count > 0 && <span className="ml-1 text-gray-400">({count})</span>}
              </button>
            ))}
          </div>
        )}

        {!searched && (
          <div className="p-12 text-center text-gray-500">
            <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium mb-1">Search Wing</p>
            <p className="text-sm">Find people, wings, and hashtags</p>
          </div>
        )}

        {loading && (
          <div className="p-8 text-center text-gray-500">Searching...</div>
        )}

        {!loading && searched && (users.length > 0 || wings.length > 0) && (
          <>
            {(tab === 'all' || tab === 'users') && users.length > 0 && (
              <div>
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h2 className="font-bold text-sm text-gray-700">People</h2>
                </div>
                {users.map((u) => (
                  <Link
                    key={u._id}
                    href={`/profile/${u._id}`}
                    className="flex items-start gap-3 p-4 hover:bg-gray-50 transition border-b border-gray-100"
                  >
                    <Avatar user={u} size="md" linkTo={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900">{u.name || u.username}</span>
                        {u.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-gray-500 text-sm">@{u.username}</p>
                      {u.bio && <p className="text-gray-700 text-sm mt-1 line-clamp-2">{u.bio}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {(tab === 'all' || tab === 'wings') && wings.length > 0 && (
              <div>
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <h2 className="font-bold text-sm text-gray-700">Wings</h2>
                </div>
                {wings.map((w) => <WingCard key={w._id} wing={w} />)}
              </div>
            )}
          </>
        )}

        {!loading && searched && users.length === 0 && wings.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-900 font-semibold mb-1">No results for &quot;{query}&quot;</p>
            <p className="text-sm text-gray-500">Try a different keyword or check your spelling</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>}>
      <SearchPageInner />
    </Suspense>
  );
}