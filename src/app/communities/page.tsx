'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users, Plus, Lock, Globe, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import {
  Community, getAllCommunities, getMyCommunities,
  createCommunity, joinCommunity, leaveCommunity, deleteCommunity,
} from '@/lib/communities';

const EMOJI_OPTIONS = ['👥', '🚀', '💻', '🎨', '📚', '🎮', '⚽', '🎵', '🍕', '🌍', '🔥', '💡', '🏆', '🐦', '🎬', '📷'];

export default function CommunitiesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myIds, setMyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [working, setWorking] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formEmoji, setFormEmoji] = useState('👥');
  const [formTags, setFormTags] = useState('');
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [all, mine] = await Promise.all([
        getAllCommunities().catch(() => []),
        getMyCommunities().catch(() => []),
      ]);
      setCommunities(all);
      setMyIds(new Set(mine.map((c) => c._id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    loadAll();
  }, [authLoading, user]);

  const handleJoin = async (id: string) => {
    if (working) return;
    setWorking(id);
    try {
      await joinCommunity(id);
      setMyIds((prev) => new Set([...prev, id]));
      setCommunities((prev) =>
        prev.map((c) => (c._id === id ? { ...c, membersCount: c.membersCount + 1 } : c)),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setWorking(null);
    }
  };

  const handleLeave = async (id: string) => {
    if (working) return;
    setWorking(id);
    try {
      await leaveCommunity(id);
      setMyIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setCommunities((prev) =>
        prev.map((c) => (c._id === id ? { ...c, membersCount: Math.max(0, c.membersCount - 1) } : c)),
      );
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to leave');
    } finally {
      setWorking(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (formName.trim().length < 3) {
      setFormError('Name must be at least 3 characters');
      return;
    }
    if (formDesc.trim().length < 3) {
      setFormError('Description must be at least 3 characters');
      return;
    }
    setCreating(true);
    try {
      const tags = formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5);
      const created = await createCommunity({
        name: formName.trim(),
        description: formDesc.trim(),
        emoji: formEmoji,
        isPublic: formIsPublic,
        tags,
      });
      setCommunities((prev) => [created, ...prev]);
      setMyIds((prev) => new Set([...prev, created._id]));
      setShowCreate(false);
      setFormName('');
      setFormDesc('');
      setFormEmoji('👥');
      setFormTags('');
      setFormIsPublic(true);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create community');
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Communities</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Join or create groups around shared interests</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 text-sm transition"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin mx-auto" />
          </div>
        ) : communities.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="font-medium text-gray-900 dark:text-white mb-1">No communities yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Be the first to create one!</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-6 rounded-full text-sm"
            >
              Create community
            </button>
          </div>
        ) : (
          <div className="p-4">
            {communities.map((c) => {
              const joined = myIds.has(c._id);
              const isCreator = c.creator?._id === user.userId;
              return (
                <div
                  key={c._id}
                  className="p-4 border border-gray-200 dark:border-gray-800 rounded-2xl mb-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                >
                  <div className="flex items-center gap-4">
                    <Link href={'/communities/' + c._id} className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-3xl">
                        {c.emoji}
                      </div>
                    </Link>
                    <Link href={'/communities/' + c._id} className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{c.name}</h3>
                        {c.isPublic ? (
                          <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        ) : (
                          <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{c.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {c.membersCount.toLocaleString()} member{c.membersCount !== 1 ? 's' : ''}
                      </p>
                    </Link>
                    {isCreator ? (
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                        Owner
                      </span>
                    ) : joined ? (
                      <button
                        onClick={() => handleLeave(c._id)}
                        disabled={working === c._id}
                        className="px-4 py-1.5 rounded-full font-semibold text-xs transition border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-red-300 hover:text-red-500 disabled:opacity-50"
                      >
                        {working === c._id ? '...' : 'Leave'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoin(c._id)}
                        disabled={working === c._id}
                        className="bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-black dark:hover:bg-gray-100 text-white font-semibold py-1.5 px-4 rounded-full text-xs transition disabled:opacity-50"
                      >
                        {working === c._id ? '...' : 'Join'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create dialog */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create Community</h2>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setFormEmoji(e)}
                      className={
                        'w-10 h-10 rounded-xl flex items-center justify-center text-xl transition ' +
                        (formEmoji === e
                          ? 'bg-purple-100 dark:bg-purple-950/60 ring-2 ring-purple-500'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700')
                      }
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={50}
                  placeholder="e.g. NestJS Developers"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formName.length}/50</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  maxLength={300}
                  rows={3}
                  placeholder="What is this community about?"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formDesc.length}/300</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tags <span className="text-gray-400">(comma separated, max 5)</span>
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="tech, coding, javascript"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formIsPublic}
                  onChange={(e) => setFormIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-purple-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                  Public community (anyone can join)
                </label>
              </div>

              {formError && (
                <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  {formError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 rounded-full text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 rounded-full text-sm transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}