'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserPlus, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from './Avatar';
import { VerifiedBadge } from './VerifiedBadge';
import api from '@/lib/api';

interface SuggestedUser {
  _id: string;
  username: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export function WhoToFollow() {
  const { user } = useAuth();
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
                const [usersRes, followingRes, blockedRes] = await Promise.all([
          api.get('/users?limit=20').catch(() => ({ data: [] })),
          api.get(`/users/${user.userId}/following`).catch(() => ({ data: [] })),
          api.get('/users/me/blocked').catch(() => ({ data: [] })),
        ]);
        const blockedIds = new Set<string>(
          (blockedRes.data || []).map((b: any) => b._id),
        );
        const list: SuggestedUser[] = Array.isArray(usersRes.data)
          ? usersRes.data
          : usersRes.data?.data || [];
        const followingIds = new Set<string>(
          (followingRes.data || []).map((f: any) => f.following?._id || f.following),
        );
               const suggested = list
          .filter((u) => u._id !== user.userId && !followingIds.has(u._id) && !blockedIds.has(u._id))
          .slice(0, 3);
        setUsers(suggested);
        setFollowing(followingIds);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const handleFollow = async (id: string) => {
    if (working) return;
    setWorking(id);
    const isFollowingNow = following.has(id);
    const next = new Set(following);
    if (isFollowingNow) next.delete(id); else next.add(id);
    setFollowing(next);
    try {
      if (isFollowingNow) await api.delete(`/users/${id}/follow`);
      else await api.post(`/users/${id}/follow`);
    } catch {
      const reverted = new Set(following);
      if (isFollowingNow) reverted.add(id); else reverted.delete(id);
      setFollowing(reverted);
    } finally {
      setWorking(null);
    }
  };

  if (loading || users.length === 0) return null;

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-2xl p-4 mb-4 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="w-4 h-4 text-gray-700" />
                <h2 className="font-bold text-gray-900 dark:text-white">Who to follow</h2>
      </div>
      <div className="space-y-1">
        {users.map((u) => {
          const isFollowingNow = following.has(u._id);
          return (
            <div key={u._id} className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-white transition">
              <Link href={`/profile/${u._id}`} className="flex-shrink-0">
                <Avatar user={u} size="md" linkTo={false} />
              </Link>
              <Link href={`/profile/${u._id}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">{u.name || u.username}</span>
                  {u.isVerified && <VerifiedBadge size="sm" />}
                </div>
                <p className="text-gray-500 text-xs truncate">@{u.username}</p>
              </Link>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFollow(u._id); }}
                disabled={working === u._id}
                className={`px-3 py-1 rounded-full font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1 ${
                  isFollowingNow
                    ? 'bg-white border border-gray-300 text-gray-800 hover:border-red-300 hover:text-red-500'
                    : 'bg-gray-900 text-white hover:bg-black'
                }`}
              >
                {isFollowingNow ? (<><Check className="w-3 h-3" /> Following</>) : ('Follow')}
              </button>
            </div>
          );
        })}
      </div>
      <Link href="/explore" className="block text-blue-500 text-sm font-medium mt-3 hover:underline">
        Show more
      </Link>
    </div>
  );
}