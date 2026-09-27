'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { List, Plus, Users, Lock, Globe, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import {
  UserList, getMyLists, createList, deleteList,
} from '@/lib/lists';

const EMOJI_OPTIONS = ['📋', '💻', '📰', '👥', '🚀', '🎨', '📚', '🎮', '⚽', '🎵', '🍕', '🌍', '🔥', '💡', '🏆', '❤️'];

export default function ListsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formEmoji, setFormEmoji] = useState('📋');
  const [formIsPublic, setFormIsPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadLists = async () => {
    setLoading(true);
    try {
      const data = await getMyLists();
      setLists(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;
    loadLists();
  }, [authLoading, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!formName.trim()) {
      setFormError('Name required');
      return;
    }
    setCreating(true);
    try {
      const created = await createList({
        name: formName.trim(),
        description: formDesc.trim(),
        emoji: formEmoji,
        isPublic: formIsPublic,
      });
      setLists((prev) => [created, ...prev]);
      setShowCreate(false);
      setFormName('');
      setFormDesc('');
      setFormEmoji('📋');
      setFormIsPublic(true);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this list?')) return;
    try {
      await deleteList(id);
      setLists((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      console.error(err);
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
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
              <List className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lists</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Curated groups of people</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-full flex items-center gap-2 text-sm transition"
          >
            <Plus className="w-4 h-4" /> New list
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
          </div>
        ) : lists.length === 0 ? (
          <div className="p-12 text-center">
            <List className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="font-medium text-gray-900 dark:text-white mb-1">No lists yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create a list to curate who you follow.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full text-sm"
            >
              Create your first list
            </button>
          </div>
        ) : (
          <div className="p-4">
            {lists.map((list) => (
              <div
                key={list._id}
                className="p-4 border border-gray-200 dark:border-gray-800 rounded-2xl mb-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              >
                <div className="flex items-center gap-4">
                  <Link href={'/lists/' + list._id} className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-3xl">
                      {list.emoji}
                    </div>
                  </Link>
                  <Link href={'/lists/' + list._id} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{list.name}</h3>
                      {list.isPublic ? (
                        <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    {list.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{list.description}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {list.membersCount} member{list.membersCount !== 1 ? 's' : ''}
                    </p>
                  </Link>
                  <button
                    onClick={() => handleDelete(list._id)}
                    className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition"
                    title="Delete list"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreate && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create a list</h2>
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
                          ? 'bg-blue-100 dark:bg-blue-950/60 ring-2 ring-blue-500'
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
                  placeholder="e.g. Tech founders"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="Optional description"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formIsPublic}
                  onChange={(e) => setFormIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-blue-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-700 dark:text-gray-300">
                  Public list (anyone can view)
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
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-full text-sm transition disabled:opacity-50"
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