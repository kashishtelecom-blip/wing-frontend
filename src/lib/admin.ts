
import api from './api';

export interface AdminStats {
  users: { total: number; active: number; banned: number; admins: number };
  wings: { total: number; published: number; deleted: number };
  comments: { total: number };
  communities: { total: number };
  reports: { total: number; pending: number };
}

export interface AdminUser {
  _id: string;
  username: string;
  name?: string;
  email: string;
  avatarUrl?: string;
  isVerified?: boolean;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface AdminWing {
  _id: string;
  title?: string;
  content: string;
  author?: { _id: string; username: string; name?: string; avatarUrl?: string };
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  views: number;
  createdAt: string;
  deletedAt?: string | null;
}

export interface AdminCommunity {
  _id: string;
  name: string;
  emoji?: string;
  description?: string;
  creator?: { _id: string; username: string; name?: string; avatarUrl?: string };
  membersCount: number;
  createdAt: string;
}

export interface AdminReport {
  _id: string;
  reporterEmail: string;
  reason: string;
  originalWorkUrl: string;
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  wing?: { _id: string; title?: string; content: string };
  reporter?: { _id: string; username: string; name?: string; email: string };
  createdAt: string;
  reviewedAt?: string | null;
}

// ============ STATS ============
export async function getAdminStats(): Promise<AdminStats> {
  const res = await api.get('/admin/stats');
  return res.data;
}

// ============ USERS ============
export async function listUsers(q?: string, page = 1, limit = 30) {
  const res = await api.get(
    `/admin/users?page=${page}&limit=${limit}` + (q ? `&q=${encodeURIComponent(q)}` : ''),
  );
  return res.data as { data: AdminUser[]; total: number; page: number; limit: number };
}

export async function setUserRole(userId: string, role: 'user' | 'admin') {
  const res = await api.patch(`/admin/users/${userId}/role`, { role });
  return res.data;
}

export async function setUserActive(userId: string, isActive: boolean) {
  const res = await api.patch(`/admin/users/${userId}/active`, { isActive });
  return res.data;
}

export async function deleteUser(userId: string) {
  const res = await api.delete(`/admin/users/${userId}`);
  return res.data;
}

export async function setUserVerified(userId: string, isVerified: boolean) {
  const res = await api.patch(`/admin/users/${userId}/verified`, { isVerified });
  return res.data;
}

// ============ WINGS ============
export async function listWings(q?: string, page = 1, limit = 30) {
  const res = await api.get(
    `/admin/wings?page=${page}&limit=${limit}` + (q ? `&q=${encodeURIComponent(q)}` : ''),
  );
  return res.data as { data: AdminWing[]; total: number; page: number; limit: number };
}

export async function deleteWingAdmin(wingId: string) {
  const res = await api.delete(`/admin/wings/${wingId}`);
  return res.data;
}

// ============ COMMUNITIES ============
export async function listCommunitiesAdmin(page = 1, limit = 30) {
  const res = await api.get(`/admin/communities?page=${page}&limit=${limit}`);
  return res.data as { data: AdminCommunity[]; total: number; page: number; limit: number };
}

export async function deleteCommunityAdmin(id: string) {
  const res = await api.delete(`/admin/communities/${id}`);
  return res.data;
}

// ============ REPORTS ============
export async function listReports(status?: string, page = 1, limit = 30) {
  const res = await api.get(
    `/admin/reports?page=${page}&limit=${limit}` + (status ? `&status=${status}` : ''),
  );
  return res.data as { data: AdminReport[]; total: number; page: number; limit: number };
}

export async function updateReportStatus(id: string, status: string) {
  const res = await api.patch(`/admin/reports/${id}`, { status });
  return res.data;
}