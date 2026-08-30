import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

const CoinContext = createContext();
const CACHE_KEY = 'farmEazy_session_coins';

export function useCoin() { return useContext(CoinContext); }

export function CoinProvider({ children }) {
  const [coins, setCoins] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCoins = useCallback(async (serverData = null) => {
    if (serverData) {
      setCoins(serverData);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(serverData)); } catch (_) {}
      setLoading(false);
      return serverData;
    }
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed.totalCoins === 'number') {
          setCoins(parsed); setLoading(false); return parsed;
        }
      }
    } catch (_) {}
    setLoading(true);
    try {
      const response = await apiClient.get('/coins');
      setCoins(response.data);
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(response.data)); } catch (_) {}
      return response.data;
    } catch (_) {
      setCoins(null);
      return null;
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('farmEazy_token');
    if (!token) { setLoading(false); return; }
    fetchCoins();
  }, [fetchCoins]);

  // Re-fetch coins the moment a login completes (the mount effect above may have
  // run while logged out, which is why the balance could appear as 0 until a
  // manual refresh). Clearing on logout keeps stale balances from lingering.
  useEffect(() => {
    const handleAuthChange = (e) => {
      const authed = Boolean(e?.detail?.isAuthenticated);
      if (authed) {
        fetchCoins();
      } else {
        setCoins(null);
        setLoading(false);
        try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
      }
    };
    window.addEventListener('authStateChange', handleAuthChange);
    return () => window.removeEventListener('authStateChange', handleAuthChange);
  }, [fetchCoins]);

  return <CoinContext.Provider value={{ coins, loading, refreshCoins: fetchCoins }}>{children}</CoinContext.Provider>;
}
