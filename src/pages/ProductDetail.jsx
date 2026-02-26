import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ProductService from '../services/ProductService'
import { useToast } from '../hooks/useToast'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-orange-400"></div>
          <p className="mt-4 text-slate-300 text-lg">Loading product details...</p>
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-md p-12 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-white mb-2">Product Not Found</h2>
          <p className="text-slate-400 mb-6">The product you're looking for doesn't exist.</p>
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
    <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Product Image */}
        <div className="relative h-96 md:h-full bg-gradient-to-br from-slate-700 to-slate-600">
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
                      <div className="absolute top-4 right-4 bg-slate-700 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                        {getCategoryIcon(product.category)} {product.category}
                      </div>
                    </div>
                    {/* Product Details */}
                    <div className="p-8">
                      <h1 className="text-4xl font-bold text-white mb-4">{product.productName}</h1>
                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-3">
                          <span className="text-4xl font-bold text-orange-400">₹{product.price}</span>
                          <span className="text-xl text-slate-400">/ {product.unit}</span>
                        </div>
                        {product.discountPercentage > 0 && (
                          <div className="mt-2">
                            <span className="text-green-400 font-semibold text-lg">
                              {product.discountPercentage}% OFF
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Description */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                        <p className="text-slate-300 leading-relaxed">{product.description}</p>
                      </div>
                      {/* Availability */}
                      <div className="mb-6 flex items-center gap-4">
                        <div className="bg-green-900/40 border-2 border-green-700 rounded-lg px-4 py-3">
                          <p className="text-sm text-slate-400">Available Quantity</p>
                          <p className="text-2xl font-bold text-green-400">{product.quantity} {product.unit}</p>
                        </div>
                        {product.weight && (
                          <div className="bg-blue-900/40 border-2 border-blue-700 rounded-lg px-4 py-3">
                            <p className="text-sm text-slate-400">Weight</p>
                            <p className="text-xl font-bold text-blue-400">{product.weight}</p>
                          </div>
                        )}
                      </div>
                      {/* Specifications */}
                      {product.specifications && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-2">Specifications</h3>
                          <p className="text-slate-300">{product.specifications}</p>
                        </div>
                      )}
                      {/* Warranty */}
                      {product.warrantyInfo && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-white mb-2">Warranty Information</h3>
                          <p className="text-slate-300">{product.warrantyInfo}</p>
                        </div>
                      )}
                      {/* Seller Information */}
                      <div className="bg-orange-900/30 border border-orange-700 rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                          <span>👤</span> Seller Information
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">👤</span>
                            <div>
                              <p className="text-sm text-slate-400">Full Name</p>
                              <p className="font-semibold text-white">{product.sellerFullName}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📧</span>
                            <div>
                              <p className="text-sm text-slate-400">Email</p>
                              <p className="font-semibold text-white">{product.sellerEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">📞</span>
                            <div>
                              <p className="text-sm text-slate-400">Phone</p>
                              <p className="font-semibold text-white">{product.sellerPhone}</p>
                            </div>
                          </div>
                          {product.sellerLocation && (
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">📍</span>
                              <div>
                                <p className="text-sm text-slate-400">Location</p>
                                <p className="font-semibold text-white">{product.sellerLocation}</p>
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
                        <div className="mt-4 bg-slate-700 border border-slate-600 rounded-lg p-4 space-y-2">
                          {revealedContact.phone && Boolean(product.sellerPhone) && (
                            <div className="flex items-center gap-2">
                              <span className="text-green-400">📞</span>
                              <a
                                href={`tel:${product.sellerPhone}`}
                                className="text-green-400 font-semibold hover:underline"
                              >
                                {product.sellerPhone}
                              </a>
                            </div>
                          )}
                          {revealedContact.email && Boolean(product.sellerEmail) && (
                            <div className="flex items-center gap-2">
                              <span className="text-orange-400">✉️</span>
                              <a
                                href={`mailto:${product.sellerEmail}?subject=Inquiry about ${product.productName}`}
                                className="text-orange-400 font-semibold hover:underline"
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
                          <h3 className="text-lg font-semibold text-white mb-3">Product Video</h3>
                          {product.videoUrls.split(',').map((url, idx) => (
                            <a
                              key={idx}
                              href={url.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block px-4 py-3 bg-blue-900/40 text-blue-400 rounded-lg font-semibold hover:bg-blue-900/60 transition-colors mb-2"
                            >
                              🎥 Watch Product Video {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}
                      {/* Add to Cart Button */}
                      <button
                        className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-all"
                        onClick={handleAddToCart}
                        disabled={product.status === 'OUT_OF_STOCK' || product.status === 'DISCONTINUED' || product.quantity <= 0}
                      >
                        {product.status === 'OUT_OF_STOCK' || product.quantity <= 0 ? 'Out of Stock' : product.status === 'DISCONTINUED' ? 'Discontinued' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                  {/* Additional Images */}
                  {product.imageUrls && product.imageUrls.split(',').length > 1 && (
                    <div className="mt-8 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-6">
                      <h3 className="text-2xl font-bold text-white mb-4">More Images</h3>
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
                  {/* Cart Prompt Modal */}
                  {showCartPrompt && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
                      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                        <div className="text-5xl mb-4">🛒</div>
                        <h2 className="text-2xl font-bold text-white mb-2">Product Added to Cart!</h2>
                        <p className="text-slate-400 mb-6">Would you like to review your cart or continue shopping?</p>
                        <div className="flex gap-4 justify-center">
                          <button
                            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition"
                            onClick={() => {
                              setShowCartPrompt(false);
                              navigate('/cart');
                            }}
                          >Go to Cart</button>
                          <button
                            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition"
                            onClick={() => setShowCartPrompt(false)}
                          >Continue Shopping</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
        }

      export default ProductDetail;
