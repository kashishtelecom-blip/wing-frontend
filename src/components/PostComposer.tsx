'use client';

import { useState, useRef } from 'react';
import { Image as ImageIcon, Video, X, Smile, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createWing, uploadMedia } from '@/lib/wings';
import { useAuth } from '@/lib/auth-context';
import { EmojiPicker } from './EmojiPicker';

interface Props {
  onPosted: () => void;
}

const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;

export function PostComposer({ onPosted }: Props) {
  const t = useTranslations('composer');
  const { user } = useAuth();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  if (!user) return null;

  const handleFile = (file: File, type: 'image' | 'video') => {
    const maxSize = type === 'video' ? VIDEO_MAX : IMAGE_MAX;
    if (file.size > maxSize) {
      setError(type === 'video' ? 'Video must be under 50MB' : 'Image must be under 5MB');
      return;
    }
    setError('');
    setMediaFile(file);
    setMediaType(type);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaType(null);
    setPreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((c) => c + emoji);
      return;
    }
    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const next = content.slice(0, start) + emoji + content.slice(end);
    setContent(next.slice(0, 800));
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      setUploadProgress(scheduledAt ? 'Scheduling...' : 'Posting...');
      const wing = await createWing({
        title: title || content.slice(0, 60),
        content,
        isPublished: !scheduledAt,
        isAnonymous,
        scheduledAt: scheduledAt || undefined,
        commentsEnabled,
      } as any);

      if (mediaFile && wing._id) {
        setUploadProgress(mediaType === 'video' ? 'Uploading video...' : 'Uploading image...');
        await uploadMedia(wing._id, mediaFile);
      }

      setTitle('');
      setContent('');
      setIsAnonymous(false);
      setScheduledAt('');
      setShowSchedule(false);
      setCommentsEnabled(true);
      clearMedia();
      setUploadProgress('');
      onPosted();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post');
      setUploadProgress('');
    } finally {
      setLoading(false);
    }
  };

  const toolbarBtnClass =
    'p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-500 transition disabled:opacity-40';

  return (
    <form onSubmit={handleSubmit} className="border-b border-gray-200 dark:border-gray-800 p-4">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
          {user.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            placeholder={t('titlePlaceholder')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-lg font-semibold placeholder-gray-400 dark:placeholder-gray-500 dark:text-white bg-transparent outline-none mb-1"
            maxLength={100}
          />
          <textarea
            ref={textareaRef}
            placeholder={t('bodyPlaceholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full resize-none outline-none text-gray-800 dark:text-gray-100 dark:placeholder-gray-500 bg-transparent placeholder-gray-400"
            rows={3}
            maxLength={800}
          />

          {preview && mediaType === 'image' && (
            <div className="relative mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full max-h-96 object-cover" />
              <button
                type="button"
                onClick={clearMedia}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {preview && mediaType === 'video' && (
            <div className="relative mt-3 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
              <video src={preview} controls className="w-full max-h-96" />
              <button
                type="button"
                onClick={clearMedia}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {showSchedule && (
            <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Schedule for
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Your wing will be posted automatically at this time.
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          {uploadProgress && <p className="text-blue-500 text-sm mt-2">{uploadProgress}</p>}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-3 gap-2">
            <div className="flex items-center gap-0.5 relative flex-wrap order-2 sm:order-1">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f, 'image');
                }}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f, 'video');
                }}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={!!mediaFile}
                className={toolbarBtnClass}
                title="Add image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={!!mediaFile}
                className={toolbarBtnClass}
                title="Add video"
              >
                <Video className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className={toolbarBtnClass}
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              {showEmoji && (
                <EmojiPicker
                  onPick={(emoji) => insertEmoji(emoji)}
                  onClose={() => setShowEmoji(false)}
                />
              )}

              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={
                  'flex items-center gap-1 px-3 py-1.5 rounded-full transition text-xs font-semibold ml-1 ' +
                  (isAnonymous
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')
                }
                title="Post anonymously"
              >
                🎭 {isAnonymous ? 'Anon' : t('public')}
              </button>

              <button
                type="button"
                onClick={() => setCommentsEnabled(!commentsEnabled)}
                className={
                  'flex items-center gap-1 px-3 py-1.5 rounded-full transition text-xs font-semibold ' +
                  (commentsEnabled
                    ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300')
                }
                title={commentsEnabled ? 'Comments on' : 'Comments off'}
              >
                💬 {commentsEnabled ? 'On' : 'Off'}
              </button>

              <button
                type="button"
                onClick={() => setShowSchedule(!showSchedule)}
                className={
                  'flex items-center gap-1 px-3 py-1.5 rounded-full transition text-xs font-semibold ' +
                  (scheduledAt
                    ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')
                }
                title="Schedule post"
              >
                <Clock className="w-3 h-3" />
              </button>

              <span className={content.length > 750 ? 'text-red-500 text-xs ml-2' : 'text-gray-400 dark:text-gray-500 text-xs ml-2'}>
                {content.length}/800
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1.5 px-6 rounded-full transition disabled:opacity-50 flex-shrink-0 self-end sm:self-auto order-1 sm:order-2"
            >
              {loading ? 'Posting...' : scheduledAt ? 'Schedule' : t('postButton')}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}