import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import { useCheckout } from '../hooks/useCheckout'
import apiClient from '../services/apiClient'
import { sendNotification } from '../components/NotificationCenter'
import AppPage from '../components/layout/AppPage'
import { PageScaffold } from '../components/app/PageScaffold'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
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

  const coinsApplied = useCoins ? Math.min(coinsToUse, maxUsableCoins) : 0
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
          finalAmount: finalAmount,
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
            <Button onClick={() => navigate('/buying')}>Continue shopping</Button>
          </CardContent>
        </Card>
      </AppPage>
    )
  }

  return (
    <AppPage
      title="Checkout"
      description="Review items, delivery, and payment before placing your order."
      meta={
        <>
          <Badge variant="muted">{cartItems.length} items</Badge>
          <Badge variant="outline">₹{finalAmount.toFixed(2)} to pay</Badge>
        </>
      }
    >
        <CheckoutStepIndicator
          steps={['Review', 'Delivery', 'Payment']}
          currentStep={checkoutStep}
          totalSteps={3}
        />

        {hasOutOfAreaItems && (
          <InfoPanel
            variant="destructive"
            title="Delivery unavailable"
            description="One or more items cannot be delivered to your selected location. Remove them before placing the order."
            className="mt-6"
          />
        )}

        <PageScaffold
          aside={
            <OrderSummaryPanel
              subtotal={subtotal}
              tax={tax}
              total={total}
              finalAmount={finalAmount}
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
          }
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
    </AppPage>
  )
}

export default Checkout
