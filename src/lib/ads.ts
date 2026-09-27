import api from './api';

export interface AdCampaign {
  _id: string;
  name: string;
  objective: string;
  wing?: { _id: string; title: string };
  dailyBudget: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  impressions: number;
  clicks: number;
  spent: number;
  createdAt: string;
}

export async function getMyCampaigns(): Promise<AdCampaign[]> {
  const res = await api.get('/ads/campaigns/mine');
  return res.data || [];
}

export async function createCampaign(data: {
  name: string;
  objective: string;
  wing?: string;
  dailyBudget: number;
}): Promise<AdCampaign> {
  const res = await api.post('/ads/campaigns', data);
  return res.data;
}

export async function updateCampaign(
  id: string,
  data: { name?: string; status?: string; dailyBudget?: number },
) {
  const res = await api.patch('/ads/campaigns/' + id, data);
  return res.data;
}

export async function deleteCampaign(id: string) {
  const res = await api.delete('/ads/campaigns/' + id);
  return res.data;
}