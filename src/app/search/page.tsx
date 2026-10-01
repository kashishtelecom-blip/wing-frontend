'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { WingCard } from '@/components/WingCard';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Wing } from '@/lib/wings';
import api from '@/lib/api';

interface SimpleUser {
  _id: string;
  username: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

type Tab = 'top' | 'users' | 'wings';

function SearchInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [tab, setTab] = useState<Tab>('top');
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [wings, setWings] = useState<Wing[]>([]);
  const [totalWings, setTotalWings] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (!debouncedQuery) {
      setUsers([]);
      setWings([]);
      setTotalWings(0);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    api
      .get(`/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((res) => {
        setUsers(res.data?.users || []);
        setWings(res.data?.wings?.data || []);
        setTotalWings(res.data?.wings?.total || 0);
      })
      .catch((err) => {
        console.error('Search failed', err);
        setUsers([]);
        setWings([]);
        setTotalWings(0);
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, authLoading, user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center text-gray-500">Loading…</div>
      </div>
    );
  }

  const showUsers = tab === 'top' || tab === 'users';
  const showWings = tab === 'top' || tab === 'wings';
  const hasResults = users.length > 0 || wings.length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-950 z-10">
          <div className="relative">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users and wings…"
              autoFocus
              className="w-full pl-9 pr-9 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-blue-400"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          <div className="flex gap-1 mt-3">
            {(['top', 'users', 'wings'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={
                  'px-3 py-1 rounded-full text-sm font-medium transition ' +
                  (tab === t
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')
                }
              >
                {t === 'top' ? 'Top' : t === 'users' ? 'Users' : 'Wings'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Searching…</div>
        ) : !debouncedQuery ? (
          <div className="p-8 text-center text-gray-500">
            <SearchIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm">Start typing to search Wing.</p>
          </div>
        ) : !hasResults && searched ? (
          <div className="p-8 text-center text-gray-500">
            No results for &ldquo;{debouncedQuery}&rdquo;
          </div>
        ) : (
          <>
            {showUsers && users.length > 0 && (
              <section>
                {tab === 'top' && (
                  <h2 className="px-4 pt-4 pb-2 font-bold text-gray-900 dark:text-white">
                    Users
                  </h2>
                )}
                {users.map((u) => (
                  <Link
                    key={u._id}
                    href={'/profile/' + u._id}
                    className="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                  >
                    <Avatar user={u} size="md" linkTo={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 dark:text-white truncate">
                          {u.name || u.username}
                        </span>
                        {u.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-gray-500 text-sm">@{u.username}</p>
                      {u.bio && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 line-clamp-2">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </section>
            )}

            {showWings && wings.length > 0 && (
              <section>
                {tab === 'top' && (
                  <h2 className="px-4 pt-4 pb-2 font-bold text-gray-900 dark:text-white">
                    Wings
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      {totalWings} result{totalWings !== 1 ? 's' : ''}
                    </span>
                  </h2>
                )}
                {wings.map((w) => (
                  <WingCard key={w._id} wing={w} />
                ))}
              </section>
            )}

            {tab === 'users' && users.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No users match &ldquo;{debouncedQuery}&rdquo;
              </div>
            )}
            {tab === 'wings' && wings.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No wings match &ldquo;{debouncedQuery}&rdquo;
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-gray-950">
          <NavBar />
          <div className="p-8 text-center text-gray-500">Loading…</div>
        </div>
      }
    >
      <SearchInner />
    </Suspense>
  );
}