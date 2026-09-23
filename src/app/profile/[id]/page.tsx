'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Pin, MessageCircle, MoreHorizontal, UserX, VolumeX, Flag } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { WingCard } from '@/components/WingCard';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { Wing } from '@/lib/wings';
import api from '@/lib/api';
import {
  getUser, followUser, unfollowUser, getFollowers, getFollowing, getWingsByAuthor, UserProfile,
  blockUser, unblockUser, muteUser, unmuteUser,
} from '@/lib/users';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: me, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wings, setWings] = useState<Wing[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const userId = params.id as string;

    useEffect(() => {
    if (authLoading || !me || !userId) return;
    setLoading(true);
    (async () => {
      try {
        const u = await getUser(userId);
        setProfile(u);

        const results = await Promise.all([
          getFollowers(u._id).catch(() => []),
          getFollowing(u._id).catch(() => []),
          getWingsByAuthor(u._id),
          api.get('/users/' + me.userId + '/following').catch(() => ({ data: [] })),
          api.get('/users/me/blocked').catch(() => ({ data: [] })),
          api.get('/users/me/muted').catch(() => ({ data: [] })),
        ]);

        setFollowers((results[0] as any[]).length || 0);
        setFollowing((results[1] as any[]).length || 0);
        setWings((results[2] as any).data || []);

        const myFollowing = (results[3] as any).data || [];
        const alreadyFollowing = myFollowing.some((f: any) => {
          const followedId = f.following?._id || f.following;
          return String(followedId) === String(u._id);
        });
        setIsFollowing(alreadyFollowing);

        const blockedList = (results[4] as any).data || [];
        setIsBlocked(blockedList.some((b: any) => String(b._id) === String(u._id)));

        const mutedList = (results[5] as any).data || [];
        setIsMuted(mutedList.some((m: any) => String(m._id) === String(u._id)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, me, userId]);

  const handleFollow = async () => {
    if (!profile || working) return;
    setWorking(true);
    try {
      if (isFollowing) {
        await unfollowUser(profile._id);
        setFollowers((c) => c - 1);
        setIsFollowing(false);
      } else {
        await followUser(profile._id);
        setFollowers((c) => c + 1);
        setIsFollowing(true);
      }
    } catch (err: any) {
      console.error('Follow toggle failed', err.response?.data || err);
    }
    setWorking(false);
  };

  const handleMessage = () => {
    if (!profile) return;
    router.push('/chat?user=' + profile._id);
  };

const handleBlock = async () => {
    if (!profile) return;
    setMenuOpen(false);
    try {
      if (isBlocked) {
        await unblockUser(profile._id);
        setIsBlocked(false);
      } else {
        if (!confirm('Block @' + profile.username + '? They won\'t be able to see your wings or message you.')) return;
        await blockUser(profile._id);
        setIsBlocked(true);
        setIsMuted(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMute = async () => {
    if (!profile) return;
    setMenuOpen(false);
    try {
      if (isMuted) {
        await unmuteUser(profile._id);
        setIsMuted(false);
      } else {
        await muteUser(profile._id);
        setIsMuted(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center text-gray-500">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center text-gray-500">User not found</div>
      </div>
    );
  }

  const isMe = String(me?.userId) === String(profile._id);
  const followBtnClass = isFollowing
    ? 'font-semibold py-2 px-5 rounded-full transition text-sm bg-white hover:bg-red-50 text-red-500 border border-red-300'
    : 'font-semibold py-2 px-5 rounded-full transition text-sm bg-blue-500 hover:bg-blue-600 text-white';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start gap-4">
            <Avatar user={profile} size="xl" linkTo={false} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {profile.name || profile.username}
                </h1>
                {profile.isVerified && <VerifiedBadge size="lg" />}
              </div>
              <p className="text-gray-500">@{profile.username}</p>
              {profile.bio && <p className="text-gray-700 mt-2 text-sm">{profile.bio}</p>}
              <div className="flex gap-4 mt-3 text-sm">
                <button
                  onClick={() => router.push('/profile/' + profile._id + '/followers')}
                  className="text-gray-700 hover:underline"
                >
                  <strong>{followers}</strong> followers
                </button>
                <button
                  onClick={() => router.push('/profile/' + profile._id + '/following')}
                  className="text-gray-700 hover:underline"
                >
                  <strong>{following}</strong> following
                </button>
                <span className="text-gray-700"><strong>{wings.length}</strong> wings</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isMe ? (
                <button
                  onClick={() => router.push('/settings')}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-5 rounded-full transition text-sm"
                >
                  Edit profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleMessage}
                    className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-full transition text-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                 <button
                    onClick={handleFollow}
                    disabled={working}
                    className={followBtnClass}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(!menuOpen)}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    </button>
                    {menuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
                        <button
                          onClick={handleBlock}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm text-red-500"
                        >
                          <UserX className="w-4 h-4" />
                          {isBlocked ? 'Unblock' : 'Block'} @{profile.username}
                        </button>
                        <button
                          onClick={handleMute}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <VolumeX className="w-4 h-4" />
                          {isMuted ? 'Unmute' : 'Mute'} @{profile.username}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {profile.pinnedWing && (
          <div className="border-b border-gray-200 bg-blue-50/30">
            <div className="flex items-center gap-2 text-xs text-gray-500 p-4 pb-0">
              <Pin className="w-3 h-3" />
              <span>Pinned wing</span>
            </div>
            <WingCard wing={profile.pinnedWing} />
          </div>
        )}

        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg">Wings</h2>
        </div>
        {wings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No wings yet.</div>
        ) : (
          wings.map((w) => <WingCard key={w._id} wing={w} />)
        )}
      </main>
    </div>
  );
}