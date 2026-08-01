/**
 * Shopping cart — review items, apply coins, proceed to checkout.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useToast } from '../hooks/useToast'
import { useCart } from '../hooks/useCart'
import AppPage from '../components/layout/AppPage'
import apiClient from '../services/apiClient'
import { KpiSection } from '../components/app/KpiSection'
import { PageScaffold } from '../components/app/PageScaffold'
import { CartLineItem } from '../components/marketplace/CartLineItem'
import { OrderSummaryPanel } from '../components/marketplace/OrderSummaryPanel'
import { KpiCard } from '../components/ui/kpi-card'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/ui/empty-state'

function Cart() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const {
    cartItems,
    coins,
    useCoins,
    coinsToUse,
    totals: { subtotal, tax, total, savings },
    finalAmount,
    updateQuantity,
    removeFromCart,
    handleUseCoins,
    persistCheckoutCoins,
    setAvailableCoins,
    setCoinsToUse,
    isEmpty,
  } = useCart({ onToast: showToast })

  const [checkingOut, setCheckingOut] = useState(false)

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await apiClient.get('/coins')
        setAvailableCoins(response.data.totalCoins || 0)
      } catch {
        setAvailableCoins(0)
      }
    }
    fetchCoins()
  }, [setAvailableCoins])

  const handleCheckout = async () => {
    if (isEmpty) {
      showToast('Your cart is empty', 'warning')
      return
    }
    try {
      setCheckingOut(true)
      persistCheckoutCoins()
      navigate('/checkout')
    } finally {
      setCheckingOut(false)
    }
  }

  if (isEmpty) {
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
