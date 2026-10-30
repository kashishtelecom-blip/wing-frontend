import api from './api';

export interface BusinessPage {
  _id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl?: string;
  coverUrl?: string;
  category: string;
  owner: string;
  followers: string[];
}

export async function createBusinessPage(data: {
  name: string;
  slug: string;
  description?: string;
  category?: string;
}) {
  const res = await api.post('/business', data);
  return res.data;
}

export async function getMyBusinessPages(): Promise<BusinessPage[]> {
  const res = await api.get('/business/mine');
  return res.data || [];
}

export async function getBusinessPageBySlug(slug: string): Promise<BusinessPage> {
  const res = await api.get(`/business/${slug}`);
  return res.data;
}

export async function toggleFollowBusinessPage(slug: string) {
  const res = await api.post(`/business/${slug}/follow`);
  return res.data;
}