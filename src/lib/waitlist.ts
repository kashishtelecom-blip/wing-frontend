import api from './api';

export async function joinWaitlist(email: string, source = 'business') {
  const res = await api.post('/waitlist/join', { email, source });
  return res.data;
}

export async function checkWaitlist(source = 'business') {
  const res = await api.get('/waitlist/check?source=' + source);
  return res.data;
}

export async function getWaitlistCount(source = 'business') {
  const res = await api.get('/waitlist/count?source=' + source);
  return res.data;
}