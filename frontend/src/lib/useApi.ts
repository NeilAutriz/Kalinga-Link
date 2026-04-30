import { useEffect, useState } from 'react';
import { api } from '../services/api';

type State<T> = { data: T | null; loading: boolean; error: string | null; reload: () => void };

/** Strict-DB fetch hook: no mock fallback. Returns API data or an error. */
export function useApi<T>(path: string | null): State<T> {
  const [state, setState] = useState<State<T>>({ data: null, loading: !!path, error: null, reload: () => {} });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) { setState((s) => ({ ...s, data: null, loading: false, error: null })); return; }
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    api.get(path)
      .then((r) => {
        if (cancelled) return;
        // Auto-unwrap single-key envelopes like { events: [...] } | { event: {...} } | { stats: {...} }
        let payload: any = r.data;
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          const keys = Object.keys(payload);
          if (keys.length === 1) payload = payload[keys[0]];
        }
        setState({ data: payload as T, loading: false, error: null, reload: () => setTick((t) => t + 1) });
      })
      .catch((e) => {
        if (cancelled) return;
        const msg =
          e?.response?.status === 401 || e?.response?.status === 403 ? 'Unauthorized'
          : e?.response?.data?.error ?? e?.message ?? 'Request failed';
        setState({ data: null, loading: false, error: msg, reload: () => setTick((t) => t + 1) });
      });
    return () => { cancelled = true; };
  }, [path, tick]);

  return state;
}
