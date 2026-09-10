import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'farmeazy_wishlist';
const DETAILS_KEY = 'farmeazy_wishlist_details';

function readWishlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.map(Number).filter((n) => !isNaN(n)) : [];
  } catch {
    return [];
  }
}

function readWishlistDetails() {
  try {
    const raw = localStorage.getItem(DETAILS_KEY);
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function useWishlist() {
  const [ids, setIds] = useState(readWishlist);
  const [details, setDetails] = useState(readWishlistDetails);

  useEffect(() => {
    const syncState = () => {
      setIds(readWishlist());
      setDetails(readWishlistDetails());
    };
    window.addEventListener('storage', syncState);
    window.addEventListener('farmeazy:wishlist-updated', syncState);
    return () => {
      window.removeEventListener('storage', syncState);
      window.removeEventListener('farmeazy:wishlist-updated', syncState);
    };
  }, []);

  const persist = useCallback((nextIds, nextDetails) => {
    setIds(nextIds);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
    if (nextDetails !== undefined) {
      setDetails(nextDetails);
      localStorage.setItem(DETAILS_KEY, JSON.stringify(nextDetails));
    }
    window.dispatchEvent(new Event('farmeazy:wishlist-updated'));
  }, []);

  const isWishlisted = useCallback(
    (productOrId) => {
      const id = typeof productOrId === 'object' && productOrId !== null
        ? Number(productOrId.id)
        : Number(productOrId);
      if (isNaN(id)) return false;
      return ids.includes(id);
    },
    [ids],
  );

  const toggleWishlist = useCallback(
    (productOrId) => {
      const isObj = typeof productOrId === 'object' && productOrId !== null;
      const id = isObj ? Number(productOrId.id) : Number(productOrId);
      if (isNaN(id) || !id) return false;

      const currentlyIn = ids.includes(id);
      const nextIds = currentlyIn ? ids.filter((x) => x !== id) : [...ids, id];

      const nextDetails = { ...readWishlistDetails() };
      if (currentlyIn) {
        delete nextDetails[id];
      } else if (isObj) {
        nextDetails[id] = {
          id,
          productName: productOrId.productName || productOrId.name || 'Product',
          price: productOrId.price,
          discountedPrice: productOrId.discountedPrice,
          discountPercentage: productOrId.discountPercentage,
          imageUrl: productOrId.imageUrl || productOrId.images?.[0] || null,
          category: productOrId.category,
          deliverable: productOrId.deliverable,
          status: productOrId.status,
          quantity: productOrId.quantity,
          sellerId: productOrId.sellerId,
        };
      }

      persist(nextIds, nextDetails);
      return !currentlyIn;
    },
    [ids, persist],
  );

  return {
    wishlistIds: ids,
    wishlistDetails: details,
    isWishlisted,
    toggleWishlist,
    count: ids.length,
  };
}

