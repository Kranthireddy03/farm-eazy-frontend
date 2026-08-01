import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import OtpService from '../../services/OtpService';
import ProductService from '../../services/ProductService';
import apiClient from '../../services/apiClient';
import LocationPicker from '../LocationPicker';
import { useGlobalToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import AppPage from '../layout/AppPage';
import { Button } from '../ui/button';

export function SellingProductForm({ editingProduct: initialProduct, onClose, onSuccess }) {
  const navigate = useNavigate();
  const { showToast, showOtpNotification } = useGlobalToast();
  const { getUserEmail, getUserId, getUserName, getUserPhone } = useAuth();
  const [currentStep, setCurrentStep] = useState(2); // Skip OTP step
  const [otpVerified, setOtpVerified] = useState(true); // Already verified (OTP disabled)
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState(initialProduct || null);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const getCaptchaToken = async (action) => {
    if (typeof executeRecaptcha !== 'function') return null;
    try {
      return await executeRecaptcha(action);
    } catch (error) {
      console.warn('reCAPTCHA execution failed:', error);
      return null;
    }
  }
  
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
    deliveryDaysMin: 3,
    deliveryDaysMax: 5,
    weight: '',
    specifications: '',
    warrantyInfo: '',
    imageUrls: '',
    videoUrls: '',
    contactEmail: '',
    contactPhone: '',
    sellerEmail: getUserEmail() || '',
    sellerPhone: getUserPhone() || '',
    vendorId: getUserId() || '',
    vendorName: getUserName() || '',
    vendorLocation: '',
    vendorType: ''
  });
  // Ensure geofence fields are present in formData
  useEffect(() => {
    setFormData(prev => ({
      geofenceLatitude: prev.geofenceLatitude || null,
      geofenceLongitude: prev.geofenceLongitude || null,
      geofenceRadiusKm: prev.geofenceRadiusKm || 5,
      ...prev
    }))
  }, [])

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
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const captchaToken = await getCaptchaToken('selling_otp');
      // Use detailed OTP endpoint for SMS notification support
      const response = await OtpService.sendOtpDetailed(userEmail, 'SELLING', null, captchaToken);
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
    if (!eligibility?.eligible) {
      showToast(eligibility?.verificationMessage || 'Complete vendor verification first.', 'warning');
      navigate(eligibility?.verificationRedirectPath || '/vendor-dashboard');
      return;
    }
    setEditingProduct(product);
    setFormData({
      productName: product.productName || '',
      category: product.category || '',
      description: product.description || '',
      price: product.price || '',
      discountPercentage: product.discountPercentage || 0,
      quantity: product.quantity || '',
      unit: product.unit || '',
      deliveryDaysMin: product.deliveryDaysMin || 3,
      deliveryDaysMax: product.deliveryDaysMax || 5,
      weight: product.weight || '',
      specifications: product.specifications || '',
      warrantyInfo: product.warrantyInfo || '',
      imageUrls: product.imageUrls || '',
      videoUrls: product.videoUrls || '',
      contactEmail: product.contactEmail || '',
      contactPhone: product.contactPhone || '',
      sellerEmail: getUserEmail() || '',
      sellerPhone: getUserPhone() || '',
      vendorId: getUserId() || '',
      vendorName: getUserName() || '',
      vendorLocation: product.vendorLocation || '',
      vendorType: product.vendorType || ''
      ,
      geofenceLatitude: product.geofenceLatitude || null,
      geofenceLongitude: product.geofenceLongitude || null,
      geofenceRadiusKm: product.geofenceRadiusKm || 5
    });
    setCurrentStep(2); // Start at Basic step
    ;
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await ProductService.deleteProduct(productId);
      showToast('Product deleted successfully!', 'success');
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
    const minDays = parseInt(formData.deliveryDaysMin, 10);
    const maxDays = parseInt(formData.deliveryDaysMax, 10);
    if (!Number.isFinite(minDays) || !Number.isFinite(maxDays) || minDays < 1 || maxDays < 1 || minDays > maxDays) {
      showToast('Please enter a valid delivery window (min and max days).', 'error');
      return;
    }

    if (!formData.vendorName || !formData.vendorLocation || !formData.vendorType) {
      showToast('Please complete vendor details before publishing.', 'error');
      setCurrentStep(2);
      return;
    }

    if (!formData.contactEmail || !formData.contactPhone) {
      showToast('Please complete contact details before publishing.', 'error');
      setCurrentStep(5);
      return;
    }

    const publishConsent = window.confirm(
      `Confirm product listing details:\n\nVendor: ${formData.vendorName}\nVendor Location: ${formData.vendorLocation}\nDelivery Window: ${minDays}-${maxDays} days\n\nProceed to publish?`
    );
    if (!publishConsent) {
      return;
    }

    try {
      const eligibilityResponse = await apiClient.get('/vendors/listing-eligibility?listingType=PRODUCT', {
        validateStatus: (status) => status < 500,
      });
      const eligibility = eligibilityResponse?.data || {};
      if (!eligibility.eligible) {
        const firstReason = Array.isArray(eligibility.missingRequirements) && eligibility.missingRequirements.length
          ? eligibility.missingRequirements[0]
          : 'Listing eligibility requirements are not complete.';
        showToast(firstReason, 'warning');
        navigate(eligibility?.verificationRedirectPath || '/vendor-dashboard');
        return;
      }
    } catch (eligibilityError) {
      showToast('Unable to validate listing eligibility right now. Please try again.', 'error');
      return;
    }

    setLoading(true);
    try {
      // Remove imageFiles and videoFiles from payload before sending
      const productPayload = {
        ...formData,
        sellerEmail: getUserEmail() || '',
        sellerPhone: getUserPhone() || '',
        vendorId: getUserId() || '',
        vendorName: getUserName() || '',
      };
      delete productPayload.imageFiles;
      delete productPayload.videoFiles;
      if (editingProduct) {
        await ProductService.updateProduct(editingProduct.id, { ...productPayload, imageFiles: formData.imageFiles, videoFiles: formData.videoFiles });
        showToast('Product updated successfully!', 'success');
      } else {
        await ProductService.createProduct({ ...productPayload, imageFiles: formData.imageFiles, videoFiles: formData.videoFiles });
        showToast('Product listed successfully!', 'success');
      }
      onClose?.();
      setCurrentStep(2);
      setEditingProduct(null);
      setFormData({
        productName: '',
        category: '',
        description: '',
        price: '',
        discountPercentage: 0,
        quantity: '',
        unit: '',
        deliveryDaysMin: 3,
        deliveryDaysMax: 5,
        weight: '',
        specifications: '',
        warrantyInfo: '',
        imageUrls: '',
        videoUrls: '',
        contactEmail: '',
        contactPhone: '',
        sellerEmail: getUserEmail() || '',
        sellerPhone: getUserPhone() || '',
        vendorId: getUserId() || '',
        vendorName: getUserName() || '',
        vendorLocation: '',
        vendorType: ''
        ,
        geofenceLatitude: null,
        geofenceLongitude: null,
        geofenceRadiusKm: 5
      });
    } catch (error) {
      showToast(error.response?.data?.message || (editingProduct ? 'Failed to update product' : 'Failed to create product'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialProduct) {
      setEditingProduct(initialProduct);
      setFormData({
        productName: initialProduct.productName || '',
        category: initialProduct.category || '',
        description: initialProduct.description || '',
        price: initialProduct.price || '',
        discountPercentage: initialProduct.discountPercentage || 0,
        quantity: initialProduct.quantity || '',
        unit: initialProduct.unit || '',
        deliveryDaysMin: initialProduct.deliveryDaysMin || 3,
        deliveryDaysMax: initialProduct.deliveryDaysMax || 5,
        weight: initialProduct.weight || '',
        specifications: initialProduct.specifications || '',
        warrantyInfo: initialProduct.warrantyInfo || '',
        imageUrls: initialProduct.imageUrls || '',
        videoUrls: initialProduct.videoUrls || '',
        contactEmail: initialProduct.contactEmail || '',
        contactPhone: initialProduct.contactPhone || '',
        sellerEmail: getUserEmail() || '',
        sellerPhone: getUserPhone() || '',
        vendorId: getUserId() || '',
        vendorName: getUserName() || '',
        vendorLocation: initialProduct.vendorLocation || '',
        vendorType: initialProduct.vendorType || '',
        geofenceLatitude: initialProduct.geofenceLatitude || null,
        geofenceLongitude: initialProduct.geofenceLongitude || null,
        geofenceRadiusKm: initialProduct.geofenceRadiusKm || 5,
      });
      setCurrentStep(2);
    }
  }, [initialProduct, getUserEmail, getUserId, getUserName, getUserPhone]);

  return (
    <AppPage
      title={editingProduct ? "Edit product" : "List new product"}
      description="Complete each step to publish your listing."
      actions={<Button variant="outline" onClick={onClose}>Back to listings</Button>}
    >
      <div className="max-w-4xl mx-auto space-y-6">
          {/* Progress Steps - OTP removed, steps 2-6 shown as 1-5 */}
          <div className={`rounded-2xl shadow-lg p-6 mb-6 border border-border bg-card`}>
            <div className="flex items-center justify-between">
              {[2, 3, 4, 5, 6].map((step, idx) => (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep >= step 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {currentStep > step ? '✓' : idx + 1}
                    </div>
                    <span className={`text-xs mt-1 hidden sm:block text-muted-foreground`}>
                      {step === 2 && 'Basic'}
                      {step === 3 && 'Pricing'}
                      {step === 4 && 'Stock'}
                      {step === 5 && 'Details'}
                      {step === 6 && 'Media'}
                    </span>
                  </div>
                  {step < 6 && (
                    <div className={`flex-1 h-1 mx-2 rounded transition-all ${
                      currentStep > step ? 'bg-gradient-to-r from-blue-500 to-indigo-600' : 'bg-muted'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: OTP Verification */}
            {currentStep === 1 && (
              <div className={`rounded-2xl shadow-lg p-8 animate-fadeIn border border-border bg-card`}>
                <h2 className={`text-2xl font-bold mb-4 flex items-center gap-2 text-foreground`}>
                  🔐 Verify Your Email
                </h2>
                <p className={`mb-6 text-muted-foreground`}>Enter the 6-digit OTP sent to {userEmail}</p>
                
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
                          className={`w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                        />
                      ))}
                    </div>
                    
                    {timer > 0 && (
                      <p className={`text-center mb-4 text-muted-foreground`}>
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
              <div className={`rounded-2xl shadow-lg p-8 animate-fadeIn border border-border bg-card`}>
                <h2 className={`text-2xl font-bold mb-6 text-foreground`}>📝 Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Product Name *</label>
                    <input
                      type="text"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                      placeholder="e.g., Organic Tomato Seeds"
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Vendor Name *</label>
                    <input
                      type="text"
                      name="vendorName"
                      value={formData.vendorName}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                      placeholder="e.g., Seller Name"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Vendor ID</label>
                    <input
                      type="text"
                      name="vendorId"
                      value={formData.vendorId}
                      readOnly
                      className={`w-full px-4 py-3 border-2 rounded-xl cursor-not-allowed focus:outline-none text-muted-foreground`}
                      placeholder="Vendor ID (auto-filled)"
                    />
                  </div>
                  {/* Seller email and phone are not shown in the form, auto-filled from registration */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Vendor Location *</label>
                    <input
                      type="text"
                      name="vendorLocation"
                      value={formData.vendorLocation}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                      placeholder="e.g., District, State"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Vendor Type *</label>
                    <select
                      name="vendorType"
                      value={formData.vendorType}
                      onChange={handleInputChange}
                      required
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                    >
                      <option value="">Select type...</option>
                      <option value="FARMER">Farmer</option>
                      <option value="DISTRIBUTOR">Distributor</option>
                      <option value="RETAILER">Retailer</option>
                      <option value="COOPERATIVE">Cooperative</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-3 text-foreground`}>Category *</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {categories.map(cat => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, category: cat.value }))}
                          className={`p-4 rounded-xl font-semibold text-sm transition-all ${
                            formData.category === cat.value
                              ? `bg-gradient-to-r ${cat.color} text-white shadow-lg scale-105`
                              : 'bg-muted text-foreground hover:bg-muted/80'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                      placeholder="Describe your product..."
                    />
                    <p className={`text-sm mt-1 text-muted-foreground`}>{formData.description.length} characters</p>
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
              <div className={`rounded-2xl shadow-lg p-8 animate-fadeIn border border-border bg-card`}>
                <h2 className={`text-2xl font-bold mb-6 text-foreground`}>💰 Pricing</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>
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
                    <div className={`flex justify-between text-xs mt-1 text-muted-foreground`}>
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                    </div>
                  </div>
                  
                  {formData.price && (
                    <div className={`p-6 rounded-xl border-2 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20`}>
                      <h3 className={`font-semibold mb-2 text-foreground`}>Price Preview</h3>
                      <div className="flex items-center gap-4">
                        {formData.discountPercentage > 0 && (
                          <span className={`text-2xl line-through text-muted-foreground`}>₹{formData.price}</span>
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
                    className={`flex-1 border-2 py-4 rounded-xl font-semibold transition-all text-foreground`}
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
              <div className={`rounded-2xl shadow-lg p-8 animate-fadeIn border border-border bg-card`}>
                <h2 className={`text-2xl font-bold mb-6 text-foreground`}>📦 Inventory</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 text-foreground`}>Quantity *</label>
                      <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        required
                        min="1"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-semibold mb-2 text-foreground`}>Unit *</label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        required
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-semibold mb-2 text-foreground`}>Delivery Min Days *</label>
                      <input
                        type="number"
                        name="deliveryDaysMin"
                        value={formData.deliveryDaysMin}
                        onChange={handleInputChange}
                        min="1"
                        required
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-2 text-foreground`}>Delivery Max Days *</label>
                      <input
                        type="number"
                        name="deliveryDaysMax"
                        value={formData.deliveryDaysMax}
                        onChange={handleInputChange}
                        min="1"
                        required
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                      />
                    </div>
                  </div>

                  <div className={`rounded-xl p-4 border bg-muted border-border text-foreground`}>
                    Estimated delivery shown to buyers: <span className="font-semibold">{formData.deliveryDaysMin || 3}-{formData.deliveryDaysMax || 5} days</span>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Weight/Size (optional)</label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                      placeholder="e.g., 1kg, 500g, 2L"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className={`flex-1 border-2 py-4 rounded-xl font-semibold transition-all text-foreground`}
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
              <div className={`rounded-2xl shadow-lg p-8 animate-fadeIn border border-border bg-card`}>
                <h2 className={`text-2xl font-bold mb-6 text-foreground`}>📋 Additional Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Specifications</label>
                    <textarea
                      name="specifications"
                      value={formData.specifications}
                      onChange={handleInputChange}
                      rows="3"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                      placeholder="Technical specifications, ingredients, etc."
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Warranty Information</label>
                    <input
                      type="text"
                      name="warrantyInfo"
                      value={formData.warrantyInfo}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                      placeholder="e.g., 1 year manufacturer warranty"
                    />
                  </div>
                  {/* Geofence selection for this product */}
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Delivery Geofence (optional)</label>
                    <div className="rounded-xl overflow-hidden border mb-3">
                      <LocationPicker
                        onLocationSelect={(lat, lng) => setFormData(prev => ({ ...prev, geofenceLatitude: lat, geofenceLongitude: lng }))}
                        onAddressSubmit={(addr) => setFormData(prev => ({ ...prev, geofenceLatitude: addr.latitude, geofenceLongitude: addr.longitude }))}
                        initialAddress={null}
                      />
                    </div>

                    <div className="mt-2">
                      <label className={`block text-sm font-semibold mb-1 text-foreground`}>Deliver Within</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[5, 10, 20, 50].map((radius) => (
                          <button
                            key={radius}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, geofenceRadiusKm: radius }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${Number(formData.geofenceRadiusKm || 5) === radius
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-background text-foreground border-border hover:border-primary'}`}
                          >
                            {radius} km
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, geofenceRadiusKm: prev.geofenceRadiusKm || 5 }))}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${[5, 10, 20, 50].includes(Number(formData.geofenceRadiusKm || 5))
                            ? 'bg-background text-foreground border-border'
                            : 'bg-blue-600 text-white border-blue-600'}`}
                        >
                          Custom
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          step="0.5"
                          value={formData.geofenceRadiusKm || 5}
                          onChange={(e) => setFormData(prev => ({ ...prev, geofenceRadiusKm: Number(e.target.value) }))}
                          className="flex-1"
                        />
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={formData.geofenceRadiusKm || 5}
                          onChange={(e) => setFormData(prev => ({ ...prev, geofenceRadiusKm: e.target.value === '' ? '' : Number(e.target.value) }))}
                          className="w-24 px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <p className={`text-xs mt-2 text-muted-foreground`}>Current geofence: {formData.geofenceLatitude ? formData.geofenceLatitude.toFixed(5) : '—'}, {formData.geofenceLongitude ? formData.geofenceLongitude.toFixed(5) : '—'} • {formData.geofenceRadiusKm || 5} km</p>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Contact Email *</label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      required
                      pattern="^[^\s@]+@[^\s@]+\.[^\s@]+$"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Contact Phone *</label>
                    <input
                      type="text"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      required
                      pattern="^[0-9]{10}$"
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:border-blue-500 focus:outline-none transition-all text-foreground`}
                      placeholder="10-digit phone number"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className={`flex-1 border-2 py-4 rounded-xl font-semibold transition-all text-foreground`}
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
              <div className={`rounded-2xl shadow-lg p-8 animate-fadeIn border border-border bg-card`}>
                <h2 className={`text-2xl font-bold mb-6 text-foreground`}>📸 Upload Product Media</h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Upload Images (Max 5, jpg/jpeg/png/webp, ≤5MB each)</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      multiple
                      onChange={e => {
                        const newFiles = Array.from(e.target.files);
                        setFormData(prev => {
                          const combined = [...(prev.imageFiles || []), ...newFiles];
                          if (combined.length > 5) {
                            showToast('Only 5 images are allowed per product.', 'error');
                            return { ...prev, imageFiles: combined.slice(0, 5) };
                          }
                          return { ...prev, imageFiles: combined };
                        });
                        e.target.value = "";
                      }}
                      className="w-full"
                    />
                    {formData.imageFiles && formData.imageFiles.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {formData.imageFiles.map((file, idx) => (
                          <div key={idx} className="relative">
                            <img src={imagePreviewUrls[idx]} alt="preview" className="rounded-xl w-full h-32 object-cover" />
                            <button type="button" className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs" onClick={() => setFormData(prev => ({ ...prev, imageFiles: prev.imageFiles.filter((_, i) => i !== idx) }))}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 text-foreground`}>Upload Videos (mp4/webm, ≤50MB each, optional, multiple)</label>
                    <input
                      type="file"
                      accept="video/mp4,video/webm"
                      multiple
                      onChange={e => {
                        const newFiles = Array.from(e.target.files);
                        setFormData(prev => {
                          const combined = [...(prev.videoFiles || []), ...newFiles];
                          if (combined.length > 3) {
                            showToast('Only 3 videos are allowed per product.', 'error');
                            return { ...prev, videoFiles: combined.slice(0, 3) };
                          }
                          return { ...prev, videoFiles: combined };
                        });
                        e.target.value = "";
                      }}
                      className="w-full"
                    />
                    {formData.videoFiles && formData.videoFiles.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {formData.videoFiles.map((file, idx) => (
                          <div key={idx} className="relative">
                            <video controls playsInline preload="metadata" className="rounded-xl w-full h-40 object-cover bg-black">
                              <source src={videoPreviewUrls[idx]} type={file.type || 'video/mp4'} />
                              Your browser cannot preview this video file.
                            </video>
                            <button type="button" className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs" onClick={() => setFormData(prev => ({ ...prev, videoFiles: prev.videoFiles.filter((_, i) => i !== idx) }))}>✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className={`flex-1 border-2 py-4 rounded-xl font-semibold transition-all text-foreground`}
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
    </AppPage>
  );
}
