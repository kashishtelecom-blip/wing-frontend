'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Send, MessageCircle, Loader2, Image as ImageIcon, X as XIcon,
  Copy, Trash2, Reply as ReplyIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { getMediaUrl } from '@/lib/media';
import {
  Conversation, ChatMessage,
  getConversations, startConversation,
  getMessages, sendMessage, markConversationRead,
  uploadChatMedia, deleteMessage,
} from '@/lib/chat';

function ChatPageInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get('user');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [pendingMedia, setPendingMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    previewUrl: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    messageId: string;
    x: number;
    y: number;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const activeConvIdRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const convs = await getConversations();
        if (cancelled) return;
        setConversations(convs);

        if (targetUserId) {
          const existing = convs.find((c) => c.other?._id === targetUserId);
          if (existing) {
            setActiveConv(existing);
          } else {
            const conv = await startConversation(targetUserId);
            if (!cancelled && conv && conv.other) {
              setActiveConv(conv);
              setConversations((prev) => {
                const has = prev.some((c) => c._id === conv._id);
                return has ? prev : [conv, ...prev];
              });
            }
          }
        } else if (convs.length > 0) {
          setActiveConv(convs[0]);
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, targetUserId]);

  const loadMessages = useCallback(async (silent = false) => {
    const convId = activeConvIdRef.current;
    if (!convId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const msgs = await getMessages(convId);
      if (activeConvIdRef.current !== convId) return;
      setMessages(msgs);
      await markConversationRead(convId);
      setConversations((prev) =>
        prev.map((c) => (c._id === convId ? { ...c, unreadCount: 0 } : c)),
      );
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!activeConv) {
      activeConvIdRef.current = null;
      setMessages([]);
      return;
    }
    activeConvIdRef.current = activeConv._id;
    setMessages([]);
    loadMessages(false);

    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(true), 5000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [activeConv, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  // Close context menu on any click elsewhere
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [contextMenu]);

  const handleAttach = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConv) return;
    if (!/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|m4v)$/i.test(file.name)) {
      setError('Only images or videos allowed');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File too large (max 50MB)');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const previewUrl = URL.createObjectURL(file);
      const res = await uploadChatMedia(activeConv._id, file);
      setPendingMedia({ url: res.url, type: res.type, previewUrl });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearPendingMedia = () => {
    if (pendingMedia) URL.revokeObjectURL(pendingMedia.previewUrl);
    setPendingMedia(null);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !pendingMedia) || !activeConv || sending) return;
    const sendText = text.trim();
    const media = pendingMedia;
    const reply = replyingTo;
    setText('');
    setPendingMedia(null);
    setReplyingTo(null);
    setSending(true);
    setError('');

    const optimistic: ChatMessage = {
      _id: 'temp-' + Date.now(),
      conversation: activeConv._id,
      sender: { _id: user!.userId, username: user!.username },
      text: sendText,
      mediaUrl: media?.url || null,
      mediaType: media?.type || null,
      replyTo: reply
        ? {
            _id: reply._id,
            text: reply.text,
            mediaUrl: reply.mediaUrl || null,
            mediaType: reply.mediaType || null,
            sender: {
              _id: reply.sender._id,
              username: reply.sender.username,
              name: reply.sender.name,
            },
          }
        : null,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const real = await sendMessage(
        activeConv._id,
        sendText,
        media?.url,
        media?.type,
        reply?._id,
      );
      setMessages((prev) => prev.map((m) => (m._id === optimistic._id ? real : m)));
      if (media) URL.revokeObjectURL(media.previewUrl);
      const convs = await getConversations();
      setConversations(convs);
    } catch (err: any) {
      console.error('Send failed', err);
      setError(err.response?.data?.message || 'Failed to send');
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setText(sendText);
      if (reply) setReplyingTo(reply);
    } finally {
      setSending(false);
    }
  };

  const openContextMenu = (e: React.MouseEvent, msg: ChatMessage) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      messageId: msg._id,
      x: Math.min(e.clientX, window.innerWidth - 180),
      y: Math.min(e.clientY, window.innerHeight - 200),
    });
  };

  const handleDeleteMessage = async (msg: ChatMessage) => {
    if (!activeConv) return;
    if (!confirm('Delete this message?')) return;
    setContextMenu(null);
    const previous = messages;
    setMessages((prev) =>
      prev.map((m) =>
        m._id === msg._id ? { ...m, text: '', mediaUrl: null, mediaType: null, deletedAt: new Date().toISOString() } : m,
      ),
    );
    try {
      await deleteMessage(activeConv._id, msg._id);
    } catch (err: any) {
      setMessages(previous);
      setError(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleCopy = async (msg: ChatMessage) => {
    setContextMenu(null);
    if (!msg.text) return;
    try {
      await navigator.clipboard.writeText(msg.text);
    } catch {
      // ignore
    }
  };

  const handleReply = (msg: ChatMessage) => {
    setContextMenu(null);
    setReplyingTo(msg);
  };

  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }

  const sidebarClass =
    'w-full md:w-80 border-r border-gray-200 dark:border-gray-800 flex flex-col ' +
    (activeConv ? 'hidden md:flex' : 'flex');

  const convItemClass = (isActive: boolean) =>
    'w-full flex items-start gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left border-b border-gray-100 dark:border-gray-800 ' +
    (isActive ? 'bg-blue-50 dark:bg-blue-950/40' : '');

  const menuMsg = contextMenu
    ? messages.find((m) => m._id === contextMenu.messageId)
    : null;
  const isMyMenuMsg = menuMsg?.sender._id === user.userId;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-4xl mx-auto flex w-full" style={{ height: 'calc(100vh - 60px)' }}>
        <div className={sidebarClass}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                No conversations yet.
                <br />
                Open a profile and click Message to start one.
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => setActiveConv(conv)}
                  className={convItemClass(activeConv?._id === conv._id)}
                >
                  <Avatar user={conv.other} size="md" linkTo={false} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {conv.other.name || conv.other.username}
                      </span>
                      {conv.other.isVerified && <VerifiedBadge size="sm" />}
                    </div>
                    {conv.lastMessage ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {conv.lastMessage.mediaUrl && !conv.lastMessage.text
                          ? '📷 Photo'
                          : conv.lastMessage.text}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-0.5">
                        No messages yet
                      </p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {activeConv ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <button
                onClick={() => setActiveConv(null)}
                className="md:hidden p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="w-4 h-4 dark:text-white" />
              </button>
              <Link
                href={'/profile/' + activeConv.other._id}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar user={activeConv.other} size="md" linkTo={false} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">
                      {activeConv.other.name || activeConv.other.username}
                    </span>
                    {activeConv.other.isVerified && <VerifiedBadge size="sm" />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{activeConv.other.username}
                  </p>
                </div>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                  Say hi to {activeConv.other.name || activeConv.other.username}!
                </div>
              ) : (
                messages.map((msg) => {
                  const senderId = msg.sender?._id || '';
                  const isMe = senderId === user.userId;
                  const isOptimistic = msg._id.startsWith('temp-');
                  const isDeleted = !!msg.deletedAt;
                  return (
                    <div
                      key={msg._id}
                      className={isMe ? 'flex justify-end' : 'flex justify-start'}
                    >
                      <div
                        onContextMenu={(e) => !isOptimistic && openContextMenu(e, msg)}
                        className={
                          'max-w-[75%] rounded-2xl overflow-hidden cursor-pointer select-none ' +
                          (isMe
                            ? 'bg-blue-500 text-white rounded-br-sm ' +
                              (isOptimistic ? 'opacity-70' : '')
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm')
                        }
                      >
                        {msg.replyTo && (
                          <div
                            className={
                              'px-3 py-1.5 text-xs border-l-2 mb-1 ' +
                              (isMe
                                ? 'border-blue-200 bg-blue-600/30'
                                : 'border-blue-400 bg-gray-100 dark:bg-gray-700')
                            }
                          >
                            <p className="font-semibold opacity-90">
                              {msg.replyTo.sender?.name || msg.replyTo.sender?.username || 'Unknown'}
                            </p>
                            <p className="truncate opacity-80">
                              {msg.replyTo.deletedAt
                                ? 'Deleted message'
                                : msg.replyTo.mediaUrl && !msg.replyTo.text
                                ? '📷 Photo'
                                : msg.replyTo.text}
                            </p>
                          </div>
                        )}
                        {isDeleted ? (
                          <p className="text-sm italic opacity-60 px-4 py-2">
                            This message was deleted
                          </p>
                        ) : (
                          <>
                            {msg.mediaUrl && (
                              <div className="max-w-xs">
                                {msg.mediaType === 'video' ? (
                                  <video
                                    src={getMediaUrl(msg.mediaUrl)}
                                    controls
                                    className="w-full max-h-80 object-cover bg-black"
                                    preload="metadata"
                                  />
                                ) : (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={getMediaUrl(msg.mediaUrl)}
                                    alt="attachment"
                                    width={320}
                                    height={240}
                                    className="w-full max-h-80 object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                )}
                              </div>
                            )}
                            {msg.text && (
                              <p className="text-sm whitespace-pre-wrap break-words px-4 py-2">
                                {msg.text}
                              </p>
                            )}
                          </>
                        )}
                        <p
                          className={
                            'text-[10px] pb-2 px-4 ' +
                            (isMe ? 'text-blue-100' : 'text-gray-400')
                          }
                        >
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div className="px-4 py-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-800">
              {replyingTo && (
                <div className="p-3 pb-0 flex items-start gap-3">
                  <div className="flex-1 min-w-0 border-l-2 border-blue-500 pl-3">
                    <p className="text-xs font-semibold text-blue-500">
                      Replying to {replyingTo.sender.name || replyingTo.sender.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {replyingTo.mediaUrl && !replyingTo.text
                        ? '📷 Photo'
                        : replyingTo.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <XIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              )}

              {pendingMedia && (
                <div className="p-3 pb-0 flex items-start gap-3">
                  <div className="relative">
                    {pendingMedia.type === 'video' ? (
                      <video
                        src={pendingMedia.previewUrl}
                        className="w-24 h-24 object-cover rounded-lg bg-black"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pendingMedia.previewUrl}
                        alt="preview"
                        width={96}
                        height={96}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={clearPendingMedia}
                      className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white rounded-full p-0.5"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ready to send
                  </p>
                </div>
              )}

              <form onSubmit={handleSend} className="p-4 flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  id="chat-file-input"
                  name="file"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleAttach}
                  disabled={uploading || sending || !activeConv}
                  className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50 transition"
                  title="Attach image or video"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </button>
                <input
                  id="chat-message-input"
                  name="message"
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Start a new message"
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={(!text.trim() && !pendingMedia) || sending || uploading}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-full transition disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Select a conversation
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                or open a profile and click Message
              </p>
            </div>
          </div>
        )}
      </main>

      {contextMenu && menuMsg && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleReply(menuMsg)}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
          >
            <ReplyIcon className="w-4 h-4" />
            Reply
          </button>
          {menuMsg.text && (
            <button
              onClick={() => handleCopy(menuMsg)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
          )}
          {isMyMenuMsg && (
            <button
              onClick={() => handleDeleteMessage(menuMsg)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm text-red-600 dark:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}