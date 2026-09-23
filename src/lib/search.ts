import api from './api';

export async function searchAll(q: string) {
  const res = await api.get(`/search?q=${encodeURIComponent(q)}`);
  return res.data;
}

export async function searchUsers(q: string, limit = 20) {
  const res = await api.get(`/search/users?q=${encodeURIComponent(q)}&limit=${limit}`);
  return res.data;
}

export async function searchWings(q: string, limit = 20) {
  const res = await api.get(`/search/wings?q=${encodeURIComponent(q)}&limit=${limit}`);
  return res.data;
}