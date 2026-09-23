import { API_URL } from './api';

// API_URL is like "http://localhost:3000/api"
// Media URLs are stored as "/uploads/xxx.jpg" and served by the backend
// at "http://localhost:3000/uploads/xxx.jpg"
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export function getMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return API_ORIGIN + url;
  return API_ORIGIN + '/' + url;
}