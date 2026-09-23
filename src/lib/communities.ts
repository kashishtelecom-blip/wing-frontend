import api from './api';

export interface Community {
  _id: string;
  name: string;
  description: string;
  emoji: string;
  creator: { _id: string; username: string; name?: string; avatarUrl?: string; isVerified?: boolean };
  members: any[];
  membersCount: number;
  postsCount: number;
  isPublic: boolean;
  tags: string[];
  createdAt: string;
}

export interface CommunityMessage {
  _id: string;
  community: string;
  sender: { _id: string; username: string; name?: string; avatarUrl?: string; isVerified?: boolean };
  text: string;
  createdAt: string;
}

export async function getAllCommunities(search?: string): Promise<Community[]> {
  const url = search ? '/communities?q=' + encodeURIComponent(search) : '/communities';
  const res = await api.get(url);
  return res.data || [];
}

export async function getMyCommunities(): Promise<Community[]> {
  const res = await api.get('/communities/mine');
  return res.data || [];
}

export async function getCommunity(id: string): Promise<Community> {
  const res = await api.get('/communities/' + id);
  return res.data;
}

export async function createCommunity(data: {
  name: string;
  description: string;
  emoji?: string;
  isPublic?: boolean;
  tags?: string[];
}): Promise<Community> {
  const res = await api.post('/communities', data);
  return res.data;
}

export async function joinCommunity(id: string) {
  const res = await api.post('/communities/' + id + '/join');
  return res.data;
}

export async function leaveCommunity(id: string) {
  const res = await api.delete('/communities/' + id + '/leave');
  return res.data;
}

export async function deleteCommunity(id: string) {
  const res = await api.delete('/communities/' + id);
  return res.data;
}

export async function addMembers(communityId: string, userIds: string[]) {
  const res = await api.post('/communities/' + communityId + '/add-members', { userIds });
  return res.data;
}

export async function removeMember(communityId: string, userId: string) {
  const res = await api.delete('/communities/' + communityId + '/members/' + userId);
  return res.data;
}

export async function getCommunityMessages(communityId: string): Promise<CommunityMessage[]> {
  try {
    const res = await api.get('/communities/' + communityId + '/messages', { timeout: 10000 });
    return res.data || [];
  } catch {
    return [];
  }
}

export async function sendCommunityMessage(communityId: string, text: string): Promise<CommunityMessage> {
  const res = await api.post('/communities/' + communityId + '/messages', { text }, { timeout: 10000 });
  return res.data;
}