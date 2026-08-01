import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'farmeazy_wishlist';

function readWishlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useWishlist() {
  const [ids, setIds] = useState(readWishlist);

  useEffect(() => {
    const onStorage = () => setIds(readWishlist());
    const onWishlistUpdated = () => setIds(readWishlist());
    window.addEventListener('storage', onStorage);
    window.addEventListener('farmeazy:wishlist-updated', onWishlistUpdated);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('farmeazy:wishlist-updated', onWishlistUpdated);
    };
  }, []);

  const persist = useCallback((next) => {
    setIds(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('farmeazy:wishlist-updated'));
  }, []);

  const isWishlisted = useCallback(
    (productId) => ids.includes(Number(productId)),
    [ids],
  );

  const toggleWishlist = useCallback(
    (productId) => {
      const id = Number(productId);
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      persist(next);
      return !ids.includes(id);
    },
    [ids, persist],
  );

  return { wishlistIds: ids, isWishlisted, toggleWishlist };
}
