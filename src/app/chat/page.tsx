'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, MessageCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { NavBar } from '@/components/NavBar';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import {
  Conversation, ChatMessage,
  getConversations, startConversation,
  getMessages, sendMessage, markConversationRead,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const activeConvIdRef = useRef<string | null>(null);

  // Redirect to login if not authed
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Initial load: fetch conversations + handle ?user= param
  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const convs = await getConversations();
        if (cancelled) return;
        setConversations(convs);

        // If ?user=X was provided, open/create that conversation
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

  // Load messages for active conversation
  const loadMessages = useCallback(async (silent = false) => {
    const convId = activeConvIdRef.current;
    if (!convId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const msgs = await getMessages(convId);
      if (activeConvIdRef.current !== convId) return; // user switched conversations
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

  // When active conversation changes, load messages + start polling
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeConv || sending) return;
    const sendText = text.trim();
    setText('');
    setSending(true);
    setError('');

    // Optimistic message
    const optimistic: ChatMessage = {
      _id: 'temp-' + Date.now(),
      conversation: activeConv._id,
      sender: { _id: user!.userId, username: user!.username },
      text: sendText,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const real = await sendMessage(activeConv._id, sendText);
      setMessages((prev) => prev.map((m) => (m._id === optimistic._id ? real : m)));
      // Refresh conversation list so last message updates
      const convs = await getConversations();
      setConversations(convs);
    } catch (err: any) {
      console.error('Send failed', err);
      setError(err.response?.data?.message || 'Failed to send');
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setText(sendText); // restore text so user can retry
    } finally {
      setSending(false);
    }
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
           <main className="max-w-4xl mx-auto flex w-full" style={{ height: 'calc(100vh - 60px)' }}>
        {/* Sidebar: conversation list */}
        <div className={sidebarClass}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                No conversations yet.<br />Open a profile and click Message to start one.
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
                        {conv.lastMessage.text}
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

        {/* Main: thread view */}
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
                  return (
                    <div
                      key={msg._id}
                      className={isMe ? 'flex justify-end' : 'flex justify-start'}
                    >
                      <div
                        className={
                          'max-w-[75%] rounded-2xl px-4 py-2 ' +
                          (isMe
                            ? 'bg-blue-500 text-white rounded-br-sm ' + (isOptimistic ? 'opacity-70' : '')
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm')
                        }
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        <p className={'text-[10px] mt-1 ' + (isMe ? 'text-blue-100' : 'text-gray-400')}>
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

            <form
              onSubmit={handleSend}
              className="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Start a new message"
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!text.trim() || sending}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-full transition disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 hidden md:flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Select a conversation</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                or open a profile and click Message
              </p>
            </div>
          </div>
        )}
      </main>
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