'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { NavBar } from '@/components/NavBar';
import { WingCard } from '@/components/WingCard';
import { WingCardSkeleton } from '@/components/WingCardSkeleton';
import { BusinessPage, getBusinessPageBySlug, toggleFollowBusinessPage } from '@/lib/business';
import { useAuth } from '@/lib/auth-context';
import { getPublicWings, Wing } from '@/lib/wings';
import api from '@/lib/api';

export default function BusinessPageProfile() {
  const { slug } = useParams() as { slug: string };
  const { user } = useAuth();
  const [page, setPage] = useState<BusinessPage | null>(null);
  const [wings, setWings] = useState<Wing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [working, setWorking] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!slug) return;

    Promise.all([
      getBusinessPageBySlug(slug),
      getPublicWings(1, 20, slug).catch(() => ({ data: [] })),
    ])
      .then(([pageData, wingsData]) => {
        setPage(pageData);
        setWings(wingsData.data || []);
        if (user && pageData.followers) {
          setIsFollowing(pageData.followers.some((id: string) => id === user.userId));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug, user]);

  const handleFollow = async () => {
    if (!user || !page || working) return;
    setWorking(true);
    try {
      const res = await toggleFollowBusinessPage(page.slug);
      setIsFollowing(res.following);
      setPage((prev) => {
        if (!prev) return prev;
        const newFollowers = res.following
          ? [...prev.followers, user.userId]
          : prev.followers.filter((id) => id !== user.userId);
        return { ...prev, followers: newFollowers };
      });
    } catch (err) {
      console.error(err);
    } finally {
      setWorking(false);
    }
  };

  const uploadImage = async (endpoint: 'avatar' | 'cover', file: File) => {
    if (!page) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/business/${page.slug}/${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPage(res.data);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <main className="max-w-2xl mx-auto">
          <div className="h-48 bg-gray-200 dark:bg-gray-800 animate-pulse" />
          <WingCardSkeleton />
          <WingCardSkeleton />
        </main>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center text-gray-500">Page not found</div>
      </div>
    );
  }

  const isOwner = user?.userId === page.owner;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />

      {/* Cover Photo */}
      <div
        className="h-48 w-full bg-gradient-to-r from-blue-500 to-purple-600 bg-cover bg-center"
        style={page.coverUrl ? { backgroundImage: `url(${page.coverUrl})` } : undefined}
      />

      <main className="max-w-2xl mx-auto px-4">
        {/* Profile Header */}
        <div className="relative -mt-12 mb-6 flex items-end justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
          <div className="flex items-end gap-4">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-900 border-4 border-white dark:border-gray-950 flex items-center justify-center text-3xl font-bold text-blue-600 shadow-sm overflow-hidden">
              {page.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={page.avatarUrl} alt={page.name} className="w-full h-full object-cover" />
              ) : (
                page.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{page.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{page.slug} · {page.category} · {page.followers?.length || 0} followers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            {isOwner && (
              <button
                onClick={() => setShowEdit(true)}
                className="px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Edit Page
              </button>
            )}
            <button
              onClick={handleFollow}
              disabled={working}
              className={`px-6 py-2 rounded-full font-semibold transition disabled:opacity-50 ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>

        {page.description && (
          <p className="text-gray-700 dark:text-gray-300 mb-6 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
            {page.description}
          </p>
        )}

        <div className="mt-4">
          <h2 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Posts</h2>
          {wings.length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-gray-50 dark:bg-gray-900 rounded-xl">
              No posts yet.
            </div>
          ) : (
            wings.map((w) => <WingCard key={w._id} wing={w} />)
          )}
        </div>
      </main>

      {/* Edit Page Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 dark:text-white">Edit {page.name}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Page Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage('avatar', file);
                  }}
                  className="w-full text-sm dark:text-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Cover Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadImage('cover', file);
                  }}
                  className="w-full text-sm dark:text-gray-300"
                />
              </div>

              {uploading && <p className="text-blue-500 text-sm">Uploading...</p>}
            </div>

            <button
              onClick={() => setShowEdit(false)}
              className="mt-6 w-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-white font-semibold py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}