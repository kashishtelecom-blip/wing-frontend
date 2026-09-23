'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import api from '@/lib/api';

interface UserLite {
  _id: string;
  username: string;
  name?: string;
  bio?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export default function FollowingPage() {
  const params = useParams();
  const router = useRouter();
  const { user: me, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserLite[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string | null>(null);

  const userId = params.id as string;

  useEffect(() => {
    if (!authLoading && !me) router.push('/login');
  }, [me, authLoading, router]);

  useEffect(() => {
    if (authLoading || !me || !userId) return;
    (async () => {
      try {
        const res = await api.get('/users/' + userId + '/following');
        const list = (res.data || []).map((f: any) => f.following).filter(Boolean);
        setUsers(list);

        if (me) {
          const myFollowing = await api
            .get('/users/' + me.userId + '/following')
            .catch(() => ({ data: [] }));
          const ids = new Set<string>(
            (myFollowing.data || []).map((f: any) => f.following?._id || f.following),
          );
          setFollowingIds(ids);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, me, userId]);

  const handleFollow = async (id: string) => {
    if (!me || working) return;
    setWorking(id);
    const isFollowing = followingIds.has(id);
    const next = new Set(followingIds);
    if (isFollowing) next.delete(id); else next.add(id);
    setFollowingIds(next);
    try {
      if (isFollowing) await api.delete('/users/' + id + '/follow');
      else await api.post('/users/' + id + '/follow');
    } catch {
      const revert = new Set(followingIds);
      if (isFollowing) revert.add(id); else revert.delete(id);
      setFollowingIds(revert);
    }
    setWorking(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <NavBar />
        <div className="p-8 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-4 border-b border-gray-200 flex items-center gap-3 sticky top-14 bg-white/90 backdrop-blur z-10">
          <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Following</h1>
            <p className="text-xs text-gray-500">{users.length} people</p>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-900">Not following anyone yet</p>
            <p className="text-sm text-gray-500 mt-1">When this account follows people, they will show here.</p>
          </div>
        ) : (
          users.map((u) => {
            const isFollowing = followingIds.has(u._id);
            const isMe = me?.userId === u._id;
            return (
              <div key={u._id} className="flex items-start gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition">
                <Link href={'/profile/' + u._id}>
                  <Avatar user={u} size="md" linkTo={false} />
                </Link>
                <Link href={'/profile/' + u._id} className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {u.name || u.username}
                    </span>
                    {u.isVerified && <VerifiedBadge size="sm" />}
                  </div>
                  <p className="text-gray-500 text-xs">@{u.username}</p>
                  {u.bio && <p className="text-gray-700 text-sm mt-1 line-clamp-2">{u.bio}</p>}
                </Link>
                {!isMe && (
                  <button
                    onClick={() => handleFollow(u._id)}
                    disabled={working === u._id}
                    className={
                      isFollowing
                        ? 'px-3 py-1 rounded-full font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1 bg-white border border-gray-300 text-gray-800 hover:border-red-300 hover:text-red-500'
                        : 'px-3 py-1 rounded-full font-semibold text-xs transition disabled:opacity-50 flex items-center gap-1 bg-gray-900 text-white hover:bg-black'
                    }
                  >
                    {isFollowing ? (<><Check className="w-3 h-3" /> Following</>) : ('Follow')}
                  </button>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}