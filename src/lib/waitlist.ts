import api from './api';

export async function joinWaitlist(email: string, source = 'web') {
  const res = await api.post('/waitlist/join', { email, source });
  return res.data;
}

export async function checkWaitlist() {
  const res = await api.get('/waitlist/check');
  return res.data;
}

export async function getWaitlistCount() {
  const res = await api.get('/waitlist/count');
  return res.data;
}