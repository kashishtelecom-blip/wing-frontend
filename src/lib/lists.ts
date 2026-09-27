import api from './api';

export interface UserList {
  _id: string;
  name: string;
  description: string;
  emoji: string;
  owner: { _id: string; username: string; name?: string; avatarUrl?: string; isVerified?: boolean };
  members: any[];
  membersCount: number;
  isPublic: boolean;
  createdAt: string;
}

export async function getMyLists(): Promise<UserList[]> {
  const res = await api.get('/lists/mine');
  return res.data || [];
}

export async function getList(id: string): Promise<UserList> {
  const res = await api.get('/lists/' + id);
  return res.data;
}

export async function getListTimeline(id: string, page = 1, limit = 20) {
  const res = await api.get('/lists/' + id + '/timeline?page=' + page + '&limit=' + limit);
  return res.data;
}

export async function createList(data: {
  name: string;
  description?: string;
  emoji?: string;
  isPublic?: boolean;
}): Promise<UserList> {
  const res = await api.post('/lists', data);
  return res.data;
}

export async function addListMembers(listId: string, userIds: string[]) {
  const res = await api.post('/lists/' + listId + '/members', { userIds });
  return res.data;
}

export async function removeListMember(listId: string, userId: string) {
  const res = await api.delete('/lists/' + listId + '/members/' + userId);
  return res.data;
}

export async function deleteList(listId: string) {
  const res = await api.delete('/lists/' + listId);
  return res.data;
}