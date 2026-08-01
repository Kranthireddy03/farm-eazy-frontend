/** Shared marketplace helpers — cart shape preserved for checkout compatibility */
export const TAX_RATE = 0.18;
export const COIN_VALUE = 1;
export const MINIMUM_PAYMENT = 1;

export function getItemUnitPrice(item) {
  if (item.discountedPrice !== undefined && item.discountedPrice > 0) {
    return item.discountedPrice;
  }
  return item.price;
}

export function calculateCartTotals(cartItems, taxRate = TAX_RATE) {
  const subtotal = cartItems.reduce(
    (sum, item) => sum + getItemUnitPrice(item) * item.quantity,
    0,
  );
  const savings = cartItems.reduce((sum, item) => {
    if (item.discountedPrice !== undefined && item.discountedPrice < item.price) {
      return sum + (item.price - item.discountedPrice) * item.quantity;
    }
    return sum;
  }, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  return { subtotal, tax, total, savings };
}

export function getMaxUsableCoins(totalAmount, availableCoins, minPayment = MINIMUM_PAYMENT) {
  const maxAllowedDiscount = Math.max(0, totalAmount - minPayment);
  return Math.min(availableCoins, Math.floor(maxAllowedDiscount));
}

export function buildCartItem(product, quantity = 1) {
  return {
    id: product.id,
    productName: product.productName,
    description: product.description,
    price: product.price,
    unit: product.unit,
    discountPercentage: product.discountPercentage,
    discountedPrice: product.discountedPrice,
    category: product.category,
    sellerId: product.userId || product.sellerId,
    sellerFullName: product.sellerFullName,
    availableQuantity: product.quantity,
    quantity,
    imageUrl: product.imageUrl || (product.imageUrls ? product.imageUrls.split(',')[0] : null),
    addedAt: new Date().toISOString(),
    vendorName: product.vendorName || product.sellerFullName || '',
    vendorId: product.vendorId || product.userId || '',
    vendorLocation: product.vendorLocation || product.sellerLocation || '',
    vendorType: product.vendorType || '',
    sellerEmail: product.sellerEmail || '',
    sellerPhone: product.sellerPhone || '',
    deliverable: product.deliverable !== false,
    deliveryMessage: product.deliveryMessage || '',
  };
}

export function addToCartStorage(cartItem) {
  const existingCart = JSON.parse(localStorage.getItem('farmeazy_cart') || '[]');
  const idx = existingCart.findIndex((item) => item.id === cartItem.id);
  if (idx > -1) {
    const maxQuantity = cartItem.availableQuantity;
    const newQuantity = existingCart[idx].quantity + cartItem.quantity;
    existingCart[idx].quantity = Math.min(newQuantity, maxQuantity);
  } else {
    existingCart.push(cartItem);
  }
  localStorage.setItem('farmeazy_cart', JSON.stringify(existingCart));
  window.dispatchEvent(new Event('cart-updated'));
}
