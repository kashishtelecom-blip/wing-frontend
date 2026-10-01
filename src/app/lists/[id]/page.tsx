'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Users, Loader2, Trash2, UserPlus, X, Globe, Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { WingCard } from '@/components/WingCard';
import { Wing } from '@/lib/wings';
import api from '@/lib/api';
import {
  UserList, getList, getListTimeline,
  addListMembers, removeListMember, deleteList,
} from '@/lib/lists';

export default function ListDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const listId = params.id as string;

  const [list, setList] = useState<UserList | null>(null);
  const [wings, setWings] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const loadAll = async () => {
    try {
      const [l, timeline] = await Promise.all([
        getList(listId),
        getListTimeline(listId, 1, 20).catch(() => ({ data: [] })),
      ]);
      setList(l);
      setWings(timeline?.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'List not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user || !listId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, listId]);

  const isOwner = list?.owner?._id === user?.userId;

  const openAdd = async () => {
    setShowAdd(true);
    setSelectedIds(new Set());
    try {
      const res = await api.get('/users?limit=50');
      const data = res.data;
      const allUsers = Array.isArray(data) ? data : data.data || [];
      const memberIds = new Set(
        (list?.members || []).map((m: any) => String(m?._id || m)),
      );
      setCandidates(allUsers.filter((u: any) => !memberIds.has(String(u._id))));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async () => {
    if (!list || selectedIds.size === 0) return;
    setAdding(true);
    try {
      await addListMembers(list._id, Array.from(selectedIds));
      const fresh = await getList(list._id);
      setList(fresh);
      setShowAdd(false);
      setSelectedIds(new Set());
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add members');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!list) return;
    if (!confirm('Remove this member from the list?')) return;
    try {
      await removeListMember(list._id, userId);
      const fresh = await getList(list._id);
      setList(fresh);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDelete = async () => {
    if (!list) return;
    if (!confirm('Delete this list permanently?')) return;
    setWorking(true);
    try {
      await deleteList(list._id);
      router.push('/lists');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    } finally {
      setWorking(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-12 text-center">
          <p className="text-6xl mb-4">404</p>
          <p className="text-gray-900 dark:text-white font-medium mb-1">
            List not found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/lists"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-full text-sm"
          >
            Back to Lists
          </Link>
        </div>
      </div>
    );
  }

  const filteredCandidates = candidates.filter(
    (u) =>
      !searchQuery ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <button
            onClick={() => router.push('/lists')}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {list.name}
          </h1>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-4xl flex-shrink-0">
              {list.emoji || '📋'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {list.name}
                </h1>
                {list.isPublic ? (
                  <Globe className="w-4 h-4 text-gray-400" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
              </div>
              {list.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                  {list.description}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 flex items-center gap-1">
                <Users className="w-4 h-4" />
                <strong className="text-gray-900 dark:text-white">
                  {list.membersCount || 0}
                </strong>{' '}
                member{(list.membersCount || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {isOwner && (
            <div className="flex gap-2 mt-5 flex-wrap">
              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-full text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add members
              </button>
              <button
                onClick={handleDelete}
                disabled={working}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-5 rounded-full text-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete list
              </button>
            </div>
          )}
        </div>

        {list.members && list.members.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-medium mb-3">
              Members ({list.membersCount})
            </p>
            <div className="space-y-1">
              {list.members.map((m: any) => {
                const member = m._id ? m : { _id: m, username: 'user' };
                const isMe = String(member._id) === String(user?.userId);
                return (
                  <div
                    key={member._id}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                  >
                    <Link href={'/profile/' + member._id}>
                      <Avatar user={member} size="md" linkTo={false} />
                    </Link>
                    <Link href={'/profile/' + member._id} className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {member.name || member.username}
                        </span>
                        {member.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{member.username}
                      </p>
                    </Link>
                    {isOwner && !isMe && (
                      <button
                        onClick={() => handleRemove(member._id)}
                        className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition"
                        title="Remove from list"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-bold text-gray-900 dark:text-white">Timeline</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Recent Wings from members of this list
          </p>
        </div>

        {wings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            No wings from list members yet.
          </div>
        ) : (
          wings.map((w) => <WingCard key={w._id} wing={w} />)
        )}
      </main>

      {showAdd && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAdd(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Add members
              </h2>
              <button
                onClick={() => setShowAdd(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <input
                id="list-member-search"
                name="search"
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredCandidates.map((u) => {
                const selected = selectedIds.has(u._id);
                return (
                  <button
                    key={u._id}
                    onClick={() => toggleSelection(u._id)}
                    className={
                      'w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left border-b border-gray-100 dark:border-gray-800 ' +
                      (selected ? 'bg-blue-50 dark:bg-blue-950/30' : '')
                    }
                  >
                    <Avatar user={u} size="md" linkTo={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {u.name || u.username}
                        </span>
                        {u.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{u.username}
                      </p>
                    </div>
                    <div
                      className={
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' +
                        (selected
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 dark:border-gray-600')
                      }
                    >
                      {selected && <span className="text-white text-xs">✓</span>}
                    </div>
                  </button>
                );
              })}
              {filteredCandidates.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No users available to add
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 rounded-full text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={adding || selectedIds.size === 0}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-full text-sm disabled:opacity-50"
              >
                {adding
                  ? 'Adding...'
                  : 'Add ' +
                    selectedIds.size +
                    ' member' +
                    (selectedIds.size !== 1 ? 's' : '')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}