import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import apiClient from '../services/apiClient'
import { useTheme } from '../context/ThemeContext';
import LocationPicker from '../components/LocationPicker'
import { sendNotification } from '../components/NotificationCenter'
import AppPage from '../components/layout/AppPage'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import {
  calculateCartTotals,
  getMaxUsableCoins,
  COIN_VALUE,
  MINIMUM_PAYMENT,
  TAX_RATE,
} from '../lib/marketplace'
import { CheckoutProcessingOverlay } from '../components/marketplace/CheckoutProcessingOverlay'
import { CheckoutRetryPanel } from '../components/marketplace/CheckoutRetryPanel'
import { OrderSummaryPanel } from '../components/marketplace/OrderSummaryPanel'

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
    const { isDark } = useTheme();
  // Add missing handleRetryPayment function
  const handleRetryPayment = () => {
    // Re-invoke Razorpay payment flow for pending order
    // You may want to call the backend to get the pending order details and re-initiate payment
    // For now, just reload the page or re-run handleCheckout
    handleCheckout();
  };
    // Loads cart, coins, and addresses for checkout page
    const loadCheckoutData = async () => {
      try {
        // Load cart from localStorage
        const cart = JSON.parse(localStorage.getItem('farmeazy_cart') || '[]');
        setCartItems(cart);
        const savedCoins = JSON.parse(localStorage.getItem('farmeazy_checkout_coins') || 'null');
        if (savedCoins?.useCoins) {
          setUseCoins(true);
          setCoinsToUse(savedCoins.coinsToUse || 0);
        }
        // Fetch coins
        await fetchCoins();
        // Fetch addresses
        await fetchAddresses();
      } catch (error) {
        showToast('Failed to load checkout data', 'error');
      }
    };
  // State for payment retry logic
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [retryTimer, setRetryTimer] = useState(0);
  const [retryInterval, setRetryInterval] = useState(null);
  const [retryActive, setRetryActive] = useState(false);

  const navigate = useNavigate()
  const { showToast } = useToast()

  const [cartItems, setCartItems] = useState([])
  const [coins, setCoins] = useState(0)
  const [useCoins, setUseCoins] = useState(false)
  const [coinsToUse, setCoinsToUse] = useState(0)

  const handleCoinToggle = () => {
    setUseCoins(!useCoins);
    if (!useCoins) {
      const maxCoins = getMaxUsableCoins(total, coins, MINIMUM_PAYMENT);
      setCoinsToUse(maxCoins);
    } else {
      setCoinsToUse(0);
    }
  };

  const handleCoinsToUseChange = (e) => {
    const maxCoins = getMaxUsableCoins(total, coins, MINIMUM_PAYMENT);
    const value = Math.max(0, Math.min(Number(e.target.value), maxCoins));
    setCoinsToUse(value);
  };

  const handleCoinSliderChange = (e) => {
    const maxCoins = getMaxUsableCoins(total, coins, MINIMUM_PAYMENT);
    const value = Math.max(0, Math.min(Number(e.target.value), maxCoins));
    setCoinsToUse(value);
  };
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
          onBackToShop={() => navigate('/buying')}
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

  const calculateTotals = () => calculateCartTotals(cartItems, TAX_RATE)

  const { subtotal, tax, total } = calculateTotals();
  // Updated: Calculate max usable coins based on minimum payment requirement
  const maxCoinsUsable = getMaxUsableCoins(total, coins, MINIMUM_PAYMENT);
  const coinsApplied = useCoins ? Math.min(coinsToUse, maxCoinsUsable) : 0;
  const finalAmount = Math.max(MINIMUM_PAYMENT, total - (coinsApplied * COIN_VALUE));
  const remainingCoinsAfterUse = coins - coinsApplied;

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
          amount: Math.round(finalAmount * 100), // in paise
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
              simulation: true
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
                finalAmount: finalAmount,
                paymentMethod: 'RAZORPAY',
                addressId: selectedAddress,
                paymentId: order.simulation_payment_id || `pay_sim_${Date.now()}`
              };

              const placedOrder = await apiClient.post('/orders', orderData);
              localStorage.removeItem('farmeazy_cart');
              localStorage.removeItem('farmeazy_checkout_coins');
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
                phone: paymentData.phone
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
                  finalAmount: finalAmount,
                  paymentMethod: 'RAZORPAY',
                  addressId: selectedAddress,
                  paymentId: response.razorpay_payment_id
                };
                try {
                  const placedOrder = await apiClient.post('/orders', orderData);
                  
                  // Clear cart immediately and notify Layout
                  localStorage.removeItem('farmeazy_cart');
                  localStorage.removeItem('farmeazy_checkout_coins');
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
          finalAmount: finalAmount,
          paymentMethod: 'CASH_ON_DELIVERY',
          addressId: selectedAddress
        }
        const response = await apiClient.post('/orders', orderData)
        
        // Clear cart immediately and notify Layout
        localStorage.removeItem('farmeazy_cart')
        localStorage.removeItem('farmeazy_checkout_coins')
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
            <Button onClick={() => navigate('/buying')}>Continue shopping</Button>
          </CardContent>
        </Card>
      </AppPage>
    )
  }

  return (
    <AppPage title="Checkout" description="Complete your order securely.">

        {hasOutOfAreaItems && (
          <div className={`mb-6 rounded-2xl border p-4 ${isDark ? 'border-red-800 bg-red-950/20 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
            One or more items in this cart cannot be delivered to your selected location. Remove them before placing the order.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items Review */}
            <div className={`interactive-card rounded-2xl shadow-lg p-6 border ${isDark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-gray-200'}`}> 
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map(item => {
                  const itemPrice = (item.discountedPrice && item.discountedPrice > 0) ? item.discountedPrice : item.price
                  const hasDiscount = item.discountPercentage && item.discountPercentage > 0

                  return (
                    <div key={item.id} className={`flex justify-between items-start pb-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                      <div className="flex-1">
                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{item.productName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {hasDiscount ? (
                            <>
                              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Qty: {item.quantity} × ₹{itemPrice.toFixed(2)}</p>
                              <span className={`line-through text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>₹{item.price.toFixed(2)}</span>
                              <span className="bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                {item.discountPercentage}% OFF
                              </span>
                            </>
                          ) : (
                            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Qty: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                          )}
                        </div>
                        {hasDiscount && (
                          <p className="text-xs text-green-400 font-semibold mt-1">
                            Saving ₹{((item.price - itemPrice) * item.quantity).toFixed(2)}
                          </p>
                        )}
                          {/* Vendor Transparency UI - Razorpay Compliance */}
                          <div className={`mt-2 p-4 rounded-xl border ${isDark ? 'bg-orange-900/30 border-orange-700' : 'bg-orange-50 border-orange-300'}`}>
                            <div className={`font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              <span>🏷️</span> Vendor Information
                            </div>
                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                              <div><span className="font-semibold">Sold by:</span> {item.vendorName || 'Not specified'}{item.vendorType ? ` (${item.vendorType})` : ''}</div>
                              <div><span className="font-semibold">Vendor ID:</span> {item.vendorId || 'Not specified'}</div>
                              <div><span className="font-semibold">Location:</span> {item.vendorLocation || 'Not specified'}</div>
                              <div><span className="font-semibold">Type:</span> {item.vendorType || 'Not specified'}</div>
                            </div>
                          </div>
                      </div>
                      <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>₹{(itemPrice * item.quantity).toFixed(2)}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment Methods */}
            <div className={`interactive-card rounded-2xl shadow-lg p-6 border ${isDark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-gray-200'}`}> 
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>💳 Payment Method</h2>
              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition"
                       style={{ borderColor: selectedPayment === 'CASH_ON_DELIVERY' ? '#f97316' : '#475569',
                               backgroundColor: selectedPayment === 'CASH_ON_DELIVERY' ? 'rgba(249, 115, 22, 0.1)' : 'transparent' }}>
                  <input
                    type="radio"
                    name="payment"
                    value="CASH_ON_DELIVERY"
                    checked={selectedPayment === 'CASH_ON_DELIVERY'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="ml-4">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>💵 Cash on Delivery</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Pay when your order arrives</p>
                    <p className="text-xs text-green-400 mt-1">✓ Free | Delivery in 3-5 days</p>
                  </div>
                </label>
                {/* Razorpay */}
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition"
                       style={{ borderColor: selectedPayment === 'RAZORPAY' ? '#22c55e' : '#475569',
                               backgroundColor: selectedPayment === 'RAZORPAY' ? 'rgba(34, 197, 94, 0.1)' : 'transparent' }}>
                  <input
                    type="radio"
                    name="payment"
                    value="RAZORPAY"
                    checked={selectedPayment === 'RAZORPAY'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="ml-4 flex-1">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>🪙 Razorpay (UPI/Card/Netbanking)</p>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Pay securely online with Razorpay</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Address selection & form - Enhanced with Map */}
            <div className={`interactive-card rounded-2xl shadow-lg p-6 border ${isDark ? 'bg-slate-800/95 border-slate-700' : 'bg-white/95 border-gray-200'}`}> 
              <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>📍 Delivery Address</h2>

              {/* Existing addresses dropdown */}
              {addresses.length > 0 && !showAddressForm && (
                <div className="mb-4 space-y-3">
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Select from saved addresses:</p>
                  <div className="space-y-2">
                    {addresses.map(addr => (
                      <label 
                        key={addr.id} 
                        className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                          selectedAddress === addr.id 
                            ? 'border-orange-500 bg-orange-500/10' 
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddress === addr.id}
                          onChange={(e) => setSelectedAddress(Number(e.target.value))}
                          className="mt-1 mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {addr.addressType === 'Home' ? '🏠' : addr.addressType === 'Work' ? '🏢' : '📍'}
                            </span>
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{addr.fullName}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-slate-600 text-slate-300' : 'bg-gray-100 text-gray-700'}`}>{addr.addressType}</span>
                          </div>
                          <p className={`text-sm mt-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{addr.addressLine1}</p>
                          {addr.addressLine2 && <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{addr.addressLine2}</p>}
                          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{addr.city}, {addr.state} - {addr.postalCode}</p>
                          <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>📱 {addr.phoneNumber}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add new address button */}
              <button
                type="button"
                onClick={() => setShowAddressForm(!showAddressForm)}
                className={`w-full px-4 py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2 ${
                  showAddressForm 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white'
                }`}
              >
                {showAddressForm ? (
                  <><span>❌</span> Cancel</>
                ) : (
                  <><span>➕</span> Add New Address</>
                )}
              </button>

              {/* LocationPicker component */}
              {showAddressForm && (
                <div className="mt-4">
                  <LocationPicker
                    onAddressSubmit={async (addressData) => {
                      try {
                        const response = await apiClient.post('/addresses', addressData)
                        showToast('Address added successfully!', 'success')
                        setShowAddressForm(false)
                        fetchAddresses()
                        // Auto-select the new address
                        if (response.data && response.data.id) {
                          setSelectedAddress(response.data.id)
                        }
                      } catch (error) {
                        showToast('Failed to add address: ' + (error.response?.data?.message || error.message), 'error')
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <OrderSummaryPanel
            subtotal={subtotal}
            tax={tax}
            total={total}
            finalAmount={finalAmount}
            coins={coins}
            useCoins={useCoins}
            coinsToUse={coinsToUse}
            maxCoinsUsable={maxCoinsUsable}
            coinsApplied={coinsApplied}
            remainingCoins={remainingCoinsAfterUse}
            onUseCoinsChange={(checked) => {
              setUseCoins(checked);
              if (checked) {
                setCoinsToUse(getMaxUsableCoins(total, coins, MINIMUM_PAYMENT));
              } else {
                setCoinsToUse(0);
              }
            }}
            onCoinsToUseChange={(value) => {
              const maxCoins = getMaxUsableCoins(total, coins, MINIMUM_PAYMENT);
              setCoinsToUse(Math.max(0, Math.min(value, maxCoins)));
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
        </div>
    </AppPage>
  )
}

export default Checkout
