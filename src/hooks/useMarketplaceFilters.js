import { useMemo, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

const DEFAULT_CATEGORIES = [
  { value: 'ALL', label: 'All' },
  { value: 'SEEDS', label: 'Seeds' },
  { value: 'FERTILIZERS', label: 'Fertilizers' },
  { value: 'PESTICIDES', label: 'Pesticides' },
  { value: 'TOOLS', label: 'Tools' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'ORGANIC', label: 'Organic' },
  { value: 'OTHERS', label: 'Others' },
];

/**
 * Shared marketplace browse filters — search, category, price sort.
 */
export function useMarketplaceFilters(products, options = {}) {
  const {
    categories = DEFAULT_CATEGORIES,
    excludeOwnProducts,
    getUserId,
    getUserEmail,
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('default');
  const debouncedSearch = useDebouncedValue(searchTerm);

  const filteredProducts = useMemo(() => {
    let list = products;

    if (excludeOwnProducts) {
      const currentUserId = getUserId?.();
      const currentUserEmail = getUserEmail?.();
      if (currentUserId || currentUserEmail) {
        list = list.filter((product) => {
          const isOwn =
            (currentUserId &&
              product.sellerId &&
              product.sellerId.toString() === currentUserId.toString()) ||
            (currentUserEmail &&
              product.sellerEmail &&
              product.sellerEmail.toLowerCase() === currentUserEmail.toLowerCase());
          return !isOwn;
        });
      }
    }

    if (selectedCategory !== 'ALL') {
      list = list.filter(
        (p) => p.category?.toUpperCase() === selectedCategory.toUpperCase(),
      );
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.productName?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.vendorName?.toLowerCase().includes(q),
      );
    }

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => (a.discountedPrice || a.price) - (b.discountedPrice || b.price));
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => (b.discountedPrice || b.price) - (a.discountedPrice || a.price));
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) => (a.productName || '').localeCompare(b.productName || ''));
    }

    return list;
  }, [
    products,
    debouncedSearch,
    selectedCategory,
    sortBy,
    excludeOwnProducts,
    getUserId,
    getUserEmail,
  ]);

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    debouncedSearch,
    filteredProducts,
    categories,
    resultCount: filteredProducts.length,
    hasActiveFilters: selectedCategory !== 'ALL' || searchTerm.trim().length > 0,
    clearFilters: () => {
      setSearchTerm('');
      setSelectedCategory('ALL');
      setSortBy('default');
    },
  };
}
