/**
 * Product Modal Component
 * 
 * Modal for viewing product details and adding to cart
 * Features:
 * - Product information display
 * - Quantity selector with inventory check
 * - Add to cart functionality
 * - Stock availability display
 */

import { useState, useEffect } from 'react'
import { useToast } from '../hooks/useToast'

function ProductModal({ product, isOpen, onClose, onAddToCart }) {
  const { showToast } = useToast()
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  // Reset quantity when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1)
    }
  }, [isOpen])

  if (!isOpen || !product) return null

  const handleAddToCart = async () => {
    if (quantity <= 0) {
      showToast('Please select a valid quantity', 'warning')
      return
    }

    if (quantity > product.quantity) {
      showToast(`Only ${product.quantity} items available in stock`, 'warning')
      return
    }

    try {
      setAdding(true)
      
      // Prepare cart item
      const cartItem = {
        id: product.id,
        productName: product.productName,
        description: product.description,
        price: product.price,
        discountPercentage: product.discountPercentage,
        discountedPrice: product.discountedPrice,
        category: product.category,
        categoryIcon: getCategoryIcon(product.category),
        sellerId: product.userId,
        sellerFullName: product.sellerFullName,
        availableQuantity: product.quantity,
        quantity: quantity,
        addedAt: new Date().toISOString()
      }

      // Call parent function to add to cart
      onAddToCart(cartItem)
      
      // Show success message
      showToast(`Added ${quantity} item(s) to cart! 🛒`, 'success')
      
      // Close modal after brief delay
      setTimeout(() => {
        onClose()
      }, 500)
    } catch (error) {
      showToast('Failed to add product to cart', 'error')
      console.error('Error:', error)
    } finally {
      setAdding(false)
    }
  }

  const getCategoryIcon = (category) => {
    const icons = {
      SEEDS: '🌱',
      FERTILIZERS: '🧪',
      PESTICIDES: '🦟',
      TOOLS: '🔧',
      EQUIPMENT: '🚜',
      ORGANIC: '🌿',
      PRODUCE: '🥕',
      MACHINERY: '🚜',
      IRRIGATION: '💧',
      OTHERS: '📦'
    }
    return icons[category?.toUpperCase()] || '📦'
  }

  const isOutOfStock = product.quantity <= 0
  const inStockPercentage = (product.quantity / (product.quantity + 10)) * 100 // Rough calculation

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 p-6 flex justify-between items-center">
          <div className="text-4xl">{getCategoryIcon(product.category)}</div>
          <button
            onClick={onClose}
            className="text-white text-3xl hover:opacity-80 transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Product Title */}
          <h2 className="text-3xl font-bold text-white mb-2">{product.productName}</h2>
          
          {/* Seller Info */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-700">
            <span className="text-2xl">👨‍🌾</span>
            <div>
              <p className="text-sm text-slate-400">Seller</p>
              <p className="font-semibold text-white">{product.sellerFullName}</p>
            </div>
          </div>

          {/* Price */}
          <div className="bg-orange-900/40 rounded-lg p-4 mb-6">
            <p className="text-slate-300 text-sm mb-1">Price per unit</p>
            {product.discountPercentage && product.discountPercentage > 0 ? (
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-4xl font-bold text-orange-600">
                    ₹{product.discountedPrice ? product.discountedPrice.toFixed(2) : (product.price - (product.price * product.discountPercentage / 100)).toFixed(2)}
                  </p>
                  <span className="line-through text-gray-400 text-xl">₹{product.price.toFixed(2)}</span>
                </div>
                <span className="bg-green-500 text-white text-sm font-bold px-3 py-1 rounded">
                  🏷️ {product.discountPercentage}% OFF
                </span>
              </div>
            ) : (
              <p className="text-4xl font-bold text-orange-600">₹{product.price.toFixed(2)}</p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">About this product</h3>
              <p className="text-slate-300 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Category */}
          <div className="mb-6">
            <p className="text-sm text-slate-400 mb-1">Category</p>
            <div className="inline-block bg-orange-900/50 text-orange-400 px-4 py-2 rounded-full font-semibold">
              {product.category}
            </div>
          </div>

          {/* Stock Status */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold text-slate-300">Stock Status</p>
              <p className={`font-bold ${product.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of Stock'}
              </p>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${product.quantity > 5 ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${Math.min(inStockPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Quantity Selector */}
          {!isOutOfStock && (
            <div className="mb-8">
              <label className="text-lg font-semibold text-white mb-3 block">
                How many would you like?
              </label>
              <div className="flex items-center gap-4 bg-slate-700 rounded-lg w-fit p-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-slate-600 hover:bg-slate-500 text-white font-bold text-xl px-4 py-2 rounded transition"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    setQuantity(Math.min(Math.max(1, value), product.quantity))
                  }}
                  className="w-20 text-center text-xl font-bold bg-transparent text-white border-none outline-none"
                  min="1"
                  max={product.quantity}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))}
                  className="bg-slate-600 hover:bg-slate-500 text-white font-bold text-xl px-4 py-2 rounded transition"
                >
                  +
                </button>
              </div>
              <p className="text-sm text-slate-400 mt-2">Max available: {product.quantity} units</p>
            </div>
          )}

          {/* Price Summary */}
          <div className="bg-gradient-to-r from-orange-900/40 to-amber-900/40 rounded-lg p-4 mb-8 border-2 border-orange-800">
            <p className="text-slate-300 mb-1">Total for {quantity} item(s):</p>
            {product.discountPercentage && product.discountPercentage > 0 ? (
              <div>
                <p className="text-3xl font-bold text-orange-600">
                  ₹{((product.discountedPrice || (product.price - (product.price * product.discountPercentage / 100))) * quantity).toFixed(2)}
                </p>
                <p className="text-sm text-green-600 font-semibold mt-1">
                  You save ₹{((product.price - (product.discountedPrice || (product.price - (product.price * product.discountPercentage / 100)))) * quantity).toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-3xl font-bold text-orange-600">₹{(product.price * quantity).toFixed(2)}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition text-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock || adding}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition text-lg flex items-center justify-center gap-2"
            >
              {adding ? (
                <>
                  <span className="animate-spin">⏳</span> Adding...
                </>
              ) : (
                <>
                  🛒 Add to Cart
                </>
              )}
            </button>
          </div>

          {isOutOfStock && (
            <p className="text-center text-red-600 font-semibold mt-4">
              ⚠️ This product is currently out of stock
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductModal
