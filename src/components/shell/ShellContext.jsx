import { createContext, useContext, useCallback, useState } from 'react';

const ShellContext = createContext(null);

export function ShellProvider({ children }) {
  const [commandOpen, setCommandOpen] = useState(false);

  const openCommandPalette = useCallback(() => setCommandOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandOpen(false), []);

  return (
    <ShellContext.Provider value={{ commandOpen, setCommandOpen, openCommandPalette, closeCommandPalette }}>
      {children}
    </ShellContext.Provider>
  );
}

export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) {
    return {
      commandOpen: false,
      setCommandOpen: () => {},
      openCommandPalette: () => {},
      closeCommandPalette: () => {},
    };
  }
  return ctx;
}

export default ShellContext;
