import api from './api';

export interface Wing {
  _id: string;
  title: string;
  content: string;
  author: { _id: string; username: string; name?: string; email: string; avatarUrl?: string; isVerified?: boolean };
  likesCount: number;
  commentsCount: number;
  repostsCount: number;
  bookmarksCount: number;
  views: number;
  hashtags: string[];
  mentions: string[];
  isPublished: boolean;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
}

export async function getFeed(page = 1, limit = 20) {
  const res = await api.get('/wings/feed?page=' + page + '&limit=' + limit);
  return res.data;
}

export async function getPublicWings(page = 1, limit = 20) {
  const res = await api.get('/wings?page=' + page + '&limit=' + limit);
  return res.data;
}

export async function createWing(data: { title: string; content: string; isPublished?: boolean }) {
  const res = await api.post('/wings', data);
  return res.data;
}

export async function likeWing(id: string) {
  const res = await api.post('/wings/' + id + '/like');
  return res.data;
}

export async function unlikeWing(id: string) {
  const res = await api.delete('/wings/' + id + '/like');
  return res.data;
}

export async function repostWing(id: string, quoteText?: string) {
  const res = await api.post('/wings/' + id + '/repost', quoteText ? { quoteText } : {});
  return res.data;
}

export async function undoRepostWing(id: string) {
  const res = await api.delete('/wings/' + id + '/repost');
  return res.data;
}

export async function bookmarkWing(id: string) {
  const res = await api.post('/wings/' + id + '/bookmark');
  return res.data;
}

export async function unbookmarkWing(id: string) {
  const res = await api.delete('/wings/' + id + '/bookmark');
  return res.data;
}

export async function uploadMedia(wingId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/wings/' + wingId + '/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getTrendingHashtags(limit = 10) {
  const res = await api.get('/wings/trending/hashtags?limit=' + limit);
  return res.data;
}