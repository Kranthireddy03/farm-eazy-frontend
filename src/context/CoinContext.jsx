import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from './AuthContext';

const CoinContext = createContext();

export function useCoin() {
  return useContext(CoinContext);
}

export function CoinProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [coins, setCoins] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCoins = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/coins');
      setCoins(response.data);
    } catch (error) {
      setCoins(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setCoins(null);
      setLoading(false);
      return;
    }

    fetchCoins();
  }, [isAuthenticated]);

  return (
    <CoinContext.Provider value={{ coins, loading, refreshCoins: fetchCoins }}>
      {children}
    </CoinContext.Provider>
  );
}
