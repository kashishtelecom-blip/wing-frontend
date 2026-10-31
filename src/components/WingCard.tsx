'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart, MessageCircle, Repeat2, Bookmark, Eye, MoreHorizontal, Trash2, Pin, AlertTriangle, Pencil,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
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
import { CommentsSection } from './CommentsSection';

interface Props {
  wing: Wing;
  onDeleted?: (id: string) => void;
}

export function WingCard({ wing, onDeleted }: Props) {
  const t = useTranslations('actions');
  const { user } = useAuth();
  const { likedIds, repostedIds, bookmarkedIds, toggleLike, toggleRepost, toggleBookmark } = useInteractions();
  const router = useRouter();
  const [likesCount, setLikesCount] = useState(wing.likesCount);
  const [repostsCount, setRepostsCount] = useState(wing.repostsCount);
  const [commentsCount, setCommentsCount] = useState(wing.commentsCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(wing.title || '');
  const [editContent, setEditContent] = useState(wing.content || '');
  const [editSaving, setEditSaving] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(wing.title);
  const [displayContent, setDisplayContent] = useState(wing.content);
  const [editCount, setEditCount] = useState<number>((wing as any).editCount || 0);

  // ─── STATE AND DERIVED VALUES ───
  const isAnonymous = (wing as any).isAnonymous;
  const hasAuthor = !!wing.author?._id;

  const liked = likedIds.has(wing._id);
  const reposted = repostedIds.has(wing._id);
  const bookmarked = bookmarkedIds.has(wing._id);
  const isOwner = !isAnonymous && user?.userId === wing.author?._id;
  const authorVerified = (wing.author as any)?.isVerified;
  const authorAvatar = (wing.author as any)?.avatarUrl;

  const isBusinessPage = !!wing.page;
  const displayName = isBusinessPage ? wing.page!.name : (wing.author?.name || wing.author?.username || 'Unknown');
  const displayUsername = isBusinessPage ? wing.page!.slug : wing.author?.username || '';
  const profileLink = isBusinessPage ? `/business/${wing.page!.slug}` : `/profile/${wing.author?._id || ''}`;

  // ─── HANDLERS ───
  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('video') || target.closest('form') || target.closest('input') || target.closest('textarea')) return;
    router.push('/wing/' + wing._id);
  };

  const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    const wasLiked = liked;
    const nowLiked = await toggleLike(wing._id);
    if (nowLiked !== wasLiked) {
      setLikesCount((c) => (nowLiked ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const handleRepost = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    const wasReposted = reposted;
    const nowReposted = await toggleRepost(wing._id);
    if (nowReposted !== wasReposted) {
      setRepostsCount((c) => (nowReposted ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const handleBookmark = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) return;
    await toggleBookmark(wing._id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setMenuOpen(false);
    if (!confirm(t('deleteConfirm'))) return;
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
      router.refresh();
    } catch (err) { console.error(err); }
  };

  const openEditDialog = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setMenuOpen(false);
    setEditTitle(displayTitle || '');
    setEditContent(displayContent || '');
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    setEditSaving(true);
    try {
      await api.patch('/wings/' + wing._id, {
        title: editTitle,
        content: editContent,
      });
      setDisplayTitle(editTitle);
      setDisplayContent(editContent);
      setEditCount((c) => c + 1);
      setShowEditDialog(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to save changes.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <>
      <article
        onClick={handleCardClick}
        className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition cursor-pointer relative"
      >
        <div className="p-4">
          <div className="flex gap-3">
            {/* AVATAR */}
            {isAnonymous || !hasAuthor ? (
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold flex-shrink-0">
                🎭
              </div>
            ) : isBusinessPage ? (
              <Link href={profileLink} className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-lg overflow-hidden">
                  {wing.page!.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={wing.page!.avatarUrl} alt={wing.page!.name} className="w-full h-full object-cover" />
                  ) : (
                    wing.page!.name.charAt(0).toUpperCase()
                  )}
                </div>
              </Link>
            ) : (
              <Avatar
                user={{
                  _id: wing.author._id,
                  username: wing.author.username,
                  name: wing.author.name,
                  avatarUrl: authorAvatar,
                }}
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
                      <Link href={profileLink} className="font-semibold text-gray-900 dark:text-white hover:underline">
                        {displayName}
                      </Link>
                      {isBusinessPage && (
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-bold">
                          PAGE
                        </span>
                      )}
                      {!isBusinessPage && authorVerified && <VerifiedBadge />}
                      <span className="text-gray-500 dark:text-gray-400">
                        @{displayUsername}
                      </span>
                    </>
                  )}
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500 dark:text-gray-400">{timeAgo(wing.createdAt)}</span>
                  {editCount > 0 && (
                    <>
                      <span className="text-gray-400">·</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs italic">{t('edited')}</span>
                    </>
                  )}
                  {(wing as any).scheduledAt && !wing.isPublished && (
                    <>
                      <span className="text-gray-400">·</span>
                      <span className="text-green-600 dark:text-green-400 text-xs font-semibold">🕐 Scheduled</span>
                    </>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(!menuOpen);
                    }}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
                      {isOwner && (
                        <>
                          <button onClick={openEditDialog} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-800 dark:text-gray-200">
                            <Pencil className="w-4 h-4" /> {t('edit')}
                          </button>
                          <button onClick={handlePin} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-800 dark:text-gray-200">
                            <Pin className="w-4 h-4" /> {t('pin')}
                          </button>
                          <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm text-red-500">
                            <Trash2 className="w-4 h-4" /> {t('delete')}
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
                          <AlertTriangle className="w-4 h-4" /> {t('report')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {displayTitle && (
                <h3 className="font-semibold text-gray-900 dark:text-white mt-1">{displayTitle}</h3>
              )}
              <p className="text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap break-words">
                <RichText text={displayContent || ''} />
              </p>

              {wing.imageUrl && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getMediaUrl(wing.imageUrl)}
                    alt={displayTitle || 'Wing image'}
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
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowComments(!showComments);
                  }}
                  className={'flex items-center gap-1 transition ' + (showComments ? 'text-blue-500' : 'hover:text-blue-500')}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{commentsCount}</span>
                </button>

                <button
                  type="button"
                  onClick={handleRepost}
                  className={reposted ? 'flex items-center gap-1 text-green-500 transition' : 'flex items-center gap-1 hover:text-green-500 transition'}
                >
                  <Repeat2 className="w-4 h-4" />
                  <span>{repostsCount}</span>
                </button>

                <button
                  type="button"
                  onClick={handleLike}
                  className={liked ? 'flex items-center gap-1 text-red-500 transition' : 'flex items-center gap-1 hover:text-red-500 transition'}
                >
                  <Heart className={liked ? 'w-4 h-4 fill-current' : 'w-4 h-4'} />
                  <span>{likesCount}</span>
                </button>

                <button
                  type="button"
                  onClick={handleBookmark}
                  className={bookmarked ? 'flex items-center gap-1 text-blue-500 transition' : 'flex items-center gap-1 hover:text-blue-500 transition'}
                >
                  <Bookmark className={bookmarked ? 'w-4 h-4 fill-current' : 'w-4 h-4'} />
                </button>

                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  <span>{wing.views}</span>
                </span>
              </div>

              {showComments && (
                <CommentsSection
                  wingId={wing._id}
                  commentsCount={commentsCount}
                  onCountChange={(delta) => setCommentsCount((c) => Math.max(0, c + delta))}
                />
              )}
            </div>
          </div>
        </div>
      </article>

      {showReportDialog && (
        <CopyrightReportDialog wingId={wing._id} onClose={() => setShowReportDialog(false)} />
      )}

      {showEditDialog && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => !editSaving && setShowEditDialog(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit Wing</h2>
            <input
              type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title (optional)" maxLength={120}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={editContent} onChange={(e) => setEditContent(e.target.value)}
              placeholder="What's on your mind?" maxLength={800}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-2 mb-2 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="text-right text-xs text-gray-500 dark:text-gray-400 mb-3">{editContent.length} / 800</div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEditDialog(false)} disabled={editSaving} className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50">
                {t('cancel')}
              </button>
              <button onClick={handleSaveEdit} disabled={editSaving || !editContent.trim()} className="px-5 py-2 rounded-full text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                {editSaving ? '...' : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}