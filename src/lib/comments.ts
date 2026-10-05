import api from './api';

export interface CommentAuthor {
  _id: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export interface Comment {
  _id: string;
  wing: string;
  author: CommentAuthor;
  text: string;
  likesCount?: number;
  likedByMe?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export async function getComments(
  wingId: string,
  page = 1,
  limit = 20,
): Promise<Comment[]> {
  try {
    const res = await api.get(
      `/wings/${wingId}/comments?page=${page}&limit=${limit}`,
    );
    const data = res.data;
    return Array.isArray(data) ? data : data?.data || [];
  } catch (err) {
    console.error('Failed to load comments:', err);
    return [];
  }
}

export async function createComment(
  wingId: string,
  text: string,
): Promise<Comment> {
  const res = await api.post(`/wings/${wingId}/comments`, { text });
  return res.data;
}

export async function deleteComment(
  wingId: string,
  commentId: string,
): Promise<void> {
  await api.delete(`/wings/${wingId}/comments/${commentId}`);
}

export async function likeComment(
  wingId: string,
  commentId: string,
): Promise<{ liked: boolean; likesCount: number }> {
  const res = await api.post(
    `/wings/${wingId}/comments/${commentId}/like`,
  );
  return res.data;
}

export async function unlikeComment(
  wingId: string,
  commentId: string,
): Promise<{ liked: boolean; likesCount: number }> {
  const res = await api.delete(
    `/wings/${wingId}/comments/${commentId}/like`,
  );
  return res.data;
}