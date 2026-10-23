import api from './api';

export interface StoryItem {
  _id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  createdAt: string;
  hasViewed: boolean;
}

export interface GroupedStories {
  author: {
    _id: string;
    name: string;
    username: string;
    avatarUrl: string;
    isVerified: boolean;
  };
  stories: StoryItem[];
  hasUnseen: boolean;
}

export async function getStoriesFeed(): Promise<GroupedStories[]> {
  try {
    const res = await api.get('/stories/feed');
    return res.data || [];
  } catch (err) {
    console.error('Failed to load stories', err);
    return [];
  }
}

export async function uploadStoryMedia(file: File): Promise<{ mediaUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/stories/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function createStory(mediaUrl: string, mediaType: 'image' | 'video') {
  const res = await api.post('/stories', { mediaUrl, mediaType });
  return res.data;
}

export async function markStoryViewed(storyId: string) {
  try {
    await api.post(`/stories/${storyId}/view`);
  } catch {}
}