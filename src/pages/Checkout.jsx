import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { useCheckout } from '../hooks/useCheckout'
import apiClient from '../services/apiClient'
import { sendNotification } from '../components/NotificationCenter'
import AppPage from '../components/layout/AppPage'
import { PageScaffold } from '../components/app/PageScaffold'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Tag, Sparkles, HelpCircle, X, CheckCircle2, ArrowLeft } from 'lucide-react'
import { InfoPanel } from '../components/platform/InfoPanel'
import { CheckoutStepIndicator } from '../components/marketplace/CheckoutStepIndicator'
import { CheckoutProcessingOverlay } from '../components/marketplace/CheckoutProcessingOverlay'
import { CheckoutRetryPanel } from '../components/marketplace/CheckoutRetryPanel'
import { OrderSummaryPanel } from '../components/marketplace/OrderSummaryPanel'
import { CheckoutOrderReviewSection } from '../components/marketplace/CheckoutOrderReviewSection'
import { CheckoutPaymentSection } from '../components/marketplace/CheckoutPaymentSection'
import { CheckoutAddressSection } from '../components/marketplace/CheckoutAddressSection'

// Razorpay script loader
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Checkout() {
  // Add missing handleRetryPayment function
  const handleRetryPayment = () => {
    handleCheckout();
  };
    // Loads cart, coins, and addresses for checkout page
    const loadCheckoutData = async () => {
      try {
        const cart = JSON.parse(localStorage.getItem('farmeazy_cart') || '[]');
        setCartItems(cart);
        await fetchCoins();
        await fetchAddresses();
      } catch (error) {
        console.error('Error loading checkout data:', error);
      }
    };
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [retryTimer, setRetryTimer] = useState(0);
  const [retryInterval, setRetryInterval] = useState(null);
  const [retryActive, setRetryActive] = useState(false);

  const navigate = useNavigate()
  const { showToast } = useToast()

  const [cartItems, setCartItems] = useState([])
  const [coins, setCoins] = useState(0)
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponApplying, setCouponApplying] = useState(false)
  const [availableCoupons, setAvailableCoupons] = useState([])
  const [loadingCoupons, setLoadingCoupons] = useState(false)
  const [selectedCouponTerms, setSelectedCouponTerms] = useState(null)

  const {
    totals: { subtotal, tax, total },
    useCoins,
    coinsToUse,
    maxUsableCoins,
    finalAmount,
    handleUseCoins,
    setCoinsToUse,
    clearPersistedCoins,
  } = useCheckout(cartItems, coins)

  const couponAdjustedCoinCap = Math.max(0, total - Number(couponDiscount || 0))
  const coinsApplied = useCoins ? Math.min(coinsToUse, maxUsableCoins, Math.floor(couponAdjustedCoinCap)) : 0
  const discountedFinalAmount = Math.max(0, finalAmount - Number(couponDiscount || 0))
  const remainingCoinsAfterUse = coins - coinsApplied

  const [selectedPayment, setSelectedPayment] = useState('CASH_ON_DELIVERY')
  const [razorpayLoading, setRazorpayLoading] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  
  // Processing overlay state for smoother transitions
  const [processingState, setProcessingState] = useState({
    active: false,
    message: '',
    step: 0,
    totalSteps: 3
  })

  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    addressType: '',
    city: '',
    state: '',
    postalCode: ''
  })

  const UPI_ID = '6301630368@ybl'
  const PHONE_PAY_ID = '6301630368'
  const paymentSimulationEnabled = String(import.meta.env.VITE_PAYMENT_SIMULATION_ENABLED || 'false').toLowerCase() === 'true'
  const hasOutOfAreaItems = cartItems.some((item) => item.deliverable === false)
  const checkoutStep = selectedAddress ? (selectedPayment ? 3 : 2) : 1

  useEffect(() => {
    loadCheckoutData()
  }, [])

  // Cleanup retry interval on unmount
  useEffect(() => {
    return () => {
      if (retryInterval) clearInterval(retryInterval);
    };
  }, [retryInterval]);

  const startRetryWindow = () => {
    setRetryActive(true);
    setRetryTimer(600);
    if (retryInterval) clearInterval(retryInterval);
    const interval = setInterval(() => {
      setRetryTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setRetryActive(false);
          showToast('Payment window expired. Please try checkout again.', 'error');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setRetryInterval(interval);
  }

  // Retry Screen at top of render
  if (retryActive) {
    return (
      <>
        <CheckoutRetryPanel
          retryTimer={retryTimer}
          onRetry={handleRetryPayment}
          onEditDetails={() => {
            setRetryActive(false);
            showToast('You can edit details and retry payment.', 'info');
          }}
          onBackToShop={() => navigate('/products')}
          retryLoading={razorpayLoading}
        />
      </>
    );
  }

  if (processingState.active) {
    return (
      <CheckoutProcessingOverlay
        message={processingState.message}
        step={processingState.step}
        totalSteps={processingState.totalSteps}
      />
    );
  }

  const fetchCoins = async () => {
    try {
      const response = await apiClient.get('/coins')
      setCoins(response.data.totalCoins || 0)
    } catch (error) {
      console.error('Error fetching coins:', error)
    }
  }

  const fetchAddresses = async () => {
    try {
      const response = await apiClient.get('/addresses')
      const addressList = Array.isArray(response.data) ? response.data : []
      setAddresses(addressList)
      if (addressList.length > 0) {
        setSelectedAddress(addressList[0].id)
      }
    } catch (error) {
      console.error('Error fetching addresses:', error)
    }
  }

  const handleAddressChange = (e) => {
    const { name, value } = e.target
    setAddressForm({ ...addressForm, [name]: value })
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await apiClient.post('/addresses', addressForm)
      showToast('Address added successfully', 'success')
      sendNotification('New delivery address saved!', 'success', '📍');
      setAddressForm({
        fullName: '',
        phoneNumber: '',
        email: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: ''
      })
      setShowAddressForm(false)
      fetchAddresses()
    } catch (error) {
      showToast('Failed to add address', 'error')
    }
  }

  const fetchAvailableCoupons = useCallback(async (orderTotal) => {
    try {
      setLoadingCoupons(true)
      const res = await apiClient.get('/coupons/available', {
        params: { amount: orderTotal ?? total, applicableTo: 'PRODUCT' }
      })
      const list = Array.isArray(res.data) ? res.data : []
      setAvailableCoupons(list)
    } catch (_e) {
      setAvailableCoupons([])
    } finally {
      setLoadingCoupons(false)
    }
  }, [total])

  useEffect(() => {
    if (total > 0) {
      fetchAvailableCoupons(total)
    }
  }, [total, fetchAvailableCoupons])

  const applyCoupon = async (codeToApply) => {
    const code = (typeof codeToApply === 'string' ? codeToApply : couponCode).trim().toUpperCase();
    if (!code) {
      setCouponDiscount(0);
      showToast('Enter a coupon code.', 'warning');
      return;
    }
    setCouponApplying(true);
    try {
      const response = await apiClient.get('/coupons/validate', {
        params: { code, amount: total, applicableTo: 'PRODUCT' }
      });
      const discount = Number(response.data?.discount || 0);
      setCouponCode(code);
      setCouponDiscount(discount);
      showToast(`Coupon applied: ₹${discount.toFixed(2)} off`, 'success');
      sendNotification(`Coupon ${code} applied (-₹${discount.toFixed(2)})`, 'success', '🏷️');
    } catch (error) {
      setCouponDiscount(0);
      showToast(error?.response?.data?.message || 'Coupon is not valid for this order.', 'error');
    } finally {
      setCouponApplying(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setCouponDiscount(0);
    showToast('Coupon removed.', 'info');
  };


  const handleCheckout = async () => {
    if (hasOutOfAreaItems) {
      showToast('One or more items in your cart are not deliverable to this location.', 'error')
      return
    }
    try {
      setCheckingOut(true)

      // Require an address for all payment methods
      if (!selectedAddress) {
        showToast('Please select or add a delivery address', 'warning')
        setCheckingOut(false)
        return
      }

      // Razorpay flow
      if (selectedPayment === 'RAZORPAY') {
        const MIN_PAYABLE = 1;
        if (finalAmount < MIN_PAYABLE) {
          alert('Minimum payable amount is ₹1');
          setRazorpayLoading(false);
          setCheckingOut(false);
          return;
        }
        setRazorpayLoading(true);
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          showToast('Failed to load Razorpay. Please try again.', 'error');
          setRazorpayLoading(false);
          setCheckingOut(false);
          return;
        }
        // Create Razorpay order on backend (amount in paise)
        const paymentData = {
          amount: Math.round(discountedFinalAmount * 100), // in paise
          email: addresses.find(a => a.id === selectedAddress)?.email || '',
          phone: addresses.find(a => a.id === selectedAddress)?.phoneNumber || ''
        };
        const orderRes = await apiClient.post('/payment/create-order', paymentData);
        if (orderRes.status !== 200) {
          console.error('Backend order creation failed:', orderRes);
          showToast('Order creation failed: ' + (orderRes.data || orderRes.statusText), 'error');
          setRazorpayLoading(false);
          setCheckingOut(false);
          return;
        }
        const order = orderRes.data;

        if (order?.simulation) {
          if (!paymentSimulationEnabled) {
            showToast('Razorpay is not configured. Please contact support.', 'error');
            setRazorpayLoading(false);
            setCheckingOut(false);
            return;
          }

          setProcessingState({
            active: true,
            message: 'Processing simulated payment...',
            step: 1,
            totalSteps: 3
          });

          try {
            const verifyResult = await apiClient.post('/payment/verify', {
              orderId: order.id,
              paymentId: order.simulation_payment_id || `pay_sim_${Date.now()}`,
              signature: 'SIMULATED',
              email: paymentData.email,
              phone: paymentData.phone,
              amount: order.amount
            });

            if (verifyResult.data.status === 'success') {
              setProcessingState(prev => ({
                ...prev,
                message: 'Creating your order...',
                step: 2
              }));

                const orderData = {
                  items: cartItems.map(item => {
                    const itemPrice = (item.discountedPrice && item.discountedPrice > 0) ? item.discountedPrice : item.price;
                    return {
                      productId: item.id,
                      quantity: item.quantity,
                      price: itemPrice
                    };
                  }),
                  subtotal: subtotal,
                  taxAmount: tax,
                  totalAmount: total,
                  coinsUsed: coinsApplied,
                  couponCode: couponCode.trim() || undefined,
                  finalAmount: discountedFinalAmount,
                  paymentMethod: 'RAZORPAY',
                  addressId: selectedAddress,
                  razorpayOrderId: order.id,
                  razorpayPaymentId: order.simulation_payment_id || `pay_sim_${Date.now()}`,
                  razorpaySignature: 'SIMULATED'
                };

              const placedOrder = await apiClient.post('/orders', orderData);
              localStorage.removeItem('farmeazy_cart');
              clearPersistedCoins();
              window.dispatchEvent(new CustomEvent('cart-updated'));
              sendNotification(`Order #${placedOrder.data.id} placed successfully!`, 'success', '✅');
              setProcessingState(prev => ({
                ...prev,
                message: 'Order confirmed! Redirecting...',
                step: 3
              }));
              setTimeout(() => {
                setProcessingState({ active: false, message: '', step: 0, totalSteps: 3 });
                navigate(`/order-confirmation/${placedOrder.data.id}`);
              }, 500);
            } else {
              throw new Error('Simulated payment verification failed');
            }
          } catch (simError) {
            console.error('Simulated payment flow failed:', simError);
            setProcessingState({ active: false, message: '', step: 0, totalSteps: 3 });
            showToast('Payment simulation failed. Please try again.', 'error');
          } finally {
            setRazorpayLoading(false);
            setCheckingOut(false);
          }
          return;
        }

        const options = {
          key: order.key_id,
          amount: order.amount, // in paise
          currency: order.currency,
          name: 'FarmEazy',
          description: 'Order Payment',
          order_id: order.id,
          handler: async function (response) {
            
            // Show processing overlay immediately
            setProcessingState({
              active: true,
              message: 'Verifying payment...',
              step: 1,
              totalSteps: 3
            });
            
            // Verify payment on backend
            try {
              const verifyResult = await apiClient.post('/payment/verify', {
                orderId: order.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                email: paymentData.email,
                phone: paymentData.phone,
                amount: order.amount
              });
              
              // Only after payment is verified, place the order
              if (verifyResult.data.status === 'success') {
                setProcessingState(prev => ({
                  ...prev,
                  message: 'Creating your order...',
                  step: 2
                }));
                
                const orderData = {
                  items: cartItems.map(item => {
                    const itemPrice = (item.discountedPrice && item.discountedPrice > 0) ? item.discountedPrice : item.price;
                    return {
                      productId: item.id,
                      quantity: item.quantity,
                      price: itemPrice
                    };
                  }),
                  subtotal: subtotal,
                  taxAmount: tax,
                  totalAmount: total,
                  coinsUsed: coinsApplied,
                  couponCode: couponCode.trim() || undefined,
                  finalAmount: discountedFinalAmount,
                  paymentMethod: 'RAZORPAY',
                  addressId: selectedAddress,
                  razorpayOrderId: order.id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature
                };
                try {
                  const placedOrder = await apiClient.post('/orders', orderData);
                  
                  // Clear cart immediately and notify Layout
                  localStorage.removeItem('farmeazy_cart');
                  clearPersistedCoins();
                  window.dispatchEvent(new CustomEvent('cart-updated'));
                  sendNotification(`Order #${placedOrder.data.id} placed successfully!`, 'success', '✅');
                  
                  // Update to complete state
                  setProcessingState(prev => ({
                    ...prev,
                    message: 'Order confirmed! Redirecting...',
                    step: 3
                  }));
                  
                  // Small delay for visual feedback then navigate
                  setTimeout(() => {
                    setProcessingState({ active: false, message: '', step: 0, totalSteps: 3 });
                    navigate(`/order-confirmation/${placedOrder.data.id}`);
                  }, 500);
                } catch (orderErr) {
                  console.error('Order creation failed:', orderErr?.message || orderErr);
                  setProcessingState({ active: false, message: '', step: 0, totalSteps: 3 });
                  const errorMsg = orderErr.response?.data?.message || orderErr.response?.data?.error || orderErr.message || 'Unknown error';
                  showToast(`Order failed: ${errorMsg}. Payment was successful - contact support.`, 'error');
                }
                
              } else {
                // Payment failed, keep checkout in retry mode and do not create order
                setProcessingState({ active: false, message: '', step: 0, totalSteps: 3 });
                showToast('Payment failed. Please retry payment.', 'warning');
                sendNotification('Payment failed. Retry payment to place your order.', 'warning', '⚠️');
                startRetryWindow();
              }
            } catch (err) {
              console.error('Payment verification failed:', err);
              setProcessingState({ active: false, message: '', step: 0, totalSteps: 3 });
              showToast('Payment verification failed. Please retry.', 'error');
              sendNotification('Payment verification failed. Retry payment.', 'error', '❌');
              startRetryWindow();
            }
          },
          prefill: {
            email: paymentData.email,
            contact: paymentData.phone
          },
          theme: { color: '#22c55e' },
          modal: {
            ondismiss: async function () {
              // User closed Razorpay modal before successful payment, so do not place order.
              showToast('Payment was cancelled. You can retry now.', 'warning');
              sendNotification('Payment cancelled. Retry payment to place order.', 'warning', '⚠️');
              startRetryWindow();
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }

      // Default flow for other payment methods
      if (selectedPayment === 'CASH_ON_DELIVERY') {
        // Show processing overlay
        setProcessingState({
          active: true,
          message: 'Creating your order...',
          step: 2,
          totalSteps: 3
        });
        
        const orderData = {
          items: cartItems.map(item => {
            const itemPrice = (item.discountedPrice && item.discountedPrice > 0) ? item.discountedPrice : item.price
            return {
              productId: item.id,
              quantity: item.quantity,
              price: itemPrice
            }
          }),
          subtotal: subtotal,
          taxAmount: tax,
          totalAmount: total,
          coinsUsed: coinsApplied,
          couponCode: couponCode.trim() || undefined,
          finalAmount: discountedFinalAmount,
          paymentMethod: 'CASH_ON_DELIVERY',
          addressId: selectedAddress
        }
        const response = await apiClient.post('/orders', orderData)
        
        // Clear cart immediately and notify Layout
        localStorage.removeItem('farmeazy_cart')
        clearPersistedCoins()
        window.dispatchEvent(new CustomEvent('cart-updated'))
        sendNotification(`Order #${response.data.id} placed! Cash on Delivery`, 'success', '📦');
        
        // Update to complete state
        setProcessingState(prev => ({
          ...prev,
          message: 'Order confirmed! Redirecting...',
          step: 3
        }));
        
        // Small delay for visual feedback then navigate
        setTimeout(() => {
          setProcessingState({ active: false, message: '', step: 0, totalSteps: 3 });
          navigate(`/order-confirmation/${response.data.id}`);
        }, 500);
      }
    } catch (error) {
      setProcessingState({ active: false, message: '', step: 0, totalSteps: 3 });
      const backendError = error?.response?.data?.message || error?.response?.data
      showToast('Failed to place order: ' + (backendError || error.message), 'error')
      setRazorpayLoading(false)
    } finally {
      setCheckingOut(false)
    }
  }

  const openUPIPayment = (orderId) => {
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=FarmEazy&tr=ORD${orderId}&am=${total}`
    window.location.href = upiLink
  }

  const openPhonePayPayment = (orderId) => {
    // Would integrate with PhonePay API
    showToast('Redirecting to PhonePay...', 'info')
    // window.location.href = `https://phonepay-api.example.com/pay?amount=${total}&orderId=${orderId}`
  }

  const copyUPI = () => {
    navigator.clipboard.writeText(UPI_ID)
    showToast('UPI ID copied to clipboard!', 'success')
  }

  const copyPhonePay = () => {
    navigator.clipboard.writeText(PHONE_PAY_ID)
    showToast('PhonePay ID copied to clipboard!', 'success')
  }

  if (cartItems.length === 0) {
    return (
      <AppPage title="Checkout" description="Your cart is empty.">
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-6">Add products to proceed with checkout.</p>
            <Button onClick={() => navigate('/products')}>Continue shopping</Button>
          </CardContent>
        </Card>
      </AppPage>
    )
  }

  return (
    <AppPage
      title="Checkout"
      description="Review items, delivery, and payment before placing your order."
      actions={
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      }
      meta={
        <>
          <Badge variant="muted">{cartItems.length} items</Badge>
          <Badge variant="outline">₹{discountedFinalAmount.toFixed(2)} to pay</Badge>
        </>
      }
    >
        <CheckoutStepIndicator
          steps={['Review', 'Delivery', 'Payment']}
          currentStep={checkoutStep}
          totalSteps={3}
        />

        <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/70 dark:bg-emerald-950/20 p-3.5 flex items-start gap-3 mt-4">
          <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
              <span>🌾 Seasonal Offers & 7-Day Hassle-Free Returns</span>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300 dark:border-emerald-700 bg-white/60 dark:bg-black/20">Active Coupons</Badge>
            </div>
            <p className="text-emerald-800 dark:text-emerald-300">
              Apply valid coupon codes on eligible farm seeds, bio-fertilizers, pesticides, tools, and supplies. All marketplace orders are backed by standard 7-day hassle-free replacement or return.
            </p>
          </div>
        </div>

        {hasOutOfAreaItems && (
          <InfoPanel
            variant="destructive"
            title="Delivery unavailable"
            description="One or more items cannot be delivered to your selected location. Remove them before placing the order."
            className="mt-6"
          />
        )}

        <PageScaffold
          aside={<>
            <Card className="mb-4 shadow-sm border-border">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Coupons & Offers
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-1 space-y-3">
                {/* Manual Input */}
                <div className="flex gap-2">
                  <input
                    aria-label="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm font-mono uppercase"
                    maxLength={32}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => applyCoupon(couponCode)}
                    disabled={couponApplying || !couponCode.trim()}
                  >
                    {couponApplying ? 'Applying…' : 'Apply'}
                  </Button>
                </div>

                {/* Applied Coupon Info */}
                {couponDiscount > 0 && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">{couponCode}</span>
                        <span className="text-muted-foreground ml-1.5">(saved ₹{Number(couponDiscount).toFixed(2)})</span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeCoupon}
                      className="h-6 px-2 text-[11px] text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                )}

                {/* Available Coupons List */}
                {availableCoupons.length > 0 && (
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
                      <span>Available for you ({availableCoupons.length})</span>
                      {loadingCoupons && <span className="text-[10px]">Updating…</span>}
                    </div>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {availableCoupons.map((c) => {
                        const isApplied = couponCode === c.code && couponDiscount > 0;
                        const meetsMin = !c.minimumOrderAmount || total >= Number(c.minimumOrderAmount);
                        return (
                          <div
                            key={c.code}
                            className={`rounded-lg border p-2.5 text-xs space-y-1.5 transition-all ${
                              isApplied
                                ? 'border-emerald-500 bg-emerald-500/5'
                                : 'border-border/80 hover:border-primary/50 bg-background/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold tracking-wide text-foreground px-1.5 py-0.5 rounded border border-dashed border-primary/50 bg-primary/5">
                                {c.code}
                              </span>
                              {isApplied ? (
                                <Badge variant="success" className="text-[10px] py-0 px-2">Applied</Badge>
                              ) : (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-xs font-semibold text-primary hover:bg-primary/10"
                                  disabled={couponApplying || !meetsMin}
                                  onClick={() => applyCoupon(c.code)}
                                >
                                  {meetsMin ? 'Apply' : `Min ₹${c.minimumOrderAmount}`}
                                </Button>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {c.discountType === 'PERCENTAGE'
                                ? `${c.discountValue}% off${c.maximumDiscount ? ` up to ₹${c.maximumDiscount}` : ''}`
                                : `Flat ₹${c.discountValue} off on your order`}
                              {c.minimumOrderAmount ? ` · Min cart: ₹${c.minimumOrderAmount}` : ''}
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedCouponTerms(c)}
                              className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <HelpCircle className="h-3 w-3" />
                              View terms & return policy
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <OrderSummaryPanel
              subtotal={subtotal}
              tax={tax}
              total={total}
              finalAmount={discountedFinalAmount}
              couponDiscount={couponDiscount}
              couponCode={couponCode}
              coins={coins}
              useCoins={useCoins}
              coinsToUse={coinsToUse}
              maxCoinsUsable={maxUsableCoins}
              coinsApplied={coinsApplied}
              remainingCoins={remainingCoinsAfterUse}
              onUseCoinsChange={handleUseCoins}
              onCoinsToUseChange={(value) => {
                setCoinsToUse(Math.max(0, Math.min(value, maxUsableCoins)))
              }}
              variant="checkout"
              footerNote={
                selectedPayment === 'CASH_ON_DELIVERY' ? (
                  <p className="text-xs text-muted-foreground rounded-md border border-border p-3">
                    Cash on delivery — expected delivery 3–5 business days.
                  </p>
                ) : null
              }
              primaryAction={
                <Button
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={checkingOut || hasOutOfAreaItems || (selectedPayment === 'CASH_ON_DELIVERY' && !selectedAddress)}
                >
                  {checkingOut ? 'Processing…' : 'Place order'}
                </Button>
              }
              secondaryAction={
                <Button variant="outline" className="w-full" onClick={() => navigate('/cart')}>
                  Back to cart
                </Button>
              }
            />
          </>}
        >
          <CheckoutOrderReviewSection cartItems={cartItems} />
          <CheckoutPaymentSection
            selectedPayment={selectedPayment}
            onSelect={setSelectedPayment}
          />
          <CheckoutAddressSection
            addresses={addresses}
            selectedAddress={selectedAddress}
            onSelectAddress={setSelectedAddress}
            showAddressForm={showAddressForm}
            onToggleAddressForm={() => setShowAddressForm((prev) => !prev)}
            onAddressAdded={(newId) => {
              setShowAddressForm(false);
              fetchAddresses();
              if (newId) setSelectedAddress(newId);
            }}
            showToast={showToast}
          />
        </PageScaffold>

      {/* Terms & Conditions and Exchange/Return Modal */}
      {selectedCouponTerms && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center animate-fadeIn"
          onClick={() => setSelectedCouponTerms(null)}
        >
          <div
            className="max-w-md w-full bg-background border border-border rounded-2xl p-5 shadow-2xl space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-foreground">Coupon: {selectedCouponTerms.code}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCouponTerms(null)}
                className="rounded-full p-1 hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 space-y-1">
                <div className="font-semibold text-primary">
                  {selectedCouponTerms.discountType === 'PERCENTAGE'
                    ? `${selectedCouponTerms.discountValue}% Discount${selectedCouponTerms.maximumDiscount ? ` (Max ₹${selectedCouponTerms.maximumDiscount})` : ''}`
                    : `Flat ₹${selectedCouponTerms.discountValue} Discount`}
                </div>
                <div className="text-muted-foreground">
                  {selectedCouponTerms.minimumOrderAmount ? `Requires minimum purchase of ₹${selectedCouponTerms.minimumOrderAmount}` : 'No minimum order required'}
                </div>
              </div>

              <div>
                <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                  🌾 Eligible Items
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedCouponTerms.eligibleItems || 'Applicable on verified agricultural products: seeds, bio-fertilizers, farm equipment, tools, and organic inputs.'}
                </p>
              </div>

              <div>
                <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                  📋 Terms & Conditions
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedCouponTerms.termsAndConditions || '1. Valid on product purchases. 2. Cannot be combined with other offers. 3. Valid once per user account.'}
                </p>
              </div>

              <div>
                <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1">
                  🔄 Exchange & Return Policy
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {selectedCouponTerms.returnExchangePolicy || 'Standard 7-day hassle-free replacement or return applies on eligible agricultural goods. If any item is returned or refunded, the coupon discount is prorated across eligible items and cannot be refunded as cash.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => setSelectedCouponTerms(null)}>
                Close
              </Button>
              {couponCode !== selectedCouponTerms.code && (
                <Button
                  size="sm"
                  onClick={() => {
                    applyCoupon(selectedCouponTerms.code);
                    setSelectedCouponTerms(null);
                  }}
                >
                  Apply Coupon
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </AppPage>
  )
}

export default Checkout
