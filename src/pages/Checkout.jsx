/**
 * Comprehensive Checkout Page
 * 
 * Features:
 * - Order summary
 * - Multiple payment options (UPI, PhonePay, QR, Cash on Delivery)
 * - Address management for COD
 * - QR code generation for UPI payments
 * - Order confirmation flow
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../hooks/useToast'
import apiClient from '../services/apiClient'

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
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [cartItems, setCartItems] = useState([])
  const [coins, setCoins] = useState(0)
  const [useCoins, setUseCoins] = useState(false)
  const [coinsToUse, setCoinsToUse] = useState(0)
  const [selectedPayment, setSelectedPayment] = useState('CASH_ON_DELIVERY')
  const [razorpayLoading, setRazorpayLoading] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)

  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
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

  const loadCheckoutData = () => {
    const savedCart = JSON.parse(localStorage.getItem('farmeazy_cart') || '[]')
    setCartItems(savedCart)
    const savedCoins = JSON.parse(localStorage.getItem('farmeazy_checkout_coins') || '{}')
    setUseCoins(Boolean(savedCoins.useCoins))
    setCoinsToUse(Number(savedCoins.coinsToUse || 0))
    fetchCoins()
    fetchAddresses()
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

  const { subtotal, tax, total } = calculateTotals()
  const maxCoinsUsable = Math.min(coins, Math.floor(total))
  const coinsApplied = useCoins ? Math.min(coinsToUse, maxCoinsUsable) : 0
  const finalAmount = Math.max(0, total - (coinsApplied * COIN_VALUE))

  const handleAddressChange = (e) => {
    const { name, value } = e.target
    setAddressForm({ ...addressForm, [name]: value })
  }

  const handleAddressSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await apiClient.post('/addresses', addressForm)
      showToast('Address added successfully', 'success')
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
        setRazorpayLoading(true)
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          showToast('Failed to load Razorpay. Please try again.', 'error');
          setRazorpayLoading(false)
          setCheckingOut(false)
          return;
        }
        // Create Razorpay order on backend
        const paymentData = {
          amount: Math.round(finalAmount * 100), // in paise
          email: addresses.find(a => a.id === selectedAddress)?.email || '',
          phone: addresses.find(a => a.id === selectedAddress)?.phoneNumber || ''
        };
        const orderRes = await apiClient.post('/payment/create-order', paymentData);
        const order = orderRes.data;

        const options = {
          key: order.key_id || process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: order.amount,
          currency: order.currency,
          name: 'FarmEazy',
          description: 'Order Payment',
          order_id: order.id,
          handler: async function (response) {
            // Verify payment on backend
            try {
              await apiClient.post('/payment/verify', {
                orderId: order.id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                email: paymentData.email,
                phone: paymentData.phone
              });
              // Place order in system
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
                paymentMethod: 'RAZORPAY',
                addressId: selectedAddress,
                paymentId: response.razorpay_payment_id
              };
              const placedOrder = await apiClient.post('/orders', orderData);
              localStorage.removeItem('farmeazy_cart')
              localStorage.removeItem('farmeazy_checkout_coins')
              showToast('✅ Payment successful & order placed!', 'success')
              navigate(`/order-confirmation/${placedOrder.data.id}`)
            } catch (err) {
              showToast('Payment verification failed. Contact support.', 'error')
            }
          },
          prefill: {
            email: paymentData.email,
            contact: paymentData.phone
          },
          theme: { color: '#22c55e' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        setRazorpayLoading(false)
        setCheckingOut(false)
        return;
      }

      // Default flow for other payment methods
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
        paymentMethod: selectedPayment,
        addressId: selectedAddress
      }

      // Call order creation API
      const response = await apiClient.post('/orders', orderData)
      localStorage.removeItem('farmeazy_cart')
      localStorage.removeItem('farmeazy_checkout_coins')
      showToast('✅ Order placed successfully!', 'success')

      // Redirect based on payment method
      if (selectedPayment === 'CASH_ON_DELIVERY') {
        navigate(`/order-confirmation/${response.data.id}`)
      } else if (selectedPayment === 'UPI') {
        openUPIPayment(response.data.id)
      } else if (selectedPayment === 'PHONEPAY') {
        openPhonePayPayment(response.data.id)
      }
    } catch (error) {
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-6xl mb-4">🛒</p>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">Add products to proceed with checkout</p>
          <button
            onClick={() => navigate('/buying')}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-lg transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">🛍️ Checkout</h1>
        <p className="text-gray-600 mb-8">Complete your order securely</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items Review */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-4">
                {cartItems.map(item => {
                  const itemPrice = (item.discountedPrice && item.discountedPrice > 0) ? item.discountedPrice : item.price
                  const hasDiscount = item.discountPercentage && item.discountPercentage > 0

                  return (
                    <div key={item.id} className="flex justify-between items-start pb-4 border-b">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{item.productName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {hasDiscount ? (
                            <>
                              <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{itemPrice.toFixed(2)}</p>
                              <span className="line-through text-gray-400 text-xs">₹{item.price.toFixed(2)}</span>
                              <span className="bg-green-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                {item.discountPercentage}% OFF
                              </span>
                            </>
                          ) : (
                            <p className="text-sm text-gray-600">Qty: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                          )}
                        </div>
                        {hasDiscount && (
                          <p className="text-xs text-green-600 font-semibold mt-1">
                            Saving ₹{((item.price - itemPrice) * item.quantity).toFixed(2)}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-gray-800">₹{(itemPrice * item.quantity).toFixed(2)}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">💳 Payment Method</h2>
              
              <div className="space-y-3">
                {/* Cash on Delivery */}
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition" 
                       style={{ borderColor: selectedPayment === 'CASH_ON_DELIVERY' ? '#f97316' : '#e5e7eb',
                               backgroundColor: selectedPayment === 'CASH_ON_DELIVERY' ? '#fff7ed' : '#fff' }}>
                  <input
                    type="radio"
                    name="payment"
                    value="CASH_ON_DELIVERY"
                    checked={selectedPayment === 'CASH_ON_DELIVERY'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-800">💵 Cash on Delivery</p>
                    <p className="text-sm text-gray-600">Pay when your order arrives</p>
                    <p className="text-xs text-green-600 mt-1">✓ Free | Delivery in 3-5 days</p>
                  </div>
                </label>

                {/* UPI */}
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition" 
                       style={{ borderColor: selectedPayment === 'UPI' ? '#f97316' : '#e5e7eb',
                               backgroundColor: selectedPayment === 'UPI' ? '#fff7ed' : '#fff' }}>
                  <input
                    type="radio"
                    name="payment"
                    value="UPI"
                    checked={selectedPayment === 'UPI'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-gray-800">📱 UPI Payment</p>
                    <p className="text-sm text-gray-600">Pay using any UPI app</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="bg-gray-100 px-3 py-1 rounded text-sm text-gray-800 flex-1">{UPI_ID}</code>
                      <button
                        onClick={copyUPI}
                        className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </label>

                {/* PhonePay */}
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition" 
                       style={{ borderColor: selectedPayment === 'PHONEPAY' ? '#f97316' : '#e5e7eb',
                               backgroundColor: selectedPayment === 'PHONEPAY' ? '#fff7ed' : '#fff' }}>
                  <input
                    type="radio"
                    name="payment"
                    value="PHONEPAY"
                    checked={selectedPayment === 'PHONEPAY'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-gray-800">📱 PhonePay</p>
                    <p className="text-sm text-gray-600">Fast and secure payment</p>
                    <div className="mt-2 flex items-center gap-2">
                      <code className="bg-gray-100 px-3 py-1 rounded text-sm text-gray-800 flex-1">{PHONE_PAY_ID}</code>
                      <button
                        onClick={copyPhonePay}
                        className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </label>

                {/* Razorpay */}
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition" 
                       style={{ borderColor: selectedPayment === 'RAZORPAY' ? '#22c55e' : '#e5e7eb',
                               backgroundColor: selectedPayment === 'RAZORPAY' ? '#f0fdf4' : '#fff' }}>
                  <input
                    type="radio"
                    name="payment"
                    value="RAZORPAY"
                    checked={selectedPayment === 'RAZORPAY'}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-gray-800">🪙 Razorpay (UPI/Card/Netbanking)</p>
                    <p className="text-sm text-gray-600">Pay securely online with Razorpay</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Address selection & form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📍 Delivery Address</h2>

              {addresses.length > 0 && (
                <div className="mb-4">
                  <select
                    value={selectedAddress || ''}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {addresses.map(addr => (
                      <option key={addr.id} value={addr.id}>
                        {addr.fullName} - {addr.addressLine1}, {addr.city}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                {showAddressForm ? '❌ Cancel' : '➕ Add New Address'}
              </button>

              {showAddressForm && (
                <form onSubmit={handleAddressSubmit} className="mt-4 space-y-3">
                  <input
                    type="text"
                    name="fullName"
                    placeholder="Full Name"
                    value={addressForm.fullName}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="Phone Number"
                    pattern="[0-9]{10}"
                    value={addressForm.phoneNumber}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="text"
                    name="addressLine1"
                    placeholder="Address Line 1"
                    value={addressForm.addressLine1}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    value={addressForm.state}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <input
                    type="text"
                    name="postalCode"
                    placeholder="Postal Code"
                    pattern="[0-9]{6}"
                    value={addressForm.postalCode}
                    onChange={handleAddressChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    Save Address
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-white rounded-lg shadow-lg p-6 h-fit sticky top-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Price Breakdown</h2>

            <div className="space-y-3 border-b pb-4 mb-4">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>

              {coinsApplied > 0 && (
                <div className="flex justify-between text-green-600 font-semibold">
                  <span>🪙 Coin Discount ({coinsApplied} coins):</span>
                  <span>- ₹{(coinsApplied * COIN_VALUE).toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-700">
                <span>Tax & Charges (18% GST):</span>
                <span className="font-semibold">₹{tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between text-xl font-bold mb-6 text-green-600">
              <span>Final Amount:</span>
              <span>₹{finalAmount.toFixed(2)}</span>
            </div>

            {coinsApplied > 0 && (
              <div className="bg-green-50 border-l-4 border-green-500 p-3 mb-4 rounded">
                <p className="text-sm text-green-800 font-semibold">💰 You're saving ₹{(coinsApplied * COIN_VALUE).toFixed(2)}</p>
                <p className="text-xs text-green-700 mt-1">Using {coinsApplied} coins for discount</p>
              </div>
            )}

            {selectedPayment === 'CASH_ON_DELIVERY' && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded">
                <p className="text-sm text-blue-800 font-semibold">✓ Cash on Delivery</p>
                <p className="text-xs text-blue-700 mt-1">Expected delivery: 3-5 business days</p>
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
              className="w-full mt-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg transition"
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
