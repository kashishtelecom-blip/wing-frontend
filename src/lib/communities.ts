import api from './api';

export interface CommunityUser {
  _id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export interface Community {
  _id: string;
  name: string;
  description?: string;
  emoji?: string;
  creator: CommunityUser;
  members: any[];
  isPublic: boolean;
  tags: string[];
  membersCount: number;
  postsCount: number;
  createdAt: string;
}

export interface CommunityMessage {
  _id: string;
  community: string;
  sender: CommunityUser;
  text: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | null;
  replyTo?: {
    _id: string;
    text: string;
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | null;
    sender: { _id: string; username: string; name?: string };
    deletedAt?: string | null;
  } | null;
  read: boolean;
  deliveredAt?: string | null;
  createdAt: string;
  deletedAt?: string | null;
}

export async function getCommunities(q?: string): Promise<Community[]> {
  const res = await api.get('/communities' + (q ? `?q=${encodeURIComponent(q)}` : ''));
  return res.data || [];
}

export async function getMyCommunities(): Promise<Community[]> {
  const res = await api.get('/communities/mine');
  return res.data || [];
}

export async function getCommunity(id: string): Promise<Community> {
  const res = await api.get(`/communities/${id}`);
  return res.data;
}

export async function createCommunity(data: {
  name: string;
  description?: string;
  emoji?: string;
  isPublic?: boolean;
  tags?: string[];
}): Promise<Community> {
  const res = await api.post('/communities', data);
  return res.data;
}

export async function joinCommunity(id: string) {
  const res = await api.post(`/communities/${id}/join`);
  return res.data;
}

export async function leaveCommunity(id: string) {
  const res = await api.delete(`/communities/${id}/leave`);
  return res.data;
}

export async function deleteCommunity(id: string) {
  const res = await api.delete(`/communities/${id}`);
  return res.data;
}

export async function addMembers(id: string, userIds: string[]) {
  const res = await api.post(`/communities/${id}/add-members`, { userIds });
  return res.data;
}

export async function removeMember(id: string, userId: string) {
  const res = await api.delete(`/communities/${id}/members/${userId}`);
  return res.data;
}

export async function getCommunityMessages(id: string): Promise<CommunityMessage[]> {
  const res = await api.get(`/communities/${id}/messages`);
  return res.data || [];
}

export async function sendCommunityMessage(
  id: string,
  text: string,
  mediaUrl?: string,
  mediaType?: 'image' | 'video',
  replyTo?: string,
): Promise<CommunityMessage> {
  const res = await api.post(`/communities/${id}/messages`, {
    text,
    mediaUrl,
    mediaType,
    replyTo,
  });
  return res.data;
}

export async function uploadCommunityMedia(
  id: string,
  file: File,
): Promise<{ url: string; type: 'image' | 'video' }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/communities/${id}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return res.data;
}

export async function deleteCommunityMessage(
  communityId: string,
  messageId: string,
): Promise<{ deleted: boolean }> {
  const res = await api.delete(`/communities/${communityId}/messages/${messageId}`);
  return res.data;
}