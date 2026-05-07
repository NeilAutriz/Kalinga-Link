import axios from 'axios';
import type { ResourceNeedInput } from '../lib/types';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true,
  timeout: 8000,
});

// Allow callers to detect "API unreachable" cases for graceful mock fallback.
export const isNetworkError = (e: unknown) => {
  // @ts-expect-error axios shape
  return !!e && (e.code === 'ERR_NETWORK' || e.message === 'Network Error');
};

export const createResourceNeed = (data: ResourceNeedInput) =>
  api.post('/resources', data).then(r => r.data);

export const updateResourceNeed = (id: string, data: Partial<ResourceNeedInput>) =>
  api.put(`/resources/${id}`, data).then(r => r.data);

export const deleteResourceNeed = (id: string) =>
  api.delete(`/resources/${id}`);

export const createCommittee = (data: { eventId: string; name: string; description?: string; slotCount: number }) =>
  api.post('/committees', data).then(r => r.data);

export const deleteCommittee = (id: string) =>
  api.delete(`/committees/${id}`);

export const updateEvent = (id: string, data: Partial<import('../lib/types').EventItem>) =>
  api.patch(`/events/${id}`, data).then(r => r.data);

// ── Community Forum ────────────────────────────────────────

export const createPost = (data: {
  content: string;
  type?: string;
  program?: string | null;
  media?: { data: string; mimeType: string }[];
}) => api.post('/forum/posts', data).then(r => r.data);

export const deletePost = (id: string) =>
  api.delete(`/forum/posts/${id}`);

export const likePost = (id: string) =>
  api.post(`/forum/posts/${id}/like`).then(r => r.data as { likeCount: number; isLiked: boolean });

export const pinPost = (id: string) =>
  api.patch(`/forum/posts/${id}/pin`).then(r => r.data as { isPinned: boolean });

export const getComments = (postId: string, skip = 0, limit = 20) =>
  api.get(`/forum/posts/${postId}/comments?skip=${skip}&limit=${limit}`).then(r => r.data);

export const createComment = (postId: string, content: string) =>
  api.post(`/forum/posts/${postId}/comments`, { content }).then(r => r.data);

export const deleteComment = (commentId: string) =>
  api.delete(`/forum/comments/${commentId}`);

export const reportPost = (
  postId: string,
  reason: string,
  details?: string,
) =>
  api
    .post(`/forum/posts/${postId}/report`, { reason, details: details ?? '' })
    .then(r => r.data as { success: boolean; reportId: string });
