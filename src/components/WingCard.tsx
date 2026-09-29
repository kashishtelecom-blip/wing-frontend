'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart, MessageCircle, Repeat2, Bookmark, Eye, MoreHorizontal, Trash2, Pin, AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';
import { Wing } from '@/lib/wings';
import { timeAgo } from '@/lib/time';
import { useAuth } from '@/lib/auth-context';
import { useInteractions } from '@/lib/user-interactions';
import { Avatar } from './Avatar';
import { VerifiedBadge } from './VerifiedBadge';
import { RichText } from './RichText';
import { getMediaUrl } from '@/lib/media';
import { CopyrightReportDialog } from './CopyrightReportDialog';

interface Props {
  wing: Wing;
  onDeleted?: (id: string) => void;
}

export function WingCard({ wing, onDeleted }: Props) {
  const { user } = useAuth();
  const { likedIds, repostedIds, bookmarkedIds, toggleLike, toggleRepost, toggleBookmark } = useInteractions();
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(wing.likesCount);
  const [repostsCount, setRepostsCount] = useState(wing.repostsCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const isAnonymous = (wing as any).isAnonymous;
  const hasAuthor = !!wing.author?._id;

  const liked = likedIds.has(wing._id);
  const reposted = repostedIds.has(wing._id);
  const bookmarked = bookmarkedIds.has(wing._id);
  const isOwner = !isAnonymous && user?.userId === wing.author?._id;
  const authorVerified = (wing.author as any)?.isVerified;
  const authorAvatar = (wing.author as any)?.avatarUrl;

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('video')) return;
    router.push('/wing/' + wing._id);
  };

  const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    const nowLiked = await toggleLike(wing._id);
    setLikesCount((c) => (nowLiked ? c + 1 : c - 1));
  };

  const handleRepost = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    const nowReposted = await toggleRepost(wing._id);
    setRepostsCount((c) => (nowReposted ? c + 1 : c - 1));
  };

  const handleBookmark = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    await toggleBookmark(wing._id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setMenuOpen(false);
    if (!confirm('Delete this wing?')) return;
    try {
      await api.delete('/wings/' + wing._id);
      if (onDeleted) onDeleted(wing._id); else router.refresh();
    } catch (err) { console.error(err); }
  };

  const handlePin = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setMenuOpen(false);
    try {
      await api.post('/users/me/pin/' + wing._id);
      alert('Wing pinned to your profile!');
      router.refresh();
    } catch (err) { console.error(err); }
  };

  return (
    <>
      <article onClick={handleCardClick} className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition cursor-pointer relative">
        <div className="p-4">
          <div className="flex gap-3">
            {isAnonymous || !hasAuthor ? (
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold flex-shrink-0">
                🎭
              </div>
            ) : (
              <Avatar
                user={{ _id: wing.author._id, username: wing.author.username, name: wing.author.name, avatarUrl: authorAvatar }}
                size="md"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5 text-sm flex-wrap min-w-0">
                  {isAnonymous || !hasAuthor ? (
                    <span className="font-semibold text-gray-700 dark:text-gray-300 italic">Anonymous</span>
                  ) : (
                    <>
                      <Link href={'/profile/' + (wing.author?._id || '')} className="font-semibold text-gray-900 dark:text-white hover:underline">
                        {wing.author.name || wing.author.username}
                      </Link>
                      {authorVerified && <VerifiedBadge />}
                      <span className="text-gray-500 dark:text-gray-400">@{wing.author.username}</span>
                    </>
                  )}
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500 dark:text-gray-400">{timeAgo(wing.createdAt)}</span>
                  {(wing as any).scheduledAt && !wing.isPublished && (
                    <>
                      <span className="text-gray-400">·</span>
                      <span className="text-green-600 dark:text-green-400 text-xs font-semibold">🕐 Scheduled</span>
                    </>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
                      {isOwner && (
                        <>
                          <button onClick={handlePin} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-800 dark:text-gray-200">
                            <Pin className="w-4 h-4" /> Pin to profile
                          </button>
                          <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm text-red-500">
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </>
                      )}
                      {!isOwner && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMenuOpen(false);
                            setShowReportDialog(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm text-red-500"
                        >
                          <AlertTriangle className="w-4 h-4" /> Report copyright
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {wing.title && <h3 className="font-semibold text-gray-900 dark:text-white mt-1">{wing.title}</h3>}
              <p className="text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap break-words">
                <RichText text={wing.content} />
              </p>

              {wing.imageUrl && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
              <img
             src={getMediaUrl(wing.imageUrl)}
              alt={wing.title || 'Wing image'}
               className="w-full max-h-[500px] object-cover"
               onError={(e) => {
              const target = e.target as HTMLImageElement;
            const parent = target.parentElement;
        if (parent) parent.style.display = 'none';
      }}
    />
  </div>
)}

              {wing.videoUrl && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black" onClick={(e) => e.stopPropagation()}>
                  <video src={getMediaUrl(wing.videoUrl)} controls className="w-full max-h-96" preload="metadata" />
                </div>
              )}

              <div className="flex items-center justify-between mt-3 text-gray-500 dark:text-gray-400 text-sm">
                <button type="button" onClick={(e) => { e.stopPropagation(); router.push('/wing/' + wing._id); }} className="flex items-center gap-1 hover:text-blue-500 transition">
                  <MessageCircle className="w-4 h-4" /><span>{wing.commentsCount}</span>
                </button>
                <button type="button" onClick={handleRepost} className={reposted ? 'flex items-center gap-1 text-green-500 transition' : 'flex items-center gap-1 hover:text-green-500 transition'}>
                  <Repeat2 className="w-4 h-4" /><span>{repostsCount}</span>
                </button>
                <button type="button" onClick={handleLike} className={liked ? 'flex items-center gap-1 text-red-500 transition' : 'flex items-center gap-1 hover:text-red-500 transition'}>
                  <Heart className={liked ? 'w-4 h-4 fill-current' : 'w-4 h-4'} /><span>{likesCount}</span>
                </button>
                <button type="button" onClick={handleBookmark} className={bookmarked ? 'flex items-center gap-1 text-blue-500 transition' : 'flex items-center gap-1 hover:text-blue-500 transition'}>
                  <Bookmark className={bookmarked ? 'w-4 h-4 fill-current' : 'w-4 h-4'} />
                </button>
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" /><span>{wing.views}</span></span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {showReportDialog && (
        <CopyrightReportDialog wingId={wing._id} onClose={() => setShowReportDialog(false)} />
      )}
    </>
  );
}