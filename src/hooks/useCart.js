import { useState, useEffect, useCallback } from 'react';
import ProductService from '../services/ProductService';
import {
  calculateCartTotals,
  COIN_VALUE,
  getMaxUsableCoins,
} from '../lib/marketplace';

const CART_KEY = 'farmeazy_cart';
const CHECKOUT_COINS_KEY = 'farmeazy_checkout_coins';

export function useCart({ onToast } = {}) {
  const [cartItems, setCartItems] = useState([]);
  const [coins, setCoins] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);

  const loadCart = useCallback(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) setCartItems(JSON.parse(saved));
    } catch {
      setCartItems([]);
    }
  }, []);

  const saveCart = useCallback((items) => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    setCartItems(items);
    window.dispatchEvent(new Event('cart-updated'));
  }, []);

  useEffect(() => {
    loadCart();
    const onCartUpdated = () => loadCart();
    window.addEventListener('cart-updated', onCartUpdated);
    return () => window.removeEventListener('cart-updated', onCartUpdated);
  }, [loadCart]);

  const removeFromCart = useCallback(
    async (productId) => {
      const item = cartItems.find((i) => i.id === productId);
      if (item) {
        try {
          await ProductService.releaseProductQuantity(productId, item.quantity);
        } catch (error) {
          onToast?.(
            `Failed to release stock: ${error?.response?.data?.message || error.message}`,
            'error',
          );
        }
      }
      const next = cartItems.filter((i) => i.id !== productId);
      saveCart(next);
      onToast?.('Item removed from cart', 'success');
    },
    [cartItems, saveCart, onToast],
  );

  const updateQuantity = useCallback(
    (productId, newQuantity) => {
      if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
      }
      const item = cartItems.find((i) => i.id === productId);
      if (item && newQuantity > item.availableQuantity) {
        onToast?.(`Only ${item.availableQuantity} items available`, 'warning');
        return;
      }
      saveCart(
        cartItems.map((i) => (i.id === productId ? { ...i, quantity: newQuantity } : i)),
      );
    },
    [cartItems, saveCart, removeFromCart, onToast],
  );

  const totals = calculateCartTotals(cartItems);

  const handleUseCoins = useCallback(
    (checked) => {
      setUseCoins(checked);
      if (checked) {
        setCoinsToUse(getMaxUsableCoins(totals.total, coins));
      } else {
        setCoinsToUse(0);
      }
    },
    [totals.total, coins],
  );

  const finalAmount = Math.max(0, totals.total - coinsToUse * COIN_VALUE);

  const persistCheckoutCoins = useCallback(() => {
    localStorage.setItem(
      CHECKOUT_COINS_KEY,
      JSON.stringify({ useCoins, coinsToUse }),
    );
  }, [useCoins, coinsToUse]);

  const setAvailableCoins = useCallback((amount) => {
    setCoins(amount);
  }, []);

  return {
    cartItems,
    coins,
    useCoins,
    coinsToUse,
    totals,
    finalAmount,
    loadCart,
    saveCart,
    updateQuantity,
    removeFromCart,
    handleUseCoins,
    persistCheckoutCoins,
    setAvailableCoins,
    setCoinsToUse,
    setUseCoins,
    isEmpty: cartItems.length === 0,
  };
}
