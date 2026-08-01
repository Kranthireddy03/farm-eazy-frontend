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
import { Input } from '../ui/input';
import { FormField } from '../ui/form-field';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { CheckoutStepIndicator } from './CheckoutStepIndicator';
import { cn } from '../../lib/utils';

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const SELLING_STEPS = ['Basic', 'Pricing', 'Stock', 'Details', 'Media'];

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
    { value: 'seeds', label: 'Seeds' },
    { value: 'fertilizers', label: 'Fertilizers' },
    { value: 'pesticides', label: 'Pesticides' },
    { value: 'tools', label: 'Tools' },
    { value: 'machinery', label: 'Machinery' },
    { value: 'irrigation', label: 'Irrigation' },
    { value: 'produce', label: 'Fresh produce' },
    { value: 'others', label: 'Others' },
  ];

  const sellingStepIndex = currentStep >= 2 ? currentStep - 1 : 1;

  const discountedPrice = useMemo(() => {
    const price = parseFloat(formData.price) || 0;
    const discount = parseFloat(formData.discountPercentage) || 0;
    return (price * (1 - discount / 100)).toFixed(2);
  }, [formData.price, formData.discountPercentage]);

  const imagePreviewUrls = useMemo(() => {
    if (!formData.imageFiles?.length) return [];
    return formData.imageFiles.map((file) => URL.createObjectURL(file));
  }, [formData.imageFiles]);

  const videoPreviewUrls = useMemo(() => {
    if (!formData.videoFiles?.length) return [];
    return formData.videoFiles.map((file) => URL.createObjectURL(file));
  }, [formData.videoFiles]);

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
          <CheckoutStepIndicator
            steps={SELLING_STEPS}
            currentStep={sellingStepIndex}
            totalSteps={SELLING_STEPS.length}
          />

          <form onSubmit={handleSubmit} className="space-y-6">
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
              <Card>
                <CardHeader>
                  <CardTitle>Basic information</CardTitle>
                  <CardDescription>Product name, vendor details, and category.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField label="Product name" id="productName" required>
                    <Input
                      id="productName"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Organic tomato seeds"
                    />
                  </FormField>
                  <FormField label="Vendor name" id="vendorName" required>
                    <Input
                      id="vendorName"
                      name="vendorName"
                      value={formData.vendorName}
                      onChange={handleInputChange}
                      required
                      placeholder="Seller or business name"
                    />
                  </FormField>
                  <FormField label="Vendor ID" id="vendorId" hint="Auto-filled from your account">
                    <Input id="vendorId" name="vendorId" value={formData.vendorId} readOnly className="bg-muted" />
                  </FormField>
                  <FormField label="Vendor location" id="vendorLocation" required>
                    <Input
                      id="vendorLocation"
                      name="vendorLocation"
                      value={formData.vendorLocation}
                      onChange={handleInputChange}
                      required
                      placeholder="District, state"
                    />
                  </FormField>
                  <FormField label="Vendor type" id="vendorType" required>
                    <select
                      id="vendorType"
                      name="vendorType"
                      value={formData.vendorType}
                      onChange={handleInputChange}
                      required
                      className={selectClass}
                    >
                      <option value="">Select type…</option>
                      <option value="FARMER">Farmer</option>
                      <option value="DISTRIBUTOR">Distributor</option>
                      <option value="RETAILER">Retailer</option>
                      <option value="COOPERATIVE">Cooperative</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </FormField>
                  <FormField label="Category" id="category" required>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {categories.map((cat) => (
                        <Button
                          key={cat.value}
                          type="button"
                          variant={formData.category === cat.value ? 'default' : 'outline'}
                          className="h-auto py-2.5 text-xs"
                          onClick={() => setFormData((prev) => ({ ...prev, category: cat.value }))}
                        >
                          {cat.label}
                        </Button>
                      ))}
                    </div>
                  </FormField>
                  <FormField label="Description" id="description" hint={`${formData.description.length} characters`}>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={cn(selectClass, 'h-auto min-h-[100px] py-2')}
                      placeholder="Describe your product…"
                    />
                  </FormField>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => setCurrentStep(3)}
                    disabled={!formData.productName || !formData.category}
                  >
                    Next: Pricing
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Pricing */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                  <CardDescription>Set list price and optional discount.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField label="Price (₹)" id="price" required>
                    <Input
                      id="price"
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      step="0.01"
                      placeholder="0.00"
                    />
                  </FormField>
                  <FormField label={`Discount: ${formData.discountPercentage}%`} id="discountPercentage">
                    <input
                      id="discountPercentage"
                      type="range"
                      name="discountPercentage"
                      value={formData.discountPercentage}
                      onChange={handleInputChange}
                      min="0"
                      max="50"
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </FormField>
                  {formData.price && (
                    <div className="p-4 rounded-lg border border-border bg-muted/40">
                      <p className="text-sm font-medium mb-2">Price preview</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {formData.discountPercentage > 0 && (
                          <span className="text-lg line-through text-muted-foreground">₹{formData.price}</span>
                        )}
                        <span className="text-2xl font-bold text-primary">₹{discountedPrice}</span>
                        {formData.discountPercentage > 0 && (
                          <span className="bg-destructive text-destructive-foreground px-2 py-0.5 rounded text-xs font-semibold">
                            {formData.discountPercentage}% off
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setCurrentStep(2)}>
                      Back
                    </Button>
                    <Button type="button" className="flex-1" onClick={() => setCurrentStep(4)} disabled={!formData.price}>
                      Next: Stock
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Stock/Inventory */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle>Inventory</CardTitle>
                  <CardDescription>Stock quantity, units, and delivery window.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Quantity" id="quantity" required>
                      <Input
                        id="quantity"
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        required
                        min="1"
                        placeholder="0"
                      />
                    </FormField>
                    <FormField label="Unit" id="unit" required>
                      <select id="unit" name="unit" value={formData.unit} onChange={handleInputChange} required className={selectClass}>
                        <option value="">Select…</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="g">Gram (g)</option>
                        <option value="l">Liter (l)</option>
                        <option value="ml">Milliliter (ml)</option>
                        <option value="piece">Piece</option>
                        <option value="pack">Pack</option>
                        <option value="bag">Bag</option>
                        <option value="box">Box</option>
                      </select>
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Delivery min days" id="deliveryDaysMin" required>
                      <Input
                        id="deliveryDaysMin"
                        type="number"
                        name="deliveryDaysMin"
                        value={formData.deliveryDaysMin}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </FormField>
                    <FormField label="Delivery max days" id="deliveryDaysMax" required>
                      <Input
                        id="deliveryDaysMax"
                        type="number"
                        name="deliveryDaysMax"
                        value={formData.deliveryDaysMax}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </FormField>
                  </div>
                  <p className="text-sm rounded-md border border-border bg-muted/40 px-3 py-2">
                    Buyers see delivery: <span className="font-semibold">{formData.deliveryDaysMin || 3}–{formData.deliveryDaysMax || 5} days</span>
                  </p>
                  <FormField label="Weight or size" id="weight" hint="Optional">
                    <Input
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      placeholder="e.g., 1 kg, 500 g"
                    />
                  </FormField>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setCurrentStep(3)}>Back</Button>
                    <Button type="button" className="flex-1" onClick={() => setCurrentStep(5)} disabled={!formData.quantity || !formData.unit}>
                      Next: Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 5: Additional Details */}
            {currentStep === 5 && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional details</CardTitle>
                  <CardDescription>Specifications, geofence, and buyer contact.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField label="Specifications" id="specifications">
                    <textarea
                      id="specifications"
                      name="specifications"
                      value={formData.specifications}
                      onChange={handleInputChange}
                      rows={3}
                      className={cn(selectClass, 'h-auto min-h-[80px] py-2')}
                      placeholder="Technical specifications, ingredients, etc."
                    />
                  </FormField>
                  <FormField label="Warranty information" id="warrantyInfo">
                    <Input
                      id="warrantyInfo"
                      name="warrantyInfo"
                      value={formData.warrantyInfo}
                      onChange={handleInputChange}
                      placeholder="e.g., 1 year manufacturer warranty"
                    />
                  </FormField>
                  <FormField label="Delivery geofence" id="geofence" hint="Optional delivery radius on map">
                    <div className="rounded-lg overflow-hidden border border-border mb-3">
                      <LocationPicker
                        onLocationSelect={(lat, lng) => setFormData((prev) => ({ ...prev, geofenceLatitude: lat, geofenceLongitude: lng }))}
                        onAddressSubmit={(addr) => setFormData((prev) => ({ ...prev, geofenceLatitude: addr.latitude, geofenceLongitude: addr.longitude }))}
                        initialAddress={null}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {[5, 10, 20, 50].map((radius) => (
                        <Button
                          key={radius}
                          type="button"
                          size="sm"
                          variant={Number(formData.geofenceRadiusKm || 5) === radius ? 'default' : 'outline'}
                          onClick={() => setFormData((prev) => ({ ...prev, geofenceRadiusKm: radius }))}
                        >
                          {radius} km
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="0.5"
                        value={formData.geofenceRadiusKm || 5}
                        onChange={(e) => setFormData((prev) => ({ ...prev, geofenceRadiusKm: Number(e.target.value) }))}
                        className="flex-1 accent-primary"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={formData.geofenceRadiusKm || 5}
                        onChange={(e) => setFormData((prev) => ({ ...prev, geofenceRadiusKm: e.target.value === '' ? '' : Number(e.target.value) }))}
                        className="w-24"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formData.geofenceLatitude ? formData.geofenceLatitude.toFixed(5) : '—'}, {formData.geofenceLongitude ? formData.geofenceLongitude.toFixed(5) : '—'} · {formData.geofenceRadiusKm || 5} km
                    </p>
                  </FormField>
                  <FormField label="Contact email" id="contactEmail" required>
                    <Input
                      id="contactEmail"
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      required
                      placeholder="your@email.com"
                    />
                  </FormField>
                  <FormField label="Contact phone" id="contactPhone" required hint="10-digit mobile number">
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      required
                      pattern="^[0-9]{10}$"
                      placeholder="10-digit phone number"
                    />
                  </FormField>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setCurrentStep(4)}>Back</Button>
                    <Button type="button" className="flex-1" onClick={() => setCurrentStep(6)}>Next: Media</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 6: Media */}
            {currentStep === 6 && (
              <Card>
                <CardHeader>
                  <CardTitle>Product media</CardTitle>
                  <CardDescription>Up to 5 images and 3 videos per listing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField label="Images" id="imageFiles" hint="JPG, PNG, or WebP · max 5 files · 5 MB each">
                    <Input
                      id="imageFiles"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      multiple
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files);
                        setFormData((prev) => {
                          const combined = [...(prev.imageFiles || []), ...newFiles];
                          if (combined.length > 5) {
                            showToast('Only 5 images are allowed per product.', 'error');
                            return { ...prev, imageFiles: combined.slice(0, 5) };
                          }
                          return { ...prev, imageFiles: combined };
                        });
                        e.target.value = '';
                      }}
                    />
                    {formData.imageFiles?.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                        {formData.imageFiles.map((file, idx) => (
                          <div key={idx} className="relative">
                            <img src={imagePreviewUrls[idx]} alt="Preview" className="rounded-lg w-full h-32 object-cover" />
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-7 px-2"
                              onClick={() => setFormData((prev) => ({ ...prev, imageFiles: prev.imageFiles.filter((_, i) => i !== idx) }))}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </FormField>
                  <FormField label="Videos" id="videoFiles" hint="MP4 or WebM · optional · max 3 files">
                    <Input
                      id="videoFiles"
                      type="file"
                      accept="video/mp4,video/webm"
                      multiple
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files);
                        setFormData((prev) => {
                          const combined = [...(prev.videoFiles || []), ...newFiles];
                          if (combined.length > 3) {
                            showToast('Only 3 videos are allowed per product.', 'error');
                            return { ...prev, videoFiles: combined.slice(0, 3) };
                          }
                          return { ...prev, videoFiles: combined };
                        });
                        e.target.value = '';
                      }}
                    />
                    {formData.videoFiles?.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {formData.videoFiles.map((file, idx) => (
                          <div key={idx} className="relative">
                            <video controls playsInline preload="metadata" className="rounded-lg w-full h-40 object-cover bg-black">
                              <source src={videoPreviewUrls[idx]} type={file.type || 'video/mp4'} />
                            </video>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 h-7 px-2"
                              onClick={() => setFormData((prev) => ({ ...prev, videoFiles: prev.videoFiles.filter((_, i) => i !== idx) }))}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </FormField>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => setCurrentStep(5)}>Back</Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (editingProduct ? 'Updating…' : 'Publishing…') : (editingProduct ? 'Update product' : 'Publish product')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
      </div>
    </AppPage>
  );
}
