import React, { createContext, useContext, useState, useCallback } from 'react';
import Loader from '../components/Loader';

const LoaderContext = createContext({
  show: () => {},
  hide: () => {},
  loading: false,
});

export const useLoader = () => useContext(LoaderContext);

export const LoaderProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const show = useCallback(() => setLoading(true), []);
  const hide = useCallback(() => setLoading(false), []);

  return (
    <LoaderContext.Provider value={{ show, hide, loading }}>
      {loading && <Loader message="Loading, please wait..." />}
      {children}
    </LoaderContext.Provider>
  );
};
