import { useState, useCallback } from 'react';

/**
 * useLoader - Global loader hook for managing loading state across the app
 * Usage: const { show, hide, loading } = useLoader();
 */
export default function useLoader() {
  const [loading, setLoading] = useState(false);

  const show = useCallback(() => setLoading(true), []);
  const hide = useCallback(() => setLoading(false), []);

  return { loading, show, hide };
}
