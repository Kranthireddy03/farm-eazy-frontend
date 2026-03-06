import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ProductService from '../services/ProductService'
import { useToast } from '../hooks/useToast'
import { sendNotification } from '../components/NotificationCenter'
import { useTheme } from '../context/ThemeContext'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isDark } = useTheme()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCartPrompt, setShowCartPrompt] = useState(false)
  const [revealedContact, setRevealedContact] = useState({ phone: false, email: false })
  const [addingToCart, setAddingToCart] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const response = await ProductService.getProduct(id)
        setProduct(response.data)
      } catch (error) {
        console.error('Failed to fetch product:', error)
        showToast('Failed to load product details', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const getCategoryIcon = (category) => {
    const icons = {
      'Vegetables': '🥬',
      'Fruits': '🍎',
      'Grains': '🌾',
      'Dairy': '🥛',
      'Seeds': '🌱',
      'Fertilizers': '🧪',
      'Equipment': '🔧',
      'Tools': '⚒️',
      'Organic': '🌿'
    }
    return icons[category] || '📦'
  }

  const handleAddToCart = () => {
    if (!product) return
    setAddingToCart(true)
    
    try {
      // Get existing cart from localStorage
      const existingCart = JSON.parse(localStorage.getItem('farmeazy_cart') || '[]')
      
      // Check if product already in cart
      const existingItemIndex = existingCart.findIndex(item => item.id === product.id)
      
      if (existingItemIndex !== -1) {
        // Update quantity
        existingCart[existingItemIndex].quantity += 1
        showToast(`${product.productName} quantity updated in cart`, 'success')
      } else {
        // Add new item
        const cartItem = {
          id: product.id,
          productName: product.productName,
          price: product.price,
          discountedPrice: product.discountPercentage > 0 
            ? product.price * (1 - product.discountPercentage / 100) 
            : null,
          unit: product.unit,
          quantity: 1,
          imageUrl: product.imageUrls ? product.imageUrls.split(',')[0] : null,
          category: product.category,
          sellerName: product.sellerFullName,
          maxQuantity: product.quantity
        }
        existingCart.push(cartItem)
        showToast(`${product.productName} added to cart`, 'success')
      }
      
      localStorage.setItem('farmeazy_cart', JSON.stringify(existingCart))
      
      // Dispatch event to update cart count in header
      window.dispatchEvent(new CustomEvent('cart-updated'))
      
      // Send notification
      sendNotification(`${product.productName} added to cart`, 'success', '🛒')
      
      // Show cart prompt modal
      setShowCartPrompt(true)
    } catch (error) {
      console.error('Failed to add to cart:', error)
      showToast('Failed to add product to cart', 'error')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-orange-400"></div>
          <p className={`mt-4 text-lg ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Loading product details...</p>
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
        <div className={`rounded-lg shadow-md p-12 text-center max-w-md border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <div className="text-6xl mb-4">❌</div>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Product Not Found</h2>
          <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/buying')}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            ← Back to Marketplace
          </button>
        </div>
      </div>
    );
  }
  // ...existing main product JSX...
  return (
    <div className={`min-h-screen py-8 px-4 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/buying')}
          className={`mb-6 flex items-center gap-2 font-semibold transition-colors ${isDark ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-500'}`}
        >
          ← Back to Marketplace
        </button>
        
        <div className={`rounded-lg shadow-xl overflow-hidden border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
      <div className="grid md:grid-cols-2 gap-0">
        {/* Product Image */}
        <div className={`relative h-96 md:h-full ${isDark ? 'bg-gradient-to-br from-slate-700 to-slate-600' : 'bg-gradient-to-br from-gray-100 to-gray-200'}`}>
                      {product.imageUrls ? (
                        <img
                          src={product.imageUrls.split(',')[0]}
                          alt={product.productName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-9xl">{getCategoryIcon(product.category)}</div>
                        </div>
                      )}
                      {/* Category Badge */}
                      <div className={`absolute top-4 right-4 px-4 py-2 rounded-full font-semibold shadow-lg ${isDark ? 'bg-slate-700 text-white' : 'bg-white/90 text-gray-800'}`}>
                        {getCategoryIcon(product.category)} {product.category}
                      </div>
                    </div>
                    {/* Product Details */}
                    <div className="p-8">
                      <h1 className={`text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>{product.productName}</h1>
                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-3">
                          <span className="text-4xl font-bold text-orange-500">₹{product.price}</span>
                          <span className={`text-xl ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>/ {product.unit}</span>
                        </div>
                        {product.discountPercentage > 0 && (
                          <div className="mt-2">
                            <span className="text-green-500 font-semibold text-lg">
                              {product.discountPercentage}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Description */}
                      <div className="mb-6">
                        <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Description</h3>
                        <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{product.description}</p>
                      </div>
                      {/* Availability */}
                      <div className="mb-6 flex items-center gap-4">
                        <div className={`rounded-lg px-4 py-3 border-2 ${isDark ? 'bg-green-900/40 border-green-700' : 'bg-green-50 border-green-300'}`}>
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Available Quantity</p>
                          <p className="text-2xl font-bold text-green-500">{product.quantity} {product.unit}</p>
                        </div>
                        {product.weight && (
                          <div className={`rounded-lg px-4 py-3 border-2 ${isDark ? 'bg-blue-900/40 border-blue-700' : 'bg-blue-50 border-blue-300'}`}>
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Weight</p>
                            <p className="text-xl font-bold text-blue-500">{product.weight}</p>
                          </div>
                        )}
                      </div>
                      {/* Specifications */}
                      {product.specifications && (
                        <div className="mb-6">
                          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Specifications</h3>
                          <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>{product.specifications}</p>
                        </div>
                      )}
                      {/* Warranty */}
                      {product.warrantyInfo && (
                        <div className="mb-6">
                          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Warranty Information</h3>
                          <p className={isDark ? 'text-slate-300' : 'text-gray-600'}>{product.warrantyInfo}</p>
                        </div>
                      )}
                      {/* Seller Information */}
                      <div className={`rounded-lg p-6 mb-6 border ${isDark ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-300'}`}>
                        <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          <span>👤</span> Seller Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">👤</span>
                            <div>
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Full Name</p>
                              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{product.sellerFullName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📧</span>
                            <div>
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Email</p>
                              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{product.sellerEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📞</span>
                            <div>
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Phone</p>
                              <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{product.sellerPhone}</p>
                            </div>
                          </div>
                          {product.sellerLocation && (
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">📍</span>
                              <div>
                                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Location</p>
                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{product.sellerLocation}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Contact Actions */}
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => {
                            if (!Boolean(product.sellerPhone)) {
                              showToast('Seller phone not available', 'warning');
                              return;
                            }
                            setRevealedContact(prev => ({ ...prev, phone: true }));
                          }}
                          disabled={!Boolean(product.sellerPhone)}
                          className={`px-6 py-4 rounded-lg font-bold transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${Boolean(product.sellerPhone) ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                          <span className="text-2xl">📞</span>
                          Call Seller
                        </button>
                        <button
                          onClick={() => {
                            if (!Boolean(product.sellerEmail)) {
                              showToast('Seller email not available', 'warning');
                              return;
                            }
                            setRevealedContact(prev => ({ ...prev, email: true }));
                          }}
                          disabled={!Boolean(product.sellerEmail)}
                          className={`px-6 py-4 rounded-lg font-bold transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${Boolean(product.sellerEmail) ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                        >
                          <span className="text-2xl">✉️</span>
                          Email Seller
                        </button>
                      </div>
                      {(revealedContact.phone || revealedContact.email) && (
                        <div className={`mt-4 rounded-lg p-4 space-y-2 border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-100 border-gray-300'}`}>
                          {revealedContact.phone && Boolean(product.sellerPhone) && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-500">📞</span>
                              <a
                                href={`tel:${product.sellerPhone}`}
                                className="text-green-500 font-semibold hover:underline"
                              >
                                {product.sellerPhone}
                              </a>
                            </div>
                          )}
                          {revealedContact.email && Boolean(product.sellerEmail) && (
                            <div className="flex items-center gap-2">
                              <span className="text-orange-500">✉️</span>
                              <a
                                href={`mailto:${product.sellerEmail}?subject=Inquiry about ${product.productName}`}
                                className="text-orange-500 font-semibold hover:underline"
                              >
                                {product.sellerEmail}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                      {/* Video Links */}
                      {product.videoUrls && (
                        <div className="mt-6">
                          <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>Product Video</h3>
                          {product.videoUrls.split(',').map((url, idx) => (
                            <a
                              key={idx}
                              href={url.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block px-4 py-3 rounded-lg font-semibold transition-colors mb-2 ${isDark ? 'bg-blue-900/40 text-blue-400 hover:bg-blue-900/60' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                            >
                              🎥 Watch Product Video {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                      {/* Add to Cart Button */}
                      <button
                        className={`mt-6 w-full px-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                          product.status === 'OUT_OF_STOCK' || product.status === 'DISCONTINUED' || product.quantity <= 0
                            ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            : addingToCart
                            ? 'bg-green-600 text-white cursor-wait'
                            : 'bg-green-500 text-white hover:bg-green-600 hover:scale-[1.02] shadow-lg hover:shadow-xl'
                        }`}
                        onClick={handleAddToCart}
                        disabled={product.status === 'OUT_OF_STOCK' || product.status === 'DISCONTINUED' || product.quantity <= 0 || addingToCart}
                      >
                        {addingToCart ? (
                          <>
                            <span className="animate-spin">⏳</span>
                            Adding...
                          </>
                        ) : product.status === 'OUT_OF_STOCK' || product.quantity <= 0 ? (
                          <>❌ Out of Stock</>
                        ) : product.status === 'DISCONTINUED' ? (
                          <>🚫 Discontinued</>
                        ) : (
                          <>🛒 Add to Cart</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                  {/* Additional Images */}
                  {product.imageUrls && product.imageUrls.split(',').length > 1 && (
                    <div className={`mt-8 rounded-lg shadow-xl p-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                      <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>More Images</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {product.imageUrls.split(',').slice(1).map((url, idx) => (
                          <img
                            key={idx}
                            src={url.trim()}
                            alt={`${product.productName} ${idx + 2}`}
                            className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
      </div>
                  {/* Cart Prompt Modal */}
                  {showCartPrompt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
                      <div className={`border-2 border-green-500/50 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform animate-pulse-once ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-5xl">✅</span>
                        </div>
                        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Added to Cart!</h2>
                        <div className={`rounded-lg p-4 mb-6 ${isDark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
                          <p className="text-orange-500 font-semibold text-lg">{product?.productName}</p>
                          <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            ₹{product?.discountPercentage > 0 
                              ? (product.price * (1 - product.discountPercentage / 100)).toFixed(2) 
                              : product?.price} / {product?.unit}
                          </p>
                        </div>
                        <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>What would you like to do next?</p>
                        <div className="flex flex-col gap-3">
                          <button
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                            onClick={() => {
                              setShowCartPrompt(false);
                              navigate('/cart');
                            }}
                          >
                            <span>🛒</span> View Cart & Checkout
                          </button>
                          <button
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                            onClick={() => {
                              setShowCartPrompt(false);
                              handleAddToCart();
                            }}
                          >
                            <span>➕</span> Add One More
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
  );
}

export default ProductDetail;
