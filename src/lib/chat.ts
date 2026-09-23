import api from './api';

export interface ChatUser {
  _id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export interface ChatMessage {
  _id: string;
  conversation: string;
  sender: ChatUser;
  text: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: ChatUser[];
  other: ChatUser;
  lastMessage?: {
    _id: string;
    text: string;
    sender: { _id: string; username: string };
    createdAt: string;
    read: boolean;
  };
  lastMessageAt: string;
  unreadCount: number;
}

export async function getConversations(): Promise<Conversation[]> {
  try {
    const res = await api.get('/chat/conversations', { timeout: 10000 });
    return (res.data || []).filter((c: Conversation) => c && c.other);
  } catch (err: any) {
    console.error('Failed to load conversations:', err.message);
    return [];
  }
}

export async function startConversation(userId: string): Promise<Conversation> {
  const res = await api.post('/chat/conversations', { userId }, { timeout: 10000 });
  return res.data;
}

export async function getMessages(
  conversationId: string,
  page = 1,
  limit = 50,
): Promise<ChatMessage[]> {
  if (
    !conversationId ||
    conversationId === 'undefined' ||
    conversationId.startsWith('temp-')
  ) {
    console.warn('Invalid conversationId:', conversationId);
    return [];
  }
  try {
    const res = await api.get(
      '/chat/conversations/' + conversationId + '/messages?page=' + page + '&limit=' + limit,
      { timeout: 10000 },
    );
    return res.data || [];
  } catch (err: any) {
    console.error('Failed to load messages:', err.message);
    return [];
  }
}

export async function sendMessage(
  conversationId: string,
  text: string,
): Promise<ChatMessage> {
  const res = await api.post(
    '/chat/conversations/' + conversationId + '/messages',
    { text },
    { timeout: 10000 },
  );
  return res.data;
}

export async function markConversationRead(conversationId: string) {
  try {
    const res = await api.patch(
      '/chat/conversations/' + conversationId + '/read',
      {},
      { timeout: 10000 },
    );
    return res.data;
  } catch {
    return { updated: 0 };
  }
}

export async function getChatUnread(): Promise<number> {
  try {
    const res = await api.get('/chat/unread-count', { timeout: 10000 });
    return res.data?.count || 0;
  } catch {
    return 0;
  }
}