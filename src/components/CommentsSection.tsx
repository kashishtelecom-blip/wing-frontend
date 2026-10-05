'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Avatar } from './Avatar';
import { VerifiedBadge } from './VerifiedBadge';
import { RichText } from './RichText';
import { timeAgo } from '@/lib/time';
import {
  Comment, getComments, createComment, deleteComment,
} from '@/lib/comments';

interface Props {
  wingId: string;
  commentsCount: number;
  onCountChange: (delta: number) => void;
}

export function CommentsSection({ wingId, commentsCount, onCountChange }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getComments(wingId, 1, 20)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wingId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text.trim() || !user || sending) return;
    const sendText = text.trim();
    setText('');
    setSending(true);
    setError('');

    // Optimistic
    const optimistic: Comment = {
      _id: 'temp-' + Date.now(),
      wing: wingId,
      author: {
        _id: user.userId,
        username: user.username,
      },
      text: sendText,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, optimistic]);
    onCountChange(1);

    try {
      const real = await createComment(wingId, sendText);
      setComments((prev) =>
        prev.map((c) => (c._id === optimistic._id ? real : c)),
      );
    } catch (err: any) {
      setComments((prev) => prev.filter((c) => c._id !== optimistic._id));
      onCountChange(-1);
      setError(err.response?.data?.message || 'Failed to post comment');
      setText(sendText);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (comment: Comment) => {
    if (!confirm('Delete this comment?')) return;
    const previous = comments;
    setComments((prev) => prev.filter((c) => c._id !== comment._id));
    onCountChange(-1);
    try {
      await deleteComment(wingId, comment._id);
    } catch (err) {
      setComments(previous);
      onCountChange(1);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-3">
          No comments yet. Be the first!
        </p>
      ) : (
        <div className="space-y-3 mb-3">
          {comments.map((c) => {
            const isMine = user?.userId === c.author?._id;
            const isTemp = c._id.startsWith('temp-');
            return (
              <div key={c._id} className={'flex gap-2 ' + (isTemp ? 'opacity-70' : '')}>
                <Link
                  href={'/profile/' + (c.author?._id || '')}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0"
                >
                  <Avatar
                    user={{
                      _id: c.author?._id,
                      username: c.author?.username || 'user',
                      name: c.author?.name,
                      avatarUrl: c.author?.avatarUrl,
                    }}
                    size="sm"
                    linkTo={false}
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-xs flex-wrap">
                    <Link
                      href={'/profile/' + (c.author?._id || '')}
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-gray-900 dark:text-white hover:underline"
                    >
                      {c.author?.name || c.author?.username || 'Unknown'}
                    </Link>
                    {c.author?.isVerified && <VerifiedBadge size="sm" />}
                    <span className="text-gray-500 dark:text-gray-400">
                      @{c.author?.username}
                    </span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 mt-0.5 whitespace-pre-wrap break-words">
                    <RichText text={c.text} />
                  </p>
                </div>
                {isMine && !isTemp && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(c);
                    }}
                    className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 flex-shrink-0"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mb-2">{error}</p>
      )}

      {user && (
        <form
          onSubmit={handleSend}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {user.username?.[0]?.toUpperCase() || '?'}
          </div>
          <input
            id={'comment-input-' + wingId}
            name="comment"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            maxLength={500}
            className="flex-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50 transition"
            title="Send comment"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      )}
    </div>
  );
}