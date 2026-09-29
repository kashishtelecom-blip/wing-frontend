'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Plus, Search as SearchIcon, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import {
  Community, getCommunities, getMyCommunities, createCommunity,
  joinCommunity, leaveCommunity,
} from '@/lib/communities';

export default function CommunitiesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'all' | 'mine'>('all');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [mine, setMine] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [q, setQ] = useState('');
  const [working, setWorking] = useState<string | null>(null);

  // Create form
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formEmoji, setFormEmoji] = useState('👥');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const load = async () => {
    try {
      const [all, my] = await Promise.all([
        getCommunities(q || undefined),
        getMyCommunities(),
      ]);
      setCommunities(all);
      setMine(my);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, q]);

  const isMember = (c: Community) => c.members?.includes(user?.userId || '');

  const handleJoin = async (id: string) => {
    setWorking(id);
    try {
      await joinCommunity(id);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setWorking(null);
    }
  };

  const handleLeave = async (id: string) => {
    setWorking(id);
    try {
      await leaveCommunity(id);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setWorking(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setCreating(true);
    setFormError('');
    try {
      await createCommunity({
        name: formName.trim(),
        description: formDesc.trim(),
        emoji: formEmoji || '👥',
      });
      setShowCreate(false);
      setFormName('');
      setFormDesc('');
      setFormEmoji('👥');
      await load();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  const list = tab === 'all' ? communities : mine;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Communities
          </h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-1.5 px-4 rounded-full"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative mb-3">
            <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search communities..."
              className="w-full pl-9 pr-9 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:border-blue-400"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          <div className="flex gap-1">
            {(['all', 'mine'] as const).map((t) => (
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
                {t === 'all' ? 'All' : 'My communities'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm">
              {tab === 'mine' ? "You haven't joined any communities yet." : 'No communities yet.'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {tab === 'all' ? 'Be the first — tap Create.' : 'Switch to All and join one.'}
            </p>
          </div>
        ) : (
          <div>
            {list.map((c) => {
              const member = isMember(c);
              const isCreator = c.creator?._id === user.userId;
              return (
                <div
                  key={c._id}
                  className="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-800"
                >
                  <Link
                    href={'/communities/' + c._id}
                    className="flex items-start gap-3 flex-1 min-w-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-2xl flex-shrink-0">
                      {c.emoji || '👥'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {c.name}
                      </p>
                      {c.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {c.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {c.membersCount || 1} member{(c.membersCount || 1) !== 1 ? 's' : ''}
                        {isCreator && ' · Admin'}
                      </p>
                    </div>
                  </Link>
                  {!isCreator && (
                    <button
                      onClick={() => (member ? handleLeave(c._id) : handleJoin(c._id))}
                      disabled={working === c._id}
                      className={
                        'flex-shrink-0 text-xs font-semibold py-1.5 px-3 rounded-full transition disabled:opacity-50 ' +
                        (member
                          ? 'bg-white border border-gray-300 text-gray-700 hover:border-red-300 hover:text-red-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                          : 'bg-blue-500 hover:bg-blue-600 text-white')
                      }
                    >
                      {working === c._id ? '...' : member ? 'Leave' : 'Join'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Create community
              </h2>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={formEmoji}
                  onChange={(e) => setFormEmoji(e.target.value)}
                  maxLength={2}
                  className="w-14 h-14 text-center text-2xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl"
                />
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Community name"
                  maxLength={60}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="What's this community about?"
                maxLength={200}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              {formError && (
                <p className="text-sm text-red-500">{formError}</p>
              )}
              <button
                type="submit"
                disabled={creating || !formName.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-full transition disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create community'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}