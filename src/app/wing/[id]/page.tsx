'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageCircle, Repeat2, Bookmark, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { Wing, likeWing, unlikeWing } from '@/lib/wings';
import { getWing, getComments, createComment, Comment } from '@/lib/users';
import { timeAgo } from '@/lib/time';
import { getMediaUrl } from '@/lib/media';
import { RichText } from '@/components/RichText';
import api from '@/lib/api';

export default function WingPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [wing, setWing] = useState<Wing | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);

  const wingId = params.id as string;

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user || !wingId) return;
    Promise.all([
      getWing(wingId),
      getComments(wingId),
      api.get('/wings/' + wingId + '/likes').catch(() => ({ data: [] })),
    ])
      .then((results) => {
        const w = results[0];
        const c = results[1];
        const likers = results[2].data || [];
        setWing(w);
        setComments(c);
        setLiked(likers.some((l: any) => l.user?._id === user.userId));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [authLoading, user, wingId]);

  const handleLike = async () => {
    if (!wing) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setWing({ ...wing, likesCount: wasLiked ? wing.likesCount - 1 : wing.likesCount + 1 });
    try {
      if (wasLiked) await unlikeWing(wing._id);
      else await likeWing(wing._id);
    } catch {
      setLiked(wasLiked);
      setWing(wing);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !wing) return;
    setSubmitting(true);
    try {
      const c = await createComment(wing._id, text);
      setComments([c, ...comments]);
      setWing({ ...wing, commentsCount: wing.commentsCount + 1 });
      setText('');
    } catch {}
    setSubmitting(false);
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="p-3 text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <article className="p-6 border-b border-gray-200">
          <div className="flex gap-3">
            <Link
              href={'/profile/' + wing.author._id}
              className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-semibold flex-shrink-0"
            >
              {(wing.author as any).avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={(wing.author as any).avatarUrl} alt={wing.author.username} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                wing.author.username?.[0]?.toUpperCase() || '?'
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <Link href={'/profile/' + wing.author._id} className="flex items-center gap-2 hover:underline">
                <span className="font-semibold text-gray-900">{wing.author.name || wing.author.username}</span>
                <span className="text-gray-500 text-sm">@{wing.author.username}</span>
              </Link>
              <h1 className="text-xl font-bold text-gray-900 mt-3">{wing.title}</h1>
              <p className="text-gray-800 mt-2 whitespace-pre-wrap break-words text-lg"><RichText text={wing.content} /></p>

              {wing.imageUrl && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getMediaUrl(wing.imageUrl)} alt={wing.title} className="w-full max-h-[600px] object-contain bg-black" />
                </div>
              )}

              {wing.videoUrl && (
                <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 bg-black">
                  <video src={getMediaUrl(wing.videoUrl)} controls className="w-full max-h-[600px]" preload="metadata" />
                </div>
              )}

              {wing.hashtags && wing.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {wing.hashtags.map((tag) => (
                    <Link key={tag} href={'/hashtag/' + tag} className="text-blue-500 text-sm hover:underline">#{tag}</Link>
                  ))}
                </div>
              )}
              <p className="text-gray-500 text-sm mt-4">{timeAgo(wing.createdAt)}</p>

              <div className="flex items-center gap-6 mt-4 text-gray-500 text-sm border-t border-gray-100 pt-4">
                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {wing.commentsCount}</span>
                <span className="flex items-center gap-1"><Repeat2 className="w-4 h-4" /> {wing.repostsCount}</span>
                <button
                  onClick={handleLike}
                  className={liked ? 'flex items-center gap-1 text-red-500 transition' : 'flex items-center gap-1 hover:text-red-500 transition'}
                >
                  <Heart className={liked ? 'w-4 h-4 fill-current' : 'w-4 h-4'} /> {wing.likesCount}
                </button>
                <span className="flex items-center gap-1"><Bookmark className="w-4 h-4" /></span>
                <span className="flex items-center gap-1 ml-auto"><Eye className="w-4 h-4" /> {wing.views}</span>
              </div>
            </div>
          </div>
        </article>

        <form onSubmit={handleComment} className="p-4 border-b border-gray-200">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full resize-none outline-none text-gray-800 placeholder-gray-400"
                rows={2}
                maxLength={800}
              />
              <div className="flex justify-end mt-1">
                <button
                  type="submit"
                  disabled={submitting || !text.trim()}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-6 rounded-full transition disabled:opacity-50 text-sm"
                >
                  {submitting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          </div>
        </form>

        <div>
          {comments.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No comments yet. Be the first!</div>
          ) : (
            comments.map((c) => (
              <div key={c._id} className="flex gap-3 p-4 border-b border-gray-100">
                <Link
                  href={'/profile/' + c.author._id}
                  className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0"
                >
                  {c.author.username?.[0]?.toUpperCase() || '?'}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-900">{c.author.name || c.author.username}</span>
                    <span className="text-gray-500">@{c.author.username}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-gray-800 mt-1 whitespace-pre-wrap break-words"><RichText text={c.text} /></p>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}