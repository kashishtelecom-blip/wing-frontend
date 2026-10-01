'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { List, Plus, X, Users, Lock, Globe } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { UserList, getMyLists, createList } from '@/lib/lists';

export default function ListsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formEmoji, setFormEmoji] = useState('📋');
  const [formPublic, setFormPublic] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const load = async () => {
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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setCreating(true);
    setFormError('');
    try {
      await createList({
        name: formName.trim(),
        description: formDesc.trim(),
        emoji: formEmoji || '📋',
        isPublic: formPublic,
      });
      setShowCreate(false);
      setFormName('');
      setFormDesc('');
      setFormEmoji('📋');
      setFormPublic(true);
      await load();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to create list');
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <List className="w-5 h-5" />
            Lists
          </h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-1.5 px-4 rounded-full"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Lists let you organize accounts you follow into custom groups. Curate a
            topic — for example, "Tech Founders" or "Designers".
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : lists.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <List className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm">You haven&apos;t created any lists yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Tap Create to make your first list.
            </p>
          </div>
        ) : (
          <div>
            {lists.map((list) => (
              <Link
                key={list._id}
                href={'/lists/' + list._id}
                className="flex items-start gap-3 p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-2xl flex-shrink-0">
                  {list.emoji || '📋'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {list.name}
                    </p>
                    {list.isPublic ? (
                      <Globe className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                  {list.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                      {list.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {list.membersCount || 0} member
                    {(list.membersCount || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
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
            className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Create a list
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
                  id="list-emoji"
                  name="emoji"
                  type="text"
                  value={formEmoji}
                  onChange={(e) => setFormEmoji(e.target.value)}
                  maxLength={2}
                  className="w-14 h-14 text-center text-2xl border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl"
                />
                <input
                  id="list-name"
                  name="name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="List name"
                  maxLength={60}
                  autoFocus
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <textarea
                id="list-description"
                name="description"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="What's this list about?"
                maxLength={200}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <label
                htmlFor="list-public"
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <input
                  id="list-public"
                  name="isPublic"
                  type="checkbox"
                  checked={formPublic}
                  onChange={(e) => setFormPublic(e.target.checked)}
                  className="w-4 h-4 accent-blue-500"
                />
                Make this list public
              </label>
              {formError && (
                <p className="text-sm text-red-500">{formError}</p>
              )}
              <button
                type="submit"
                disabled={creating || !formName.trim()}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-full transition disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create list'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}