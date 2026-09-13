import { useCallback, useEffect, useState } from 'react';
import { fetchProjects, fetchStats, type Project, type Stats } from '../lib/api';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Erreur inconnue';
}

export function useProjects(options: { forks?: boolean } = {}) {
  const { forks = false } = options;
  const [state, setState] = useState<AsyncState<Project[]>>({ data: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ ...previous, loading: true, error: null }));

    fetchProjects({ forks })
      .then((projects) => {
        if (!cancelled) setState({ data: projects, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, loading: false, error: messageOf(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [forks, nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  return { ...state, reload };
}

export function useStats() {
  const [state, setState] = useState<AsyncState<Stats>>({ data: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetchStats()
      .then((stats) => {
        if (!cancelled) setState({ data: stats, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ data: null, loading: false, error: messageOf(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);
  return { ...state, reload };
}
