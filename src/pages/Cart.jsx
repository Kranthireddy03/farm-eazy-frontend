/**
 * Shopping Cart Page
 * 
 * Displays all products added to cart with:
 * - Product details (name, price, quantity)
 * - Quantity adjustments
 * - Total price calculation
 * - Coins usage checkbox
 * - Checkout button
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { useTheme } from '../context/ThemeContext'
import apiClient from '../services/apiClient'
import ProductService from '../services/ProductService'

function Cart() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isDark } = useTheme()
  
  const [cartItems, setCartItems] = useState([])
  const [coins, setCoins] = useState(0)
  const [useCoins, setUseCoins] = useState(false)
  const [coinsToUse, setCoinsToUse] = useState(0)
  const [loading, setLoading] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)

  // Coin to currency conversion (1 coin = 1 rupee)
  const COIN_VALUE = 1

  useEffect(() => {
    loadCart()
    fetchCoins()
  }, [])

  // Load cart from localStorage
  const loadCart = () => {
    const savedCart = localStorage.getItem('farmeazy_cart')
    if (savedCart) {
      setCartItems(JSON.parse(savedCart))
    }
  }

  // Fetch user coins
  const fetchCoins = async () => {
    try {
      const response = await apiClient.get('/coins')
      setCoins(response.data.totalCoins || 0)
    } catch (error) {
      console.error('Error fetching coins:', error)
      setCoins(0)
    }
  }

  // Save cart to localStorage
  const saveCart = (items) => {
    localStorage.setItem('farmeazy_cart', JSON.stringify(items))
    setCartItems(items)
    // Emit event to update cart count in header
    window.dispatchEvent(new Event('cart-updated'))
  }

  // Update product quantity
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const item = cartItems.find(item => item.id === productId)
    if (item && newQuantity > item.availableQuantity) {
      showToast(`Only ${item.availableQuantity} items available in stock`, 'warning')
      return
    }

    const updatedItems = cartItems.map(item =>
      item.id === productId ? { ...item, quantity: newQuantity } : item
    )
    saveCart(updatedItems)
    showToast('Quantity updated', 'success')
  }

  // Remove item from cart
  const removeFromCart = async (productId) => {
    const updatedItems = cartItems.filter(item => item.id !== productId)
    // Release product quantity in backend
    const item = cartItems.find(item => item.id === productId)
    if (item) {
      try {
        await ProductService.releaseProductQuantity(productId, item.quantity)
      } catch (error) {
        showToast('Failed to release product: ' + (error?.response?.data?.message || error.message), 'error')
      }
    }
    saveCart(updatedItems)
    showToast('Product removed from cart and stock restored', 'success')
  }

  // Calculate totals with discount
  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => {
      const price = item.discountedPrice !== undefined ? item.discountedPrice : item.price;
      return sum + (price * item.quantity);
    }, 0);
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;
    // Calculate savings
    const savings = cartItems.reduce((sum, item) => {
      if (item.discountedPrice !== undefined && item.discountedPrice < item.price) {
        return sum + ((item.price - item.discountedPrice) * item.quantity);
      }
      return sum;
    }, 0);
    return { subtotal, tax, total, savings };
  }

  const { subtotal, tax, total, savings } = calculateTotals();

  // Handle coins checkbox
  const handleUseCoins = (checked) => {
    setUseCoins(checked)
    if (checked) {
      // Use available coins up to total price
      const coinsAvailable = Math.min(coins, Math.floor(total))
      setCoinsToUse(coinsAvailable)
    } else {
      setCoinsToUse(0)
    }
  }

  // Update coins to use
  const updateCoinsToUse = (value) => {
    const coinsValue = Math.min(value, coins, Math.floor(total))
    setCoinsToUse(coinsValue)
  }

  // Final amount after coins
  const finalAmount = Math.max(0, total - (coinsToUse * COIN_VALUE));

  // Proceed to checkout
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showToast('Your cart is empty', 'warning')
      return
    }

    try {
      setCheckingOut(true)
      // Persist coins selection for checkout page
      localStorage.setItem('farmeazy_checkout_coins', JSON.stringify({
        useCoins,
        coinsToUse
      }))

      navigate('/checkout')
    } catch (error) {
      showToast('Failed to place order', 'error')
      console.error('Checkout error:', error)
    } finally {
      setCheckingOut(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Your Cart is Empty</h1>
            <p className={`mb-8 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Start adding products to your cart to place an order</p>
            <button
              onClick={() => navigate('/buying')}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/buying')}
            className="text-orange-400 hover:text-orange-300 font-semibold mb-4 flex items-center gap-2"
          >
            ← Back to Shopping
          </button>
          <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Shopping Cart</div>
          <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>{cartItems.length} item(s) in your cart</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className={`rounded-lg shadow-lg overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              {cartItems.map((item) => (
                <div key={item.id} className={`border-b last:border-b-0 p-6 transition ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex gap-4 mb-4">
                    {/* Product Image */}
                    <div className={`flex-shrink-0 w-24 h-24 rounded-lg flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                      <span className="text-3xl">{item.categoryIcon || '📦'}</span>
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{item.productName}</h3>
                      <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Seller: {item.sellerFullName}</p>
                      {item.discountedPrice !== undefined && item.discountedPrice < item.price ? (
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-orange-400 font-bold text-lg">₹{item.discountedPrice.toFixed(2)}</p>
                            <span className="line-through text-slate-500 text-base">₹{item.price.toFixed(2)}</span>
                            {item.discountPercentage && (
                              <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                                {item.discountPercentage}% OFF
                              </span>
                            )}
                          </div>
                          <p className="text-green-400 text-sm font-semibold">You save ₹{((item.price - item.discountedPrice) * item.quantity).toFixed(2)}</p>
                        </div>
                      ) : (
                        <p className="text-orange-400 font-bold text-lg">₹{item.price.toFixed(2)}</p>
                      )}
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-300 text-2xl"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className={`font-bold px-3 py-1 rounded transition ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className={`w-16 text-center border-2 rounded px-2 py-1 font-semibold ${isDark ? 'border-slate-600 bg-slate-700 text-white' : 'border-gray-300 bg-white text-gray-800'}`}
                        min="1"
                        max={item.availableQuantity}
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className={`font-bold px-3 py-1 rounded transition ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                      >
                        +
                      </button>
                    </div>

                    <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {item.availableQuantity > 0 ? (
                        <span className="text-green-400 font-semibold">{item.availableQuantity} in stock</span>
                      ) : (
                        <span className="text-red-400 font-semibold">Out of stock</span>
                      )}
                    </div>

                    <div className={`ml-auto font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      ₹{((item.discountedPrice !== undefined ? item.discountedPrice : item.price) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className={`rounded-lg shadow-lg p-6 sticky top-20 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>Order Summary</h2>

              {/* Price Breakdown */}
              <div className={`space-y-4 mb-6 border-b pb-6 ${isDark ? 'border-slate-600' : 'border-gray-200'}`}>
                <div className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>₹{subtotal.toFixed(2)}</span>
                  </div>
                </div>
                <div className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                  <div className="flex justify-between">
                    <span>Tax (18% GST):</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>₹{tax.toFixed(2)}</span>
                  </div>
                </div>
                <div className={`flex justify-between text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  <span>Total:</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-green-400 font-semibold">
                    <span>Discount Savings:</span>
                    <span>₹{savings.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Coins Section */}
              <div className={`rounded-lg p-4 mb-6 border ${isDark ? 'bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-700/50' : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300'}`}>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="useCoins"
                    checked={useCoins}
                    onChange={(e) => handleUseCoins(e.target.checked)}
                    className="w-5 h-5 text-orange-500 rounded cursor-pointer"
                  />
                  <label htmlFor="useCoins" className={`font-semibold cursor-pointer flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    <span>🪙 Use Coins</span>
                    <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>({coins} available)</span>
                  </label>
                </div>

                {useCoins && coins > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max={Math.min(coins, Math.floor(total))}
                        value={coinsToUse}
                        onChange={(e) => updateCoinsToUse(parseInt(e.target.value))}
                        className={`flex-1 h-2 rounded-lg appearance-none cursor-pointer ${isDark ? 'bg-orange-800' : 'bg-orange-200'}`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-lg text-orange-500">{coinsToUse} coins = ₹{(coinsToUse * COIN_VALUE).toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Final Amount */}
              <div className={`rounded-lg p-4 mb-6 border ${isDark ? 'bg-orange-900/40 border-orange-700/50' : 'bg-orange-50 border-orange-300'}`}>
                <div className="flex justify-between items-center">
                  <span className={isDark ? 'text-white' : 'text-gray-800'}>Final Amount:</span>
                  <span className="text-3xl font-bold text-orange-500">₹{finalAmount.toFixed(2)}</span>
                </div>
                {coinsToUse > 0 && (
                  <p className="text-sm text-green-500 mt-2">💰 You saved ₹{(coinsToUse * COIN_VALUE).toFixed(2)} with coins!</p>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={checkingOut || cartItems.length === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition text-lg"
              >
                {checkingOut ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Processing...
                  </span>
                ) : (
                  '✓ Proceed to Checkout'
                )}
              </button>

              <button
                onClick={() => navigate('/buying')}
                className={`w-full mt-3 font-bold py-3 px-6 rounded-lg transition ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
