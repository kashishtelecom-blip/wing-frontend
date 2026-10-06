'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Globe, Lock, Users, Loader2, Trash2, UserPlus, X, MessageCircle, Send,
  Image as ImageIcon, Copy, Reply as ReplyIcon, Clock, Check, CheckCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useSocket } from '@/lib/socket-context';
import { NavBar } from '@/components/NavBar';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { getMediaUrl } from '@/lib/media';
import api from '@/lib/api';
import {
  Community, CommunityMessage,
  getCommunity, joinCommunity, leaveCommunity, deleteCommunity,
  addMembers, removeMember,
  getCommunityMessages, sendCommunityMessage,
  uploadCommunityMedia, deleteCommunityMessage,
  joinCommunityRoom, leaveCommunityRoom,
} from '@/lib/communities';

function MessageTicks({
  isOptimistic, read, delivered, isMe,
}: { isOptimistic: boolean; read: boolean; delivered: boolean; isMe: boolean }) {
  if (!isMe) return null;
  if (isOptimistic) return <Clock className="w-3 h-3 opacity-60" />;
  if (read) return <CheckCheck className="w-3.5 h-3.5 text-green-300" />;
  if (delivered) return <CheckCheck className="w-3.5 h-3.5 opacity-60" />;
  return <Check className="w-3.5 h-3.5 opacity-60" />;
}

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  // Invite dialog
  const [showInvite, setShowInvite] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [inviting, setInviting] = useState(false);

  // Chat
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [pendingMedia, setPendingMedia] = useState<{
    url: string;
    type: 'image' | 'video';
    previewUrl: string;
  } | null>(null);
  const [uploadingChat, setUploadingChat] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    messageId: string;
    x: number;
    y: number;
  } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<NodeJS.Timeout | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const communityId = params.id as string;

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user || !communityId) return;
    setLoading(true);
    getCommunity(communityId)
      .then(setCommunity)
      .catch((err) => setError(err.response?.data?.message || 'Community not found'))
      .finally(() => setLoading(false));
  }, [authLoading, user, communityId]);

  const isMember =
    community?.members?.some((m: any) => {
      const mid = m?._id || m;
      return String(mid) === user?.userId;
    }) || false;

  const isCreator = community?.creator?._id === user?.userId;

  const handleJoin = async () => {
    if (!community || working) return;
    setWorking(true);
    try {
      const result = await joinCommunity(community._id);
      setCommunity({
        ...community,
        membersCount: result.membersCount ?? community.membersCount + 1,
        members: [...(community.members || []), { _id: user!.userId } as any],
      });
    } catch (err) {
      console.error(err);
    } finally {
      setWorking(false);
    }
  };

  const handleLeave = async () => {
    if (!community || working) return;
    if (!confirm('Leave this community?')) return;
    setWorking(true);
    try {
      const result = await leaveCommunity(community._id);
      setCommunity({
        ...community,
        membersCount: result.membersCount ?? Math.max(0, community.membersCount - 1),
        members: (community.members || []).filter((m: any) => {
          const mid = m?._id || m;
          return String(mid) !== user?.userId;
        }),
      });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to leave');
    } finally {
      setWorking(false);
    }
  };

  const handleDelete = async () => {
    if (!community || working) return;
    if (!confirm('Delete this community permanently? This cannot be undone.')) return;
    setWorking(true);
    try {
      await deleteCommunity(community._id);
      router.push('/communities');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete');
    } finally {
      setWorking(false);
    }
  };

  const openInvite = async () => {
    setShowInvite(true);
    setSelectedIds(new Set());
    try {
      const res = await api.get('/users?limit=50');
      const data = res.data;
      const list = Array.isArray(data) ? data : data.data || [];
      const memberIds = new Set(
        (community?.members || []).map((m: any) => String(m?._id || m)),
      );
      setCandidates(list.filter((u: any) => !memberIds.has(String(u._id))));
    } catch (err) {
      console.error(err);
    }
  };

  const handleInvite = async () => {
    if (!community || selectedIds.size === 0) return;
    setInviting(true);
    try {
      await addMembers(community._id, Array.from(selectedIds));
      const fresh = await getCommunity(community._id);
      setCommunity(fresh);
      setShowInvite(false);
      setSelectedIds(new Set());
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add members');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!community) return;
    if (!confirm('Remove this member from the community?')) return;
    try {
      await removeMember(community._id, userId);
      const fresh = await getCommunity(community._id);
      setCommunity(fresh);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ============ GROUP CHAT ============
  const loadMessages = useCallback(async () => {
    if (!communityId) return;
    const msgs = await getCommunityMessages(communityId);
    setMessages(msgs);
  }, [communityId]);

  const openChat = async () => {
    setShowChat(true);
    await loadMessages();
    // 🔌 Join the community room for real-time updates
    if (socket && communityId) joinCommunityRoom(socket, communityId);
    // Fallback polling every 20s (was 5s)
    if (chatPollRef.current) clearInterval(chatPollRef.current);
    chatPollRef.current = setInterval(loadMessages, 20000);
  };

 const closeChat = () => {
    setShowChat(false);
    // 🔌 Leave the community room
    if (socket && communityId) leaveCommunityRoom(socket, communityId);
    if (chatPollRef.current) {
      clearInterval(chatPollRef.current);
      chatPollRef.current = null;
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (chatPollRef.current) clearInterval(chatPollRef.current);
    };
  }, []);

  // 🔌 Listen for new community messages in real time
  useEffect(() => {
    if (!socket) return;

    const onNewMessage = (msg: CommunityMessage) => {
      console.log('💬 Real-time community message:', msg);
      // Only append if it's for the currently open community
      if (msg.community !== communityId) return;

      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        const filtered = prev.filter(
          (m) =>
            !(
              m._id.startsWith('temp-') &&
              m.sender._id === msg.sender._id &&
              m.text === msg.text
            ),
        );
        return [...filtered, msg];
      });
    };

    socket.on('new-community-message', onNewMessage);
    return () => {
      socket.off('new-community-message', onNewMessage);
    };
  }, [socket, communityId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showChat]);

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

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatText.trim() && !pendingMedia) || !community || sendingChat) return;
    const sendText = chatText.trim();
    const media = pendingMedia;
    const reply = replyingTo;
    setChatText('');
    setPendingMedia(null);
    setReplyingTo(null);
    setSendingChat(true);

    const optimistic: CommunityMessage = {
      _id: 'temp-' + Date.now(),
      community: community._id,
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
      const real = await sendCommunityMessage(
        community._id,
        sendText,
        media?.url,
        media?.type,
        reply?._id,
      );
      setMessages((prev) => prev.map((m) => (m._id === optimistic._id ? real : m)));
      if (media) URL.revokeObjectURL(media.previewUrl);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to send');
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setChatText(sendText);
      if (reply) setReplyingTo(reply);
    } finally {
      setSendingChat(false);
    }
  };

  const handleChatFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !community) return;
    if (!/\.(jpg|jpeg|png|gif|webp|mp4|webm|mov|m4v)$/i.test(file.name)) {
      alert('Only images or videos allowed');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      alert('File too large (max 50MB)');
      return;
    }
    setUploadingChat(true);
    try {
      const previewUrl = URL.createObjectURL(file);
      const res = await uploadCommunityMedia(community._id, file);
      setPendingMedia({ url: res.url, type: res.type, previewUrl });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingChat(false);
      if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    }
  };

  const clearPendingMedia = () => {
    if (pendingMedia) URL.revokeObjectURL(pendingMedia.previewUrl);
    setPendingMedia(null);
  };

  const handleChatDelete = async (msg: CommunityMessage) => {
    if (!community) return;
    if (!confirm('Delete this message?')) return;
    setContextMenu(null);
    const previous = messages;
    setMessages((prev) =>
      prev.map((m) =>
        m._id === msg._id
          ? { ...m, text: '', mediaUrl: null, mediaType: null, deletedAt: new Date().toISOString() }
          : m,
      ),
    );
    try {
      await deleteCommunityMessage(community._id, msg._id);
    } catch (err: any) {
      setMessages(previous);
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <NavBar />
        <div className="p-12 text-center">
          <p className="text-6xl mb-4">404</p>
          <p className="text-gray-900 dark:text-white font-medium mb-1">
            Community not found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Link
            href="/communities"
            className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-6 rounded-full text-sm"
          >
            Back to Communities
          </Link>
        </div>
      </div>
    );
  }

  const filteredCandidates = candidates.filter(
    (u) =>
      !searchQuery ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <NavBar />
      <main className="max-w-2xl mx-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {community.name}
          </h1>
        </div>

        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-2xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-4xl flex-shrink-0">
              {community.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {community.name}
                </h1>
                {community.isPublic ? (
                  <Globe className="w-4 h-4 text-gray-400" />
                ) : (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
                {community.description}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <strong className="text-gray-900 dark:text-white">
                    {community.membersCount}
                  </strong>{' '}
                  member{community.membersCount !== 1 ? 's' : ''}
                </span>
                <span>
                  <strong className="text-gray-900 dark:text-white">
                    {community.postsCount || 0}
                  </strong>{' '}
                  posts
                </span>
              </div>

              {community.tags && community.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {community.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 mt-5 flex-wrap">
            {isMember && (
              <button
                onClick={openChat}
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-5 rounded-full text-sm transition"
              >
                <MessageCircle className="w-4 h-4" />
                Group chat
              </button>
            )}
            {isCreator && (
              <button
                onClick={openInvite}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-5 rounded-full text-sm transition"
              >
                <UserPlus className="w-4 h-4" />
                Add members
              </button>
            )}
            {isCreator ? (
              <button
                onClick={handleDelete}
                disabled={working}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-5 rounded-full text-sm transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete community
              </button>
            ) : isMember ? (
              <button
                onClick={handleLeave}
                disabled={working}
                className="bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 border border-red-300 dark:border-red-800 font-semibold py-2 px-5 rounded-full text-sm transition disabled:opacity-50"
              >
                {working ? 'Leaving...' : 'Leave'}
              </button>
            ) : (
              <button
                onClick={handleJoin}
                disabled={working}
                className="bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-6 rounded-full text-sm transition disabled:opacity-50"
              >
                {working ? 'Joining...' : 'Join community'}
              </button>
            )}
          </div>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-medium mb-2">
            Created by
          </p>
          <Link
            href={'/profile/' + community.creator._id}
            className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-900 p-2 -m-2 rounded-lg transition"
          >
            <Avatar user={community.creator} size="md" linkTo={false} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-900 dark:text-white truncate">
                  {community.creator.name || community.creator.username}
                </span>
                {community.creator.isVerified && <VerifiedBadge size="sm" />}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                @{community.creator.username}
              </p>
            </div>
          </Link>
        </div>

        {community.members && community.members.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <p className="text-xs uppercase text-gray-500 dark:text-gray-400 font-medium mb-3">
              Members ({community.membersCount})
            </p>
            <div className="space-y-1">
              {community.members.slice(0, 50).map((m: any) => {
                const member = m._id ? m : { _id: m, username: 'user', name: '' };
                const isMemberCreator =
                  String(member._id) === String(community.creator._id);
                const isMe = String(member._id) === String(user?.userId);
                return (
                  <div
                    key={member._id}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                  >
                    <Link href={'/profile/' + member._id}>
                      <Avatar user={member} size="md" linkTo={false} />
                    </Link>
                    <Link
                      href={'/profile/' + member._id}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {member.name || member.username}
                        </span>
                        {member.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{member.username}
                      </p>
                    </Link>
                    {!isMe && (
                      <button
                        onClick={() => router.push('/chat?user=' + member._id)}
                        className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-500 transition"
                        title="Message this member"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    )}
                    {isCreator && !isMemberCreator && (
                      <button
                        onClick={() => handleRemoveMember(member._id)}
                        className="p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500 transition"
                        title="Remove from community"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm border-t border-gray-200 dark:border-gray-800">
          Community posts coming soon
        </div>
      </main>

      {showInvite && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowInvite(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Add members
              </h2>
              <button
                onClick={() => setShowInvite(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <input
                id="invite-search"
                name="search"
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredCandidates.map((u) => {
                const selected = selectedIds.has(u._id);
                return (
                  <button
                    key={u._id}
                    onClick={() => toggleSelection(u._id)}
                    className={
                      'w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left border-b border-gray-100 dark:border-gray-800 ' +
                      (selected ? 'bg-purple-50 dark:bg-purple-950/30' : '')
                    }
                  >
                    <Avatar user={u} size="md" linkTo={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {u.name || u.username}
                        </span>
                        {u.isVerified && <VerifiedBadge size="sm" />}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{u.username}
                      </p>
                    </div>
                    <div
                      className={
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ' +
                        (selected
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-300 dark:border-gray-600')
                      }
                    >
                      {selected && <span className="text-white text-xs">✓</span>}
                    </div>
                  </button>
                );
              })}
              {filteredCandidates.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No users available to add
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex gap-2">
              <button
                onClick={() => setShowInvite(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 rounded-full text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || selectedIds.size === 0}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 rounded-full text-sm transition disabled:opacity-50"
              >
                {inviting
                  ? 'Adding...'
                  : 'Add ' +
                    selectedIds.size +
                    ' member' +
                    (selectedIds.size !== 1 ? 's' : '')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showChat && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={closeChat}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl max-w-lg w-full h-[80vh] sm:h-[70vh] shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-xl flex-shrink-0">
                  {community.emoji}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-gray-900 dark:text-white truncate">
                    {community.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {community.membersCount} members
                  </p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const senderId = msg.sender?._id || '';
                  const isMe = senderId === user?.userId;
                  const isOptimistic = msg._id.startsWith('temp-');
                  const isDeleted = !!msg.deletedAt;
                  const senderName = isMe
                    ? 'You'
                    : msg.sender?.name || msg.sender?.username || 'Unknown';
                  return (
                    <div
                      key={msg._id}
                      className={
                        'group relative flex items-center gap-1 ' +
                        (isMe ? 'justify-end' : 'justify-start')
                      }
                    >
                      {!isOptimistic && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setContextMenu({
                              messageId: msg._id,
                              x: Math.min(rect.left, window.innerWidth - 180),
                              y: Math.min(rect.bottom + 4, window.innerHeight - 200),
                            });
                          }}
                          className={
                            'opacity-0 group-hover:opacity-100 transition-opacity ' +
                            'p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ' +
                            'text-gray-500 dark:text-gray-400 flex-shrink-0 ' +
                            (isMe ? 'order-first' : 'order-last')
                          }
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="5" cy="12" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="19" cy="12" r="2" />
                          </svg>
                        </button>
                      )}
                      <div className="flex items-end gap-2 max-w-[80%]">
                        {!isMe && (
                          <Link href={'/profile/' + senderId} className="flex-shrink-0">
                            <Avatar user={msg.sender} size="sm" linkTo={false} />
                          </Link>
                        )}
                        <div className="min-w-0">
                          <p
                            className={
                              'text-xs font-semibold mb-0.5 px-1 ' +
                              (isMe
                                ? 'text-right text-blue-600 dark:text-blue-400'
                                : 'text-gray-700 dark:text-gray-300')
                            }
                          >
                            {senderName}
                          </p>
                          <div
                            className={
                              'rounded-2xl overflow-hidden ' +
                              (isMe
                                ? 'bg-blue-500 text-white rounded-br-sm ' +
                                  (isOptimistic ? 'opacity-70' : '')
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm')
                            }
                          >
                            {msg.replyTo && (
                              <div
                                className={
                                  'px-3 py-1.5 text-xs border-l-2 ' +
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
                              <p className="text-sm italic opacity-60 px-3.5 py-2">
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
                                        className="w-full max-h-80 bg-black"
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
                                  <p className="text-sm whitespace-pre-wrap break-words px-3.5 py-2">
                                    {msg.text}
                                  </p>
                                )}
                              </>
                            )}
                            <div
                              className={
                                'text-[10px] pb-1.5 px-3.5 flex items-center gap-1 ' +
                                (isMe ? 'text-blue-100 justify-end' : 'text-gray-400')
                              }
                            >
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <MessageTicks
                                isOptimistic={isOptimistic}
                                read={msg.read}
                                delivered={!!msg.deliveredAt}
                                isMe={isMe}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

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
                    <X className="w-4 h-4 text-gray-500" />
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
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSendChat}
                className="p-3 flex items-center gap-2"
              >
                <input
                  ref={chatFileInputRef}
                  id="community-chat-file"
                  name="file"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleChatFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => chatFileInputRef.current?.click()}
                  disabled={uploadingChat || sendingChat}
                  className="p-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                  title="Attach image or video"
                >
                  {uploadingChat ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  ) : (
                    <ImageIcon className="w-5 h-5" />
                  )}
                </button>
                <input
                  id="community-chat-input"
                  name="message"
                  type="text"
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  placeholder="Message the group..."
                  maxLength={2000}
                  className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={sendingChat}
                />
                <button
                  type="submit"
                  disabled={(!chatText.trim() && !pendingMedia) || sendingChat || uploadingChat}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-full transition disabled:opacity-50"
                >
                  {sendingChat ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (() => {
        const menuMsg = messages.find((m) => m._id === contextMenu.messageId);
        if (!menuMsg) return null;
        const isMyMenuMsg = menuMsg.sender._id === user?.userId;
        return (
          <div
            className="fixed z-[60] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { setReplyingTo(menuMsg); setContextMenu(null); }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
            >
              <ReplyIcon className="w-4 h-4" /> Reply
            </button>
            {menuMsg.text && (
              <button
                onClick={() => { navigator.clipboard.writeText(menuMsg.text); setContextMenu(null); }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-200"
              >
                <Copy className="w-4 h-4" /> Copy
              </button>
            )}
            {isMyMenuMsg && (
              <button
                onClick={() => handleChatDelete(menuMsg)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        );
      })()}
    </div>
  );
}