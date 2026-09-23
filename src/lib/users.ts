import api from './api';

export interface UserProfile {
  _id: string;
  username: string;
  name?: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  verifiedUntil?: string | null;
  subscriptionTier?: string;
  createdAt: string;
  pinnedWing?: any;
}

export interface Comment {
  _id: string;
  text: string;
  author: { _id: string; username: string; name?: string; email: string; avatarUrl?: string; isVerified?: boolean };
  createdAt: string;
}

export interface SubscriptionStatus {
  tier: string;
  isVerified: boolean;
  isActive: boolean;
  verifiedUntil: string | null;
  daysLeft: number;
  price: number;
  currency: string;
  billingCycle: string;
}

export interface UserSettings {
  privacy: {
    privateAccount: boolean;
    showActivity: boolean;
    allowDMsFrom: 'everyone' | 'followers' | 'nobody';
  };
  notifications: {
    inAppNotifications: boolean;
    emailOnMention: boolean;
    emailOnFollow: boolean;
    emailOnLike: boolean;
  };
  content: {
    showSensitiveContent: boolean;
    autoplayVideos: boolean;
  };
}

export async function getUser(id: string): Promise<UserProfile> {
  const res = await api.get('/users/' + id);
  return res.data;
}

export async function followUser(id: string) {
  const res = await api.post('/users/' + id + '/follow');
  return res.data;
}

export async function unfollowUser(id: string) {
  const res = await api.delete('/users/' + id + '/follow');
  return res.data;
}

export async function getFollowers(id: string) {
  const res = await api.get('/users/' + id + '/followers');
  return res.data;
}

export async function getFollowing(id: string) {
  const res = await api.get('/users/' + id + '/following');
  return res.data;
}

export async function getWing(id: string) {
  const res = await api.get('/wings/' + id);
  return res.data;
}

export async function getComments(wingId: string): Promise<Comment[]> {
  const res = await api.get('/wings/' + wingId + '/comments');
  return res.data;
}

export async function createComment(wingId: string, text: string) {
  const res = await api.post('/wings/' + wingId + '/comments', { text });
  return res.data;
}

export async function getWingsByAuthor(authorId: string) {
  const res = await api.get('/wings?limit=100');
  const all = res.data.data || [];
  return { ...res.data, data: all.filter((w: any) => w.author?._id === authorId) };
}

// ============ SUBSCRIPTION ============
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  const res = await api.get('/users/me/subscription');
  return res.data;
}

export async function subscribe(paymentId?: string) {
  const res = await api.post('/users/me/subscribe', { paymentId });
  return res.data;
}

export async function cancelSubscription() {
  const res = await api.delete('/users/me/subscribe');
  return res.data;
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  const res = await api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// ============ SETTINGS ============
export async function getSettings(): Promise<UserSettings> {
  const res = await api.get('/users/me/settings');
  return res.data;
}

export async function updateSettings(dto: Partial<UserSettings>): Promise<UserSettings> {
  const res = await api.patch('/users/me/settings', dto);
  return res.data;
}

// ============ BLOCK / MUTE ============
export async function getBlockedUsers() {
  const res = await api.get('/users/me/blocked');
  return res.data;
}

export async function blockUser(userId: string) {
  const res = await api.post('/users/me/block/' + userId);
  return res.data;
}

export async function unblockUser(userId: string) {
  const res = await api.delete('/users/me/block/' + userId);
  return res.data;
}

export async function getMutedUsers() {
  const res = await api.get('/users/me/muted');
  return res.data;
}

export async function muteUser(userId: string) {
  const res = await api.post('/users/me/mute/' + userId);
  return res.data;
}

export async function unmuteUser(userId: string) {
  const res = await api.delete('/users/me/mute/' + userId);
  return res.data;
}

// ============ ACCOUNT ============
export async function deactivateAccount() {
  const res = await api.post('/users/me/deactivate');
  return res.data;
}

export async function reactivateAccount() {
  const res = await api.post('/users/me/reactivate');
  return res.data;
}

export async function exportData() {
  const res = await api.get('/users/me/export');
  return res.data;
}