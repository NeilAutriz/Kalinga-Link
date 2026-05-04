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
