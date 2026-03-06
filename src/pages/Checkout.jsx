import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import apiClient from '../services/apiClient'
import LocationPicker from '../components/LocationPicker'
import { sendNotification } from '../components/NotificationCenter'

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
    console.log("Retry payment clicked");
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
  
  // Constants
  const MINIMUM_PAYMENT = 1 // Minimum payment required in rupees
  
  // Calculate max coins that can be used while maintaining minimum payment
  const getMaxUsableCoins = (totalAmount, availableCoins) => {
    const maxAllowedDiscount = Math.max(0, totalAmount - MINIMUM_PAYMENT)
    return Math.min(availableCoins, Math.floor(maxAllowedDiscount))
  }
  
  // Restore coin discount UI logic with 1 rupee minimum
  const handleCoinToggle = () => {
    setUseCoins(!useCoins);
    if (!useCoins) {
      const maxCoins = getMaxUsableCoins(total, coins)
      setCoinsToUse(maxCoins);
    } else {
      setCoinsToUse(0);
    }
  };

  const handleCoinsToUseChange = (e) => {
    const maxCoins = getMaxUsableCoins(total, coins)
    const value = Math.max(0, Math.min(Number(e.target.value), maxCoins));
    setCoinsToUse(value);
  };
  
  const handleCoinSliderChange = (e) => {
    const maxCoins = getMaxUsableCoins(total, coins)
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
  const TAX_RATE = 0.18
  const COIN_VALUE = 1

  useEffect(() => {
    loadCheckoutData()
  }, [])

  // Cleanup retry interval on unmount
  useEffect(() => {
    return () => {
      if (retryInterval) clearInterval(retryInterval);
    };
  }, [retryInterval]);

  // Retry Screen at top of render
  if (retryActive && pendingOrderId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-900/30">
        <div className="bg-slate-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center border border-slate-700">
          <h2 className="text-2xl font-bold text-amber-400 mb-4">Order On Hold</h2>
          <p className="mb-2 text-slate-300">Your order is on hold due to payment failure.</p>
          <p className="mb-4 text-slate-300">
            You have 
            <span className="font-bold text-white">
              {Math.floor(retryTimer/60)}:
              {(retryTimer % 60).toString().padStart(2, '0')}
            </span> 
            minutes to retry payment.
          </p>
          <button
            onClick={handleRetryPayment}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition mb-2"
            disabled={razorpayLoading}
          >
            Retry Payment
          </button>
          <button
            onClick={() => {
              setRetryActive(false);
              navigate('/');
            }}
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-lg transition"
          >
            Cancel Order
          </button>
        </div>
      </div>
    );
  }

  // Processing Overlay - shows during payment/order processing
  if (processingState.active) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-10 max-w-md w-full text-center border border-slate-700">
          {/* Animated spinner */}
          <div className="relative mx-auto w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-slate-600 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-green-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" style={{animationDuration: '1.5s', animationDirection: 'reverse'}}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl">{processingState.step === 1 ? '💳' : processingState.step === 2 ? '📦' : '🚀'}</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            {processingState.message || 'Processing...'}
          </h2>
          
          {/* Progress indicator */}
          <div className="mt-6 mb-4">
            <div className="flex justify-between mb-2">
              {['Payment', 'Order', 'Complete'].map((label, idx) => (
                <div key={label} className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    idx + 1 <= processingState.step 
                      ? 'bg-green-500 text-white scale-110' 
                      : 'bg-slate-600 text-slate-400'
                  }`}>
                    {idx + 1 <= processingState.step ? '✓' : idx + 1}
                  </div>
                  <span className={`text-xs mt-1 ${idx + 1 <= processingState.step ? 'text-green-400' : 'text-slate-500'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-orange-500 transition-all duration-500 ease-out"
                style={{width: `${(processingState.step / processingState.totalSteps) * 100}%`}}
              ></div>
            </div>
          </div>

          <p className="text-slate-400 text-sm animate-pulse">
            Please wait, do not close or refresh this page...
          </p>
        </div>
      </div>
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

  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => {
      // Use discounted price if available, otherwise use regular price
      const itemPrice = (item.discountedPrice && item.discountedPrice > 0) ? item.discountedPrice : item.price
      return sum + (itemPrice * item.quantity)
    }, 0)
    const tax = subtotal * TAX_RATE
    const total = subtotal + tax
    return { subtotal, tax, total }
  }

  const { subtotal, tax, total } = calculateTotals();
  // Updated: Calculate max usable coins based on minimum payment requirement
  const maxCoinsUsable = getMaxUsableCoins(total, coins);
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
    console.log('[DEBUG] Checkout triggered. Cart:', cartItems, 'Coins:', coins, 'UseCoins:', useCoins, 'CoinsToUse:', coinsToUse, 'CoinsApplied:', coinsApplied, 'FinalAmount:', finalAmount, 'SelectedPayment:', selectedPayment);
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
        console.log('[DEBUG] Creating Razorpay order with:', paymentData, `(Rupees: ₹${finalAmount}, Paise: ${Math.round(finalAmount * 100)})`);
        const orderRes = await apiClient.post('/payment/create-order', paymentData);
        if (orderRes.status !== 200) {
          console.error('Backend order creation failed:', orderRes);
          showToast('Order creation failed: ' + (orderRes.data || orderRes.statusText), 'error');
          setRazorpayLoading(false);
          setCheckingOut(false);
          return;
        }
        const order = orderRes.data;
        console.log('[DEBUG] Razorpay order response:', order);

        const options = {
          key: order.key_id,
          amount: order.amount, // in paise
          currency: order.currency,
          name: 'FarmEazy',
          description: 'Order Payment',
          order_id: order.id,
          handler: async function (response) {
            console.log('[DEBUG] Razorpay handler response:', response);
            
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
              console.log('[DEBUG] Payment verify result:', verifyResult.data);
              
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
                console.log('[DEBUG] Placing order after payment success:', orderData);
                console.log('[DEBUG] addressId type:', typeof orderData.addressId, 'value:', orderData.addressId);
                console.log('[DEBUG] items[0]:', orderData.items[0]);
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
                  console.error('[DEBUG] Order creation failed:', orderErr);
                  console.error('[DEBUG] Order error response:', orderErr.response?.data);
                  setProcessingState({ active: false, message: '', step: 0, totalSteps: 3 });
                  const errorMsg = orderErr.response?.data?.message || orderErr.response?.data?.error || orderErr.message || 'Unknown error';
                  showToast(`Order failed: ${errorMsg}. Payment was successful - contact support.`, 'error');
                }
                
              } else {
                // Payment failed, create pending order and allow retry
                setProcessingState({ active: false, message: '', step: 0, totalSteps: 3 });
                const failedOrderData = {
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
                  paymentStatus: 'FAILED',
                  orderStatus: 'PENDING',
                  paymentId: response.razorpay_payment_id
                };
                console.log('[DEBUG] Creating pending order after payment failure:', failedOrderData);
                const pendingOrder = await apiClient.post('/orders', failedOrderData);
                setPendingOrderId(pendingOrder.data.id);
                setRetryActive(true);
                setRetryTimer(600); // 10 minutes
                showToast('Payment failed. Order is on hold for 10 minutes. You can retry payment.', 'warning');
              }
            } catch (err) {
              console.error('[DEBUG] Payment verification failed:', err);
              setProcessingState({ active: false, message: '', step: 0, totalSteps: 3 });
              showToast('Payment verification failed. Contact support.', 'error');
            }
          },
          prefill: {
            email: paymentData.email,
            contact: paymentData.phone
          },
          theme: { color: '#22c55e' },
          modal: {
            ondismiss: async function () {
              // Payment failed or closed, create pending order and start retry timer
              const failedOrderData = {
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
                paymentMethod: 'RAZORPAY',
                addressId: selectedAddress,
                paymentStatus: 'FAILED',
                orderStatus: 'PENDING'
              };
              try {
                const pendingOrder = await apiClient.post('/orders', failedOrderData);
                setPendingOrderId(pendingOrder.data.id);
                setRetryActive(true);
                setRetryTimer(600); // 10 minutes in seconds
                showToast('Payment failed. Order is on hold for 10 minutes. You can retry payment.', 'warning');
                // Start timer
                if (retryInterval) clearInterval(retryInterval);
                const interval = setInterval(() => {
                  setRetryTimer(prev => {
                    if (prev <= 1) {
                      clearInterval(interval);
                      setRetryActive(false);
                      // Optionally call backend to cancel order
                      apiClient.patch(`/orders/${pendingOrder.data.id}/cancel`);
                      showToast('Order cancelled due to payment timeout.', 'error');
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
                setRetryInterval(interval);
              } catch (err) {
                showToast('Failed to create pending order.', 'error');
              }
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
      showToast('Failed to place order: ' + error.message, 'error')
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-6xl mb-4">🛒</p>
          <h1 className="text-3xl font-bold text-white mb-2">Your Cart is Empty</h1>
          <p className="text-slate-400 mb-8">Add products to proceed with checkout</p>
          <button
            onClick={() => navigate('/buying')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">🛍️ Checkout</h1>
        <p className="text-slate-400 mb-8">Complete your order securely</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items Review */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map(item => {
                  const itemPrice = (item.discountedPrice && item.discountedPrice > 0) ? item.discountedPrice : item.price
                  const hasDiscount = item.discountPercentage && item.discountPercentage > 0

                  return (
                    <div key={item.id} className="flex justify-between items-start pb-4 border-b border-slate-700">
                      <div className="flex-1">
                        <p className="font-semibold text-white">{item.productName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {hasDiscount ? (
                            <>
                              <p className="text-sm text-slate-400">Qty: {item.quantity} × ₹{itemPrice.toFixed(2)}</p>
                              <span className="line-through text-slate-500 text-xs">₹{item.price.toFixed(2)}</span>
                              <span className="bg-green-600 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                {item.discountPercentage}% OFF
                              </span>
                            </>
                          ) : (
                            <p className="text-sm text-slate-400">Qty: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                          )}
                        </div>
                        {hasDiscount && (
                          <p className="text-xs text-green-400 font-semibold mt-1">
                            Saving ₹{((item.price - itemPrice) * item.quantity).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-white">₹{(itemPrice * item.quantity).toFixed(2)}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">💳 Payment Method</h2>
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
                    <p className="font-semibold text-white">💵 Cash on Delivery</p>
                    <p className="text-sm text-slate-400">Pay when your order arrives</p>
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
                    <p className="font-semibold text-white">🪙 Razorpay (UPI/Card/Netbanking)</p>
                    <p className="text-sm text-slate-400">Pay securely online with Razorpay</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Address selection & form - Enhanced with Map */}
            <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-4">📍 Delivery Address</h2>

              {/* Existing addresses dropdown */}
              {addresses.length > 0 && !showAddressForm && (
                <div className="mb-4 space-y-3">
                  <p className="text-sm text-slate-400">Select from saved addresses:</p>
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
                            <span className="font-semibold text-white">{addr.fullName}</span>
                            <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded">{addr.addressType}</span>
                          </div>
                          <p className="text-sm text-slate-300 mt-1">{addr.addressLine1}</p>
                          {addr.addressLine2 && <p className="text-sm text-slate-400">{addr.addressLine2}</p>}
                          <p className="text-sm text-slate-400">{addr.city}, {addr.state} - {addr.postalCode}</p>
                          <p className="text-sm text-slate-500 mt-1">📱 {addr.phoneNumber}</p>
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
          <div className="bg-slate-800 rounded-lg shadow-lg p-6 h-fit sticky top-20 border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-6">Price Breakdown</h2>


            <div className="space-y-3 border-b border-slate-600 pb-4 mb-4">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal:</span>
                <span className="font-semibold text-white">₹{subtotal.toFixed(2)}</span>
              </div>

              {/* Coin discount UI - Improved with slider and minimum payment info */}
              <div className="bg-slate-700/50 rounded-lg p-4 my-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useCoins}
                      onChange={handleCoinToggle}
                      id="use-coins-toggle"
                      className="w-5 h-5 accent-orange-500 cursor-pointer"
                      disabled={maxCoinsUsable === 0}
                    />
                    <label htmlFor="use-coins-toggle" className="text-sm text-slate-200 font-semibold cursor-pointer flex items-center gap-2">
                      <span className="text-lg">🪙</span> Use Coins
                    </label>
                  </div>
                  <span className="text-sm text-orange-400 font-bold">{coins} coins available</span>
                </div>

                {coins > 0 && maxCoinsUsable === 0 && (
                  <div className="bg-amber-900/30 border border-amber-600/30 rounded-lg p-2 mb-2">
                    <p className="text-xs text-amber-300">⚠️ Order total is too low to use coins (min ₹{MINIMUM_PAYMENT} payment required)</p>
                  </div>
                )}

                {useCoins && maxCoinsUsable > 0 && (
                  <div className="space-y-3 mt-3 border-t border-slate-600 pt-3">
                    {/* Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>0 coins</span>
                        <span>{maxCoinsUsable} coins (max)</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={maxCoinsUsable}
                        value={coinsToUse}
                        onChange={handleCoinSliderChange}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        style={{
                          background: `linear-gradient(to right, #f97316 0%, #f97316 ${(coinsToUse / maxCoinsUsable) * 100}%, #475569 ${(coinsToUse / maxCoinsUsable) * 100}%, #475569 100%)`
                        }}
                      />
                    </div>
                    
                    {/* Number input and summary */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">Use:</span>
                        <input
                          type="number"
                          min="0"
                          max={maxCoinsUsable}
                          value={coinsToUse}
                          onChange={handleCoinsToUseChange}
                          className="px-3 py-2 bg-slate-600 border border-slate-500 text-white rounded-lg w-24 text-center font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="text-sm text-slate-300">coins</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-green-400 font-bold">-₹{(coinsToUse * COIN_VALUE).toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Remaining coins info */}
                    <div className="flex justify-between text-xs text-slate-400 bg-slate-800 rounded p-2">
                      <span>Remaining after use:</span>
                      <span className="text-orange-400 font-semibold">{remainingCoinsAfterUse} coins</span>
                    </div>

                    {/* Minimum payment notice */}
                    <div className="bg-blue-900/30 border border-blue-600/30 rounded-lg p-2">
                      <p className="text-xs text-blue-300 flex items-center gap-1">
                        <span>ℹ️</span> Minimum payment required: <span className="font-bold">₹{MINIMUM_PAYMENT}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {coinsApplied > 0 && (
                <div className="flex justify-between text-green-400 font-semibold">
                  <span>🪙 Coin Discount ({coinsApplied} coins):</span>
                  <span>- ₹{(coinsApplied * COIN_VALUE).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-300">
                <span>Tax & Charges (18% GST):</span>
                <span className="font-semibold text-white">₹{tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold mb-6 text-green-400">
              <span>Final Amount:</span>
              <span>₹{finalAmount.toFixed(2)}</span>
            </div>

            {coinsApplied > 0 && (
              <div className="bg-green-900/30 border-l-4 border-green-500 p-3 mb-4 rounded">
                <p className="text-sm text-green-300 font-semibold">💰 You're saving ₹{(coinsApplied * COIN_VALUE).toFixed(2)}</p>
                <p className="text-xs text-green-400 mt-1">Using {coinsApplied} coins for discount</p>
              </div>
            )}

            {selectedPayment === 'CASH_ON_DELIVERY' && (
              <div className="bg-blue-900/30 border-l-4 border-blue-500 p-3 mb-4 rounded">
                <p className="text-sm text-blue-300 font-semibold">✓ Cash on Delivery</p>
                <p className="text-xs text-blue-400 mt-1">Expected delivery: 3-5 business days</p>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={checkingOut || (selectedPayment === 'CASH_ON_DELIVERY' && !selectedAddress)}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition text-lg"
            >
              {checkingOut ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Processing...
                </span>
              ) : (
                '✓ Place Order'
              )}
            </button>

            <button
              onClick={() => navigate('/cart')}
              className="w-full mt-3 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Back to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
