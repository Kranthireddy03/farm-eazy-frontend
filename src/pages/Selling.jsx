import React, { useState, useEffect } from 'react';
import { formatDate } from '../utils/formatDate';
import { useNavigate } from 'react-router-dom';
import OtpService from '../services/OtpService';
import ProductService from '../services/ProductService';
import { useGlobalToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function Selling() {
  const navigate = useNavigate();
  const { showToast, showOtpNotification } = useGlobalToast();
  const { isDark } = useTheme();
  const { getUserEmail, isAuthenticated, updateActivity } = useAuth();
  const [currentStep, setCurrentStep] = useState(2); // Skip OTP step
  const [otpVerified, setOtpVerified] = useState(true); // Already verified (OTP disabled)
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [myProducts, setMyProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // For edit mode
  
  // Use AuthContext for user email instead of direct localStorage access
  const userEmail = getUserEmail();
  
  const [formData, setFormData] = useState({
    productName: '',
    category: '',
    description: '',
    price: '',
    discountPercentage: 0,
    quantity: '',
    unit: '',
    weight: '',
    specifications: '',
    warrantyInfo: '',
    imageUrls: '',
    videoUrls: '',
    contactEmail: '',
    contactPhone: ''
  });

  const categories = [
    { value: 'seeds', label: '🌱 Seeds', color: 'from-green-400 to-green-600' },
    { value: 'fertilizers', label: '🌿 Fertilizers', color: 'from-emerald-400 to-emerald-600' },
    { value: 'pesticides', label: '🛡️ Pesticides', color: 'from-teal-400 to-teal-600' },
    { value: 'tools', label: '🔧 Tools', color: 'from-blue-400 to-blue-600' },
    { value: 'machinery', label: '🚜 Machinery', color: 'from-indigo-400 to-indigo-600' },
    { value: 'irrigation', label: '💧 Irrigation', color: 'from-cyan-400 to-cyan-600' },
    { value: 'produce', label: '🥕 Fresh Produce', color: 'from-orange-400 to-orange-600' },
    { value: 'others', label: '📦 Others', color: 'from-gray-400 to-gray-600' }
  ];

  useEffect(() => {
    fetchMyProducts();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const fetchMyProducts = async () => {
    try {
      const products = await ProductService.getMyProducts();
      setMyProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      // Use detailed OTP endpoint for SMS notification support
      const response = await OtpService.sendOtpDetailed(userEmail, 'SELLING');
      setOtpSent(true);
      setTimer(600); // 10 minutes
      // Show notification with SMS status
      showOtpNotification(response);
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otpCode];
      newOtp[index] = value;
      setOtpCode(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`).focus();
      }
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) {
      showToast('Please enter complete OTP', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await OtpService.verifyOtp(userEmail, code, 'SELLING');
      setOtpVerified(true);
      setCurrentStep(2);
      showToast('OTP verified successfully!', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Invalid OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Allow all input - validation happens on submit
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName || '',
      category: product.category || '',
      description: product.description || '',
      price: product.price || '',
      discountPercentage: product.discountPercentage || 0,
      quantity: product.quantity || '',
      unit: product.unit || '',
      weight: product.weight || '',
      specifications: product.specifications || '',
      warrantyInfo: product.warrantyInfo || '',
      imageUrls: product.imageUrls || '',
      videoUrls: product.videoUrls || '',
      contactEmail: product.contactEmail || '',
      contactPhone: product.contactPhone || ''
    });
    setCurrentStep(2); // Start at Basic step
    setShowForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await ProductService.deleteProduct(productId);
      showToast('Product deleted successfully!', 'success');
      fetchMyProducts(); // Refresh the list
    } catch (error) {
      console.error('Error deleting product:', error);
      showToast(error.response?.data?.message || 'Failed to delete product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      showToast('Please verify OTP first', 'error');
      return;
    }
    // Prevent listing products with zero or negative quantity
    if (!formData.quantity || parseInt(formData.quantity, 10) <= 0) {
      showToast('Quantity must be greater than zero', 'error');
      return;
    }
    setLoading(true);
    try {
      if (editingProduct) {
        // Update existing product
        await ProductService.updateProduct(editingProduct.id, formData);
        showToast('Product updated successfully!', 'success');
      } else {
        // Create new product
        await ProductService.createProduct(formData);
        showToast('Product listed successfully!', 'success');
      }
      setShowForm(false);
      setCurrentStep(2); // Reset to Basic step (OTP removed)
      setEditingProduct(null);
      setFormData({
        productName: '',
        category: '',
        description: '',
        price: '',
        discountPercentage: 0,
        quantity: '',
        unit: '',
        weight: '',
        specifications: '',
        warrantyInfo: '',
        imageUrls: '',
        videoUrls: '',
        contactEmail: '',
        contactPhone: ''
      });
      fetchMyProducts();
    } catch (error) {
      showToast(error.response?.data?.message || (editingProduct ? 'Failed to update product' : 'Failed to create product'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const discountedPrice = formData.price && formData.discountPercentage > 0
    ? (formData.price - (formData.price * formData.discountPercentage / 100)).toFixed(2)
    : formData.price;

  if (showForm) {
    return (
      <div className={`min-h-screen py-8 ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className={`rounded-2xl shadow-lg p-6 mb-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingProduct(null);
                setFormData({
                  productName: '',
                  category: '',
                  description: '',
                  price: '',
                  discountPercentage: 0,
                  quantity: '',
                  unit: '',
                  weight: '',
                  specifications: '',
                  warrantyInfo: '',
                  imageUrls: '',
                  videoUrls: '',
                  contactEmail: '',
                  contactPhone: ''
                });
              }}
              className={`flex items-center gap-2 font-medium transition-colors mb-4 ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
            >
              ← Back to Products
            </button>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {editingProduct ? '✏️ Edit Product' : '➕ List New Product'}
            </h1>
          </div>

          {/* Progress Steps - OTP removed, steps 2-6 shown as 1-5 */}
          <div className={`rounded-2xl shadow-lg p-6 mb-6 border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
              {[2, 3, 4, 5, 6].map((step, idx) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep >= step 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                        : isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step ? '✓' : idx + 1}
                    </div>
                    <span className={`text-xs mt-1 hidden sm:block ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                      {step === 2 && 'Basic'}
                      {step === 3 && 'Pricing'}
                      {step === 4 && 'Stock'}
                      {step === 5 && 'Details'}
                      {step === 6 && 'Media'}
                    </span>
                  </div>
                  {step < 6 && (
                    <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                      currentStep > step ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : isDark ? 'bg-slate-700' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: OTP Verification */}
            {currentStep === 1 && (
              <div className={`rounded-2xl shadow-lg p-8 animate-fadeIn border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  🔐 Verify Your Email
                </h2>
                <p className={`mb-6 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>Enter the 6-digit OTP sent to {userEmail}</p>
                
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                ) : (
                  <>
                    <div className="flex gap-3 justify-center mb-6">
                      {otpCode.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength="1"
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                        />
                      ))}
                    </div>
                    
                    {timer > 0 && (
                      <p className={`text-center mb-4 ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                        Time remaining: <span className="font-bold text-blue-500">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
                      </p>
                    )}
                    
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={loading || otpCode.join('').length !== 6}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 mb-3"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading || timer > 0}
                      className="w-full text-blue-500 py-2 font-medium hover:underline disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Basic Info */}
            {currentStep === 2 && (
              <div className={`rounded-2xl shadow-lg p-8 animate-fadeIn border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>📝 Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Product Name *</label>
                    <input
                      type="text"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                      placeholder="e.g., Organic Tomato Seeds"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Category *</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {categories.map(cat => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                          className={`p-4 rounded-xl font-semibold text-sm transition-all ${
                            formData.category === cat.value
                              ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-105`
                              : isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                      placeholder="Describe your product..."
                    />
                    <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>{formData.description.length} characters</p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  disabled={!formData.productName || !formData.category}
                  className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  Next: Pricing →
                </button>
              </div>
            )}

            {/* Step 3: Pricing */}
            {currentStep === 3 && (
              <div className={`rounded-2xl shadow-lg p-8 animate-fadeIn border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>💰 Pricing</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Discount: {formData.discountPercentage}%
                    </label>
                    <input
                      type="range"
                      name="discountPercentage"
                      value={formData.discountPercentage}
                      onChange={handleInputChange}
                      min="0"
                      max="50"
                      className="w-full h-3 bg-gradient-to-r from-blue-200 to-indigo-400 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className={`flex justify-between text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                    </div>
                  </div>
                  
                  {formData.price && (
                    <div className={`p-6 rounded-xl border-2 ${isDark ? 'bg-green-900/30 border-green-700' : 'bg-green-50 border-green-300'}`}>
                      <h3 className={`font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Price Preview</h3>
                      <div className="flex items-center gap-4">
                        {formData.discountPercentage > 0 && (
                          <span className={`text-2xl line-through ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>₹{formData.price}</span>
                        )}
                        <span className="text-3xl font-bold text-green-500">₹{discountedPrice}</span>
                        {formData.discountPercentage > 0 && (
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {formData.discountPercentage}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className={`flex-1 border-2 py-4 rounded-xl font-semibold transition-all ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    disabled={!formData.price}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    Next: Stock →
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Stock/Inventory */}
            {currentStep === 4 && (
              <div className={`rounded-2xl shadow-lg p-8 animate-fadeIn border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>📦 Inventory</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Quantity *</label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Unit *</label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
                      >
                        <option value="">Select...</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="g">Gram (g)</option>
                        <option value="l">Liter (l)</option>
                        <option value="ml">Milliliter (ml)</option>
                        <option value="piece">Piece</option>
                        <option value="pack">Pack</option>
                        <option value="bag">Bag</option>
                        <option value="box">Box</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Weight/Size (optional)</label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                      placeholder="e.g., 1kg, 500g, 2L"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className={`flex-1 border-2 py-4 rounded-xl font-semibold transition-all ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    disabled={!formData.quantity || !formData.unit}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    Next: Details →
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Additional Details */}
            {currentStep === 5 && (
              <div className={`rounded-2xl shadow-lg p-8 animate-fadeIn border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>📋 Additional Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Specifications</label>
                    <textarea
                      name="specifications"
                      value={formData.specifications}
                      onChange={handleInputChange}
                      rows="3"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                      placeholder="Technical specifications, ingredients, etc."
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Warranty Information</label>
                    <input
                      type="text"
                      name="warrantyInfo"
                      value={formData.warrantyInfo}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                      placeholder="e.g., 1 year manufacturer warranty"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Contact Email *</label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      required
                      pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Contact Phone *</label>
                    <input
                      type="text"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      required
                      pattern="^[0-9]{10}$"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                      placeholder="10-digit phone number"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className={`flex-1 border-2 py-4 rounded-xl font-semibold transition-all ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(6)}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Next: Media →
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Media */}
            {currentStep === 6 && (
              <div className={`rounded-2xl shadow-lg p-8 animate-fadeIn border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>📸 Media</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Image URLs (comma-separated)</label>
                    <textarea
                      name="imageUrls"
                      value={formData.imageUrls}
                      onChange={handleInputChange}
                      rows="3"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    />
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>Separate multiple URLs with commas</p>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Video URLs (comma-separated)</label>
                    <textarea
                      name="videoUrls"
                      value={formData.videoUrls}
                      onChange={handleInputChange}
                      rows="2"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all ${isDark ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className={`flex-1 border-2 py-4 rounded-xl font-semibold transition-all ${isDark ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (editingProduct ? 'Updating...' : 'Publishing...') : (editingProduct ? '💾 Update Product' : '✨ Publish Product')}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50'}`}>
      {/* Header */}
      <div className={`border-b shadow-md ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-2 font-medium transition-colors ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
          >
            ← Back to Home
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            ➕ List New Product
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className={`text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>My Products</h1>
        
        {myProducts.length === 0 ? (
          <div className={`rounded-2xl p-12 text-center shadow-lg border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <div className="text-6xl mb-4">📦</div>
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>No products yet</h2>
            <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Start listing your products to reach buyers</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              List Your First Product
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProducts.map(product => (
              <div key={product.id} className={`rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                <div className={`h-48 flex items-center justify-center ${isDark ? 'bg-gradient-to-r from-slate-700 to-slate-600' : 'bg-gradient-to-r from-emerald-100 to-teal-100'}`}>
                  <span className="text-6xl">📦</span>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{product.productName}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      product.status === 'ACTIVE' ? (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600') :
                      product.status === 'OUT_OF_STOCK' ? (isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600') :
                      (isDark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-600')
                    }`}>
                      {product.status}
                    </span>
                  </div>
                  <p className={`text-sm mb-4 capitalize ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{product.category}</p>
                  <div className="flex items-center gap-3 mb-4">
                    {product.discountPercentage > 0 && (
                      <span className={`text-lg line-through ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>₹{product.price}</span>
                    )}
                    <span className="text-2xl font-bold text-green-400">₹{product.discountedPrice}</span>
                    {product.discountPercentage > 0 && (
                      <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        {product.discountPercentage}% OFF
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    Stock: <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{product.quantity} {product.unit}</span>
                  </p>
                  <div className={`text-xs mb-4 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    Listed {formatDate(product.createdAt)}
                  </div>
                  {/* Edit & Delete Actions */}
                  <div className={`flex gap-2 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    <button
                      onClick={() => handleEditProduct(product)}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-1 ${
                        isDark 
                          ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/40' 
                          : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      }`}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-1 ${
                        isDark 
                          ? 'bg-red-600/20 text-red-400 hover:bg-red-600/40' 
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Selling;
