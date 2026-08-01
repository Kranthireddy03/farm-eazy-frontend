import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  calculateCartTotals,
  COIN_VALUE,
  getMaxUsableCoins,
  MINIMUM_PAYMENT,
} from '../lib/marketplace';

const CHECKOUT_COINS_KEY = 'farmeazy_checkout_coins';

/**
 * Checkout totals and coin application — shared between cart and checkout pages.
 */
export function useCheckout(cartItems, availableCoins = 0) {
  const [useCoins, setUseCoins] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHECKOUT_COINS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUseCoins(Boolean(parsed.useCoins));
        setCoinsToUse(Number(parsed.coinsToUse) || 0);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const totals = useMemo(() => calculateCartTotals(cartItems), [cartItems]);

  const maxUsableCoins = useMemo(
    () => getMaxUsableCoins(totals.total, availableCoins, MINIMUM_PAYMENT),
    [totals.total, availableCoins],
  );

  const coinDiscount = useCoins ? coinsToUse * COIN_VALUE : 0;
  const finalAmount = Math.max(0, totals.total - coinDiscount);

  const handleUseCoins = useCallback(
    (checked) => {
      setUseCoins(checked);
      if (checked) {
        setCoinsToUse(maxUsableCoins);
      } else {
        setCoinsToUse(0);
      }
    },
    [maxUsableCoins],
  );

  const persistCoins = useCallback(() => {
    localStorage.setItem(
      CHECKOUT_COINS_KEY,
      JSON.stringify({ useCoins, coinsToUse }),
    );
  }, [useCoins, coinsToUse]);

  const clearPersistedCoins = useCallback(() => {
    localStorage.removeItem(CHECKOUT_COINS_KEY);
  }, []);

  return {
    totals,
    useCoins,
    coinsToUse,
    maxUsableCoins,
    coinDiscount,
    finalAmount,
    setUseCoins,
    setCoinsToUse,
    handleUseCoins,
    persistCoins,
    clearPersistedCoins,
  };
}
