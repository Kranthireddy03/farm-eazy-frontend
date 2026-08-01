import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';

const CoinContext = createContext();

export function useCoin() {
  return useContext(CoinContext);
}

export function CoinProvider({ children }) {
  const [coins, setCoins] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCoins = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/coins');
      setCoins(response.data);
    } catch (error) {
      setCoins(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
     const token = localStorage.getItem("farmEazy_token");
     if (!token) return; // STOP here if not logged in
     fetchCoins();
  }, [fetchCoins]);

  return (
    <CoinContext.Provider value={{ coins, loading, refreshCoins: fetchCoins }}>
      {children}
    </CoinContext.Provider>
  );
}
