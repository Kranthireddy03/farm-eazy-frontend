/**
 * Buying Page Component
 * 
 * Marketplace for buying agricultural products
 * Features:
 * - Product browsing with categories
 * - Search functionality
 * - Filter by category
 * - View product details
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useToast } from '../hooks/useToast'
import { sendNotification } from '../components/NotificationCenter'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import ProductModal from '../components/ProductModal'

function Buying() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isDark } = useTheme()
  const { getUserId, getUserEmail } = useAuth()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [revealedContacts, setRevealedContacts] = useState({})
  const [showCartPrompt, setShowCartPrompt] = useState(false)
  const [lastAddedProduct, setLastAddedProduct] = useState(null)

  const categories = [
    { value: 'ALL', label: 'All Products', icon: '🛒' },
    { value: 'SEEDS', label: 'Seeds', icon: '🌱' },
    { value: 'FERTILIZERS', label: 'Fertilizers', icon: '🧪' },
    { value: 'PESTICIDES', label: 'Pesticides', icon: '🦟' },
    { value: 'TOOLS', label: 'Tools', icon: '🔧' },
    { value: 'EQUIPMENT', label: 'Equipment', icon: '🚜' },
    { value: 'ORGANIC', label: 'Organic', icon: '🌿' },
    { value: 'OTHERS', label: 'Others', icon: '📦' }
  ]

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchTerm, selectedCategory])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/products')
      setProducts(response.data)
    } catch (error) {
      showToast('Failed to load products', 'error')
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products
    
    // Filter out the current user's own products
    const currentUserId = getUserId()
    const currentUserEmail = getUserEmail()
    if (currentUserId || currentUserEmail) {
      filtered = filtered.filter(product => {
        // Check both sellerId and sellerEmail to be safe
        const isOwnProduct = 
          (currentUserId && product.sellerId && product.sellerId.toString() === currentUserId.toString()) ||
          (currentUserEmail && product.sellerEmail && product.sellerEmail.toLowerCase() === currentUserEmail.toLowerCase())
        return !isOwnProduct
      })
    }

    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sellerFullName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProducts(filtered)
  }

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category)
    return cat ? cat.icon : '📦'
  }

  const handleAddToCart = (cartItem) => {
    // Get existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem('farmeazy_cart') || '[]')
    
    // Check if product already in cart
    const existingItemIndex = existingCart.findIndex(item => item.id === cartItem.id)
    
    if (existingItemIndex > -1) {
      // Product already in cart - update quantity
      const maxQuantity = cartItem.availableQuantity
      const newQuantity = existingCart[existingItemIndex].quantity + cartItem.quantity
      
      if (newQuantity > maxQuantity) {
        showToast(`Cannot add more than ${maxQuantity} items of this product`, 'warning')
        existingCart[existingItemIndex].quantity = maxQuantity
      } else {
        existingCart[existingItemIndex].quantity = newQuantity
      }
    } else {
      // New product - add to cart
      existingCart.push(cartItem)
    }
    
    // Save updated cart to localStorage
    localStorage.setItem('farmeazy_cart', JSON.stringify(existingCart))
    // Emit event to update cart count in header
    window.dispatchEvent(new Event('cart-updated'))
    sendNotification(`${cartItem.productName} added to cart!`, 'info', '🛒')
    
    // Show cart prompt modal
    setLastAddedProduct(cartItem)
    setShowCartPrompt(true)
    setShowModal(false) // Close product modal if open
  }

  const handleProductClick = (product) => {
    setSelectedProduct(product)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedProduct(null)
  }

  const handleRevealContact = (productId, type) => {
    setRevealedContacts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [type]: true
      }
    }))
  }

  const handleViewDetails = (productId, openInNewTab = false) => {
    const url = `/product/${productId}`
    if (openInNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    navigate(url)
  }

  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛒</div>
          <h1 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Buying Center</h1>
          <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            Browse quality agricultural products from verified sellers
          </p>
        </div>

        {/* Search and Filter */}
        <div className={`rounded-lg shadow-lg p-6 mb-8 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products, sellers..."
                  className={`w-full pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent border ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-slate-800 placeholder-gray-400'}`}
                />
                <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
              </div>
            </div>

            {/* Category Filter */}
            <div className="md:w-64">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-orange-500 focus:border-transparent ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className={`mt-4 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            Showing {filteredProducts.length} of {products.length} products
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className={`mt-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Loading products...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProducts.length === 0 && (
          <div className={`rounded-lg shadow-lg p-12 text-center border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="text-6xl mb-4">📦</div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>No Products Found</h2>
            <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
              {products.length === 0
                ? 'No products are available yet. Be the first to list a product!'
                : 'Try adjusting your search or filters'}
            </p>
            {products.length === 0 && (
              <button
                onClick={() => navigate('/selling')}
                className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
              >
                List a Product
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!loading && filteredProducts.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className={`rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
                >
                  {/* Product Image */}
                  <div
                    className={`relative h-48 cursor-pointer ${isDark ? 'bg-gradient-to-br from-slate-700 to-slate-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}
                    onClick={() => handleViewDetails(product.id)}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-6xl">
                        {getCategoryIcon(product.category)}
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-semibold ${isDark ? 'bg-slate-900/80 text-white' : 'bg-white/90 text-gray-800'}`}>
                      {getCategoryIcon(product.category)} {product.category}
                    </div>
                    {/* Discount Badge */}
                    {product.discountPercentage && product.discountPercentage > 0 && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                        🏷️ {product.discountPercentage}% OFF
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="p-5">
                    <button
                      onClick={() => handleViewDetails(product.id)}
                      className="text-left"
                    >
                      <h3 className={`text-xl font-bold mb-2 hover:text-orange-400 transition ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {product.productName}
                      </h3>
                    </button>
                    
                    <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {product.description}
                    </p>

                    {/* Seller Info */}
                    <div className={`flex items-center gap-2 mb-3 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      <span>👤</span>
                      <span>{product.sellerFullName}</span>
                    </div>

                    {/* Location */}
                    <div className={`flex items-center gap-2 mb-3 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      <span>📍</span>
                      <span>{product.sellerLocation || 'Location not specified'}</span>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Available</p>
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {product.quantity} {product.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Price</p>
                        {product.discountPercentage && product.discountPercentage > 0 ? (
                          <div>
                            <div className="flex items-center justify-end gap-2 mb-1">
                              <span className={`line-through text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>₹{product.price}</span>
                              <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                                {product.discountPercentage}% OFF
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-orange-500">
                              ₹{product.discountedPrice || (product.price - (product.price * product.discountPercentage / 100)).toFixed(2)}
                              <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>/{product.unit}</span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-2xl font-bold text-orange-500">
                            ₹{product.price}
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>/{product.unit}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleProductClick(product)
                        }}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2"
                      >
                        🛒 Add to Cart
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!product.sellerPhone) {
                            showToast('Seller phone not available', 'warning')
                            return
                          }
                          handleRevealContact(product.id, 'phone')
                        }}
                        disabled={!product.sellerPhone}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${product.sellerPhone ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >
                        📞
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!product.sellerEmail) {
                            showToast('Seller email not available', 'warning')
                            return
                          }
                          handleRevealContact(product.id, 'email')
                        }}
                        disabled={!product.sellerEmail}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${product.sellerEmail ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >
                        ✉️
                      </button>
                    </div>

                    {(revealedContacts[product.id]?.phone || revealedContacts[product.id]?.email) && (
                      <div className={`mt-3 text-xs space-y-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        {revealedContacts[product.id]?.phone && product.sellerPhone && (
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">📞</span>
                            <a href={`tel:${product.sellerPhone}`} className="text-green-500 font-semibold hover:underline">
                              {product.sellerPhone}
                            </a>
                          </div>
                        )}
                        {revealedContacts[product.id]?.email && product.sellerEmail && (
                          <div className="flex items-center gap-2">
                            <span className="text-blue-500">✉️</span>
                            <a href={`mailto:${product.sellerEmail}`} className="text-blue-500 font-semibold hover:underline">
                              {product.sellerEmail}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={() => handleViewDetails(product.id, true)}
                      className={`mt-3 w-full px-4 py-2 border rounded-lg font-semibold transition ${isDark ? 'bg-slate-700 border-slate-600 text-orange-400 hover:bg-slate-600' : 'bg-gray-100 border-gray-300 text-orange-500 hover:bg-gray-200'}`}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Product Modal */}
            <ProductModal 
              product={selectedProduct} 
              isOpen={showModal} 
              onClose={handleCloseModal}
              onAddToCart={handleAddToCart}
            />
          </>
        )}

        {/* Cart Prompt Modal */}
        {showCartPrompt && lastAddedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
            <div className={`border-2 border-green-500/50 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-5xl">✅</span>
              </div>
              <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Added to Cart!</h2>
              <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                <p className="text-orange-500 font-semibold text-lg">{lastAddedProduct.productName}</p>
                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  Quantity: {lastAddedProduct.quantity} × ₹{lastAddedProduct.discountedPrice !== undefined ? lastAddedProduct.discountedPrice.toFixed(2) : lastAddedProduct.price.toFixed(2)}
                </p>
              </div>
              <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>What would you like to do next?</p>
              <div className="flex flex-col gap-3">
                <button
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                  onClick={() => {
                    setShowCartPrompt(false)
                    navigate('/cart')
                  }}
                >
                  <span>🛒</span> View Cart & Checkout
                </button>
                <button
                  className={`font-bold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                  onClick={() => setShowCartPrompt(false)}
                >
                  <span>🛍️</span> Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Buying
