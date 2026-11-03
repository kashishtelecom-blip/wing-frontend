import api from './api';

export interface CreatorEarnings {
  user: string;
  totalQualifiedViews: number;
  pendingBalance: number; // Changed from availableBalance to match backend
  lifetimeEarnings: number;
}

export async function getMyEarnings(): Promise<CreatorEarnings> {
  const res = await api.get('/earnings/me');
  return res.data;
}

export async function trackWingView(wingId: string) {
  try {
    // Send wingId in the body to match the controller
    await api.post('/earnings/track', { wingId });
  } catch (err) {
    // Silent fail
  }
}