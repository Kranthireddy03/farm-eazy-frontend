import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ProductService from '../services/ProductService'
import { useToast } from '../hooks/useToast'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revealedContact, setRevealedContact] = useState({ phone: false, email: false })

  useEffect(() => {
    fetchProductDetails()
  }, [id])

  const fetchProductDetails = async () => {
    try {
      setLoading(true)
      const data = await ProductService.getProductById(id)
      setProduct(data)
      setRevealedContact({ phone: false, email: false })
    } catch (error) {
      showToast('Failed to load product details', 'error')
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading product details...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-12 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-6">The product you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/buying')}
            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            ← Back to Marketplace
          </button>
        </div>
      </div>
    )
  }

  const hasPhone = Boolean(product.sellerPhone)
  const hasEmail = Boolean(product.sellerEmail)

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/buying')}
          className="mb-6 px-4 py-2 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-md flex items-center gap-2"
        >
          ← Back to Marketplace
        </button>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Product Image */}
            <div className="relative h-96 md:h-full bg-gradient-to-br from-orange-100 to-orange-200">
              {product.imageUrls ? (
                <img
                  src={product.imageUrls.split(',')[0]}
                  alt={product.productName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-9xl">{getCategoryIcon(product.category)}</div>
                </div>
              )}
              {/* Category Badge */}
              <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-full font-semibold shadow-lg">
                {getCategoryIcon(product.category)} {product.category}
              </div>
            </div>

            {/* Product Details */}
            <div className="p-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.productName}</h1>
              
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold text-orange-600">₹{product.price}</span>
                  <span className="text-xl text-gray-600">/ {product.unit}</span>
                </div>
                {product.discountPercentage > 0 && (
                  <div className="mt-2">
                    <span className="text-green-600 font-semibold text-lg">
                      {product.discountPercentage}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Availability */}
              <div className="mb-6 flex items-center gap-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-600">Available Quantity</p>
                  <p className="text-2xl font-bold text-green-600">{product.quantity} {product.unit}</p>
                </div>
                {product.weight && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="text-xl font-bold text-blue-600">{product.weight}</p>
                  </div>
                )}
              </div>

              {/* Specifications */}
              {product.specifications && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Specifications</h3>
                  <p className="text-gray-600">{product.specifications}</p>
                </div>
              )}

              {/* Warranty */}
              {product.warrantyInfo && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Warranty Information</h3>
                  <p className="text-gray-600">{product.warrantyInfo}</p>
                </div>
              )}

              {/* Seller Information */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>👤</span> Seller Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👤</span>
                    <div>
                      <p className="text-sm text-gray-600">Full Name</p>
                      <p className="font-semibold text-gray-800">{product.sellerFullName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-800">{product.sellerEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📞</span>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-semibold text-gray-800">{product.sellerPhone}</p>
                    </div>
                  </div>
                  {product.sellerLocation && (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📍</span>
                      <div>
                        <p className="text-sm text-gray-600">Location</p>
                        <p className="font-semibold text-gray-800">{product.sellerLocation}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    if (!hasPhone) {
                      showToast('Seller phone not available', 'warning')
                      return
                    }
                    setRevealedContact(prev => ({ ...prev, phone: true }))
                  }}
                  disabled={!hasPhone}
                  className={`px-6 py-4 rounded-lg font-bold transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${hasPhone ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  <span className="text-2xl">📞</span>
                  Call Seller
                </button>
                <button
                  onClick={() => {
                    if (!hasEmail) {
                      showToast('Seller email not available', 'warning')
                      return
                    }
                    setRevealedContact(prev => ({ ...prev, email: true }))
                  }}
                  disabled={!hasEmail}
                  className={`px-6 py-4 rounded-lg font-bold transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${hasEmail ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  <span className="text-2xl">✉️</span>
                  Email Seller
                </button>
              </div>

              {(revealedContact.phone || revealedContact.email) && (
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                  {revealedContact.phone && hasPhone && (
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">📞</span>
                      <a
                        href={`tel:${product.sellerPhone}`}
                        className="text-green-700 font-semibold hover:underline"
                      >
                        {product.sellerPhone}
                      </a>
                    </div>
                  )}
                  {revealedContact.email && hasEmail && (
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600">✉️</span>
                      <a
                        href={`mailto:${product.sellerEmail}?subject=Inquiry about ${product.productName}`}
                        className="text-orange-700 font-semibold hover:underline"
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
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Product Video</h3>
                  {product.videoUrls.split(',').map((url, idx) => (
                    <a
                      key={idx}
                      href={url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors mb-2"
                    >
                      🎥 Watch Product Video {idx + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Images */}
        {product.imageUrls && product.imageUrls.split(',').length > 1 && (
          <div className="mt-8 bg-white rounded-lg shadow-xl p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">More Images</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {product.imageUrls.split(',').slice(1).map((url, idx) => (
                <img
                  key={idx}
                  src={url.trim()}
                  alt={`${product.productName} ${idx + 2}`}
                  className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetail
