import api from './api';

export interface Notification {
  _id: string;
  recipient: string;
  sender: { _id: string; username: string; name?: string; email: string };
  type: 'like' | 'comment' | 'follow' | 'repost' | 'mention';
  wing?: { _id: string; title: string };
  read: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<Notification[]> {
  const res = await api.get('/notifications');
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get('/notifications/unread-count');
  return res.data.count;
}

export async function markAllRead() {
  const res = await api.patch('/notifications/read-all');
  return res.data;
}

export async function markRead(id: string) {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data;
}