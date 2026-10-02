import api from './api';

export interface AdCampaign {
  _id: string;
  name: string;
  objective: string;
  dailyBudget: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'rejected';
  owner: string;
  impressions: number;
  clicks: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
}

export async function getMyCampaigns(): Promise<AdCampaign[]> {
  const res = await api.get('/ads/campaigns/mine');
  return res.data || [];
}

export async function getCampaign(id: string): Promise<AdCampaign> {
  const res = await api.get('/ads/campaigns/' + id);
  return res.data;
}

export async function createCampaign(data: {
  name: string;
  objective: string;
  dailyBudget: number;
}): Promise<AdCampaign> {
  const res = await api.post('/ads/campaigns', data);
  return res.data;
}

export async function updateCampaign(
  id: string,
  data: Partial<AdCampaign>,
): Promise<AdCampaign> {
  const res = await api.patch('/ads/campaigns/' + id, data);
  return res.data;
}

export async function deleteCampaign(id: string): Promise<void> {
  await api.delete('/ads/campaigns/' + id);
}