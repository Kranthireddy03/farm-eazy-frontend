/**
 * Shopping cart — review items, apply coins, proceed to checkout.
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import AppPage from '../components/layout/AppPage'
import apiClient from '../services/apiClient'
import ProductService from '../services/ProductService'
import { KpiSection } from '../components/app/KpiSection'
import { PageScaffold } from '../components/app/PageScaffold'
import { CartLineItem } from '../components/marketplace/CartLineItem'
import { OrderSummaryPanel } from '../components/marketplace/OrderSummaryPanel'
import { KpiCard } from '../components/ui/kpi-card'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/ui/empty-state'

import {
  calculateCartTotals,
  COIN_VALUE,
} from '../lib/marketplace'

function Cart() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [cartItems, setCartItems] = useState([])
  const [coins, setCoins] = useState(0)
  const [useCoins, setUseCoins] = useState(false)
  const [coinsToUse, setCoinsToUse] = useState(0)
  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    loadCart()
    fetchCoins()
  }, [])

  const loadCart = () => {
    const savedCart = localStorage.getItem('farmeazy_cart')
    if (savedCart) setCartItems(JSON.parse(savedCart))
  }

  const fetchCoins = async () => {
    try {
      const response = await apiClient.get('/coins')
      setCoins(response.data.totalCoins || 0)
    } catch {
      setCoins(0)
    }
  }

  const saveCart = (items) => {
    localStorage.setItem('farmeazy_cart', JSON.stringify(items))
    setCartItems(items)
    window.dispatchEvent(new Event('cart-updated'))
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    const item = cartItems.find((i) => i.id === productId)
    if (item && newQuantity > item.availableQuantity) {
      showToast(`Only ${item.availableQuantity} items available`, 'warning')
      return
    }
    saveCart(
      cartItems.map((i) => (i.id === productId ? { ...i, quantity: newQuantity } : i)),
    )
  }

  const removeFromCart = async (productId) => {
    const item = cartItems.find((i) => i.id === productId)
    if (item) {
      try {
        await ProductService.releaseProductQuantity(productId, item.quantity)
      } catch (error) {
        showToast(
          `Failed to release stock: ${error?.response?.data?.message || error.message}`,
          'error',
        )
      }
    }
    saveCart(cartItems.filter((i) => i.id !== productId))
    showToast('Item removed from cart', 'success')
  }

  const { subtotal, tax, total, savings } = calculateCartTotals(cartItems)

  const handleUseCoins = (checked) => {
    setUseCoins(checked)
    if (checked) {
      setCoinsToUse(Math.min(coins, Math.floor(total)))
    } else {
      setCoinsToUse(0)
    }
  }

  const finalAmount = Math.max(0, total - coinsToUse * COIN_VALUE)

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      showToast('Your cart is empty', 'warning')
      return
    }
    try {
      setCheckingOut(true)
      localStorage.setItem(
        'farmeazy_checkout_coins',
        JSON.stringify({ useCoins, coinsToUse }),
      )
      navigate('/checkout')
    } finally {
      setCheckingOut(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <AppPage title="Shopping cart" description="Review items before checkout.">
        <EmptyState
          title="Your cart is empty"
          description="Discover products from verified sellers and checkout securely when you're ready."
          action={
            <Button onClick={() => navigate('/buying')} className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Browse marketplace
            </Button>
          }
        />
      </AppPage>
    )
  }

  return (
    <AppPage
      title="Shopping cart"
      description={`${cartItems.length} item(s) ready for checkout`}
      actions={
        <Button variant="outline" onClick={() => navigate('/buying')}>
          Continue shopping
        </Button>
      }
    >
      <KpiSection>
        <KpiCard title="Subtotal" value={`₹${subtotal.toFixed(2)}`} hint="Before tax" />
        <KpiCard title="Tax" value={`₹${tax.toFixed(2)}`} hint="18% GST" />
        <KpiCard title="Coins" value={coins} hint="Available balance" />
        <KpiCard title="Savings" value={`₹${savings.toFixed(2)}`} hint="From discounts" />
      </KpiSection>

      <PageScaffold
        aside={
          <OrderSummaryPanel
            subtotal={subtotal}
            tax={tax}
            total={total}
            savings={savings}
            finalAmount={finalAmount}
            coins={coins}
            useCoins={useCoins}
            coinsToUse={coinsToUse}
            coinsApplied={useCoins ? coinsToUse : 0}
            onUseCoinsChange={handleUseCoins}
            onCoinsToUseChange={(v) => setCoinsToUse(Math.min(v, coins, Math.floor(total)))}
            variant="cart"
            primaryAction={
              <Button className="w-full" onClick={handleCheckout} disabled={checkingOut}>
                {checkingOut ? 'Redirecting…' : 'Proceed to checkout'}
              </Button>
            }
            secondaryAction={
              <Button variant="outline" className="w-full" onClick={() => navigate('/buying')}>
                Continue shopping
              </Button>
            }
          />
        }
      >
        <div className="space-y-4">
          {cartItems.map((item) => (
            <CartLineItem
              key={item.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
            />
          ))}
        </div>
      </PageScaffold>
    </AppPage>
  )
}

export default Cart
