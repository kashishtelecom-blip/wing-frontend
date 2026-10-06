'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Heart, MessageCircle, Repeat2, Bookmark, Eye,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { Wing, likeWing, unlikeWing } from '@/lib/wings';
import { getWing } from '@/lib/users';
import { timeAgo } from '@/lib/time';
import { getMediaUrl } from '@/lib/media';
import { RichText } from '@/components/RichText';
import { CommentsSection } from '@/components/CommentsSection';
import api from '@/lib/api';

export default function WingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [wing, setWing] = useState<Wing | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  const wingId = params.id as string;

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user || !wingId) return;
    Promise.all([
      getWing(wingId),
      api.get('/wings/' + wingId + '/likes').catch(() => ({ data: [] })),
    ])
      .then((results) => {
        const w = results[0];
        const likers = results[1].data || [];
        setWing(w);
        setLiked(likers.some((l: any) => l.user?._id === user.userId));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user, wingId]);

  const handleLike = async () => {
    if (!wing) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setWing({
      ...wing,
      likesCount: wasLiked
        ? Math.max(0, wing.likesCount - 1)
        : wing.likesCount + 1,
    });
    try {
      if (wasLiked) await unlikeWing(wing._id);
      else await likeWing(wing._id);
    } catch {
      setLiked(wasLiked);
      setWing(wing);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!wing) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center text-gray-500">Wing not found</div>
      </div>
    );
  }

  const author = wing.author;
  const authorAvatar = (author as any)?.avatarUrl;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="p-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <article className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-3">
            <Link
              href={'/profile/' + (author?._id || '')}
              className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0 overflow-hidden"
            >
              {authorAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getMediaUrl(authorAvatar)}
                  alt={author?.username || 'avatar'}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                author?.username?.[0]?.toUpperCase() || '?'
              )}
            </Link>

            <div className="flex-1 min-w-0">
              <Link
                href={'/profile/' + (author?._id || '')}
                className="flex items-center gap-2 hover:underline"
              >
                <span className="font-semibold text-gray-900 dark:text-white">
                  {author?.name || author?.username}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">
                  @{author?.username}
                </span>
              </Link>

              {wing.title && (
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mt-3">
                  {wing.title}
                </h1>
              )}
              <p className="text-gray-800 dark:text-gray-200 mt-2 whitespace-pre-wrap break-words text-lg">
                <RichText text={wing.content} />
              </p>

              {wing.imageUrl && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getMediaUrl(wing.imageUrl)}
                    alt={wing.title || 'Wing image'}
                    className="w-full max-h-[600px] object-contain bg-black"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {wing.videoUrl && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
                  <video
                    src={getMediaUrl(wing.videoUrl)}
                    controls
                    className="w-full max-h-[600px]"
                    preload="metadata"
                  />
                </div>
              )}

              {wing.hashtags && wing.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {wing.hashtags.map((tag) => (
                    <Link
                      key={tag}
                      href={'/hashtag/' + tag}
                      className="text-blue-500 text-sm hover:underline"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
                {timeAgo(wing.createdAt)}
              </p>

              <div className="flex items-center gap-6 mt-4 text-gray-500 dark:text-gray-400 text-sm border-t border-gray-100 dark:border-gray-800 pt-4">
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {wing.commentsCount}
                </span>
                <span className="flex items-center gap-1">
                  <Repeat2 className="w-4 h-4" />
                  {wing.repostsCount}
                </span>
                <button
                  onClick={handleLike}
                  className={
                    liked
                      ? 'flex items-center gap-1 text-red-500 transition'
                      : 'flex items-center gap-1 hover:text-red-500 transition'
                  }
                >
                  <Heart className={liked ? 'w-4 h-4 fill-current' : 'w-4 h-4'} />
                  {wing.likesCount}
                </button>
                <span className="flex items-center gap-1">
                  <Bookmark className="w-4 h-4" />
                </span>
                <span className="flex items-center gap-1 ml-auto">
                  <Eye className="w-4 h-4" />
                  {wing.views}
                </span>
              </div>
            </div>
          </div>
        </article>

        {/* ✅ Inline comments with action row (Like/Reply/Repost/Share) */}
        <div className="p-4">
          <CommentsSection
            wingId={wing._id}
            commentsCount={wing.commentsCount}
            onCountChange={(delta) =>
              setWing((prev) =>
                prev
                  ? { ...prev, commentsCount: Math.max(0, prev.commentsCount + delta) }
                  : prev,
              )
            }
          />
        </div>
      </main>
    </div>
  );
}