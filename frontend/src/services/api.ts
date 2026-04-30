import axios from 'axios';

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
