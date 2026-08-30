import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { CheckCircle2, Package, Truck } from 'lucide-react'
import apiClient from '../services/apiClient'
import AppPage from '../components/layout/AppPage'
import { PageScaffold } from '../components/app/PageScaffold'
import { Button, buttonVariants } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ErrorState } from '../components/ui/error-state'
import { PageSkeleton } from '../components/ui/Skeleton'
import { BrandLoader } from '../components/ui/brand-loader'
import { CheckoutStepIndicator } from '../components/marketplace/CheckoutStepIndicator'
import { SummaryPanel } from '../components/platform/SummaryPanel'
import { cn } from '../lib/utils'

function OrderConfirmation() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await apiClient.get(`/orders/${orderId}`)
        setOrder(response.data)
      } catch {
        setError('Unable to load order details')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [orderId])

  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`

  if (loading) {
    return (
      <AppPage title="Order confirmation" description="Loading your order…">
        <BrandLoader message="Confirming order details…" />
      </AppPage>
    )
  }

  if (error || !order) {
    return (
      <AppPage title="Order not found" description="We could not load this order.">
        <ErrorState title="Order not found" description={error || 'This order may have been removed.'} showHome={false} />
        <div className="flex justify-center gap-2 mt-4">
          <Button onClick={() => navigate('/orders')}>View all orders</Button>
          <Button variant="outline" onClick={() => navigate('/products')}>Marketplace</Button>
        </div>
      </AppPage>
    )
  }

  const coinDiscount = order.coinsUsed || 0

  const orderProgressStep = (() => {
    if (order.orderStatus === 'CANCELLED') return 1
    const map = { PENDING: 1, CONFIRMED: 2, SHIPPED: 3, DELIVERED: 4 }
    return map[order.orderStatus] || 1
  })()

  return (
    <AppPage
      title="Order confirmed"
      description="Thank you for your purchase. We'll keep you updated on delivery."
      meta={
        <>
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Confirmed
          </Badge>
          <span className="text-muted-foreground">Order #FZ{order.id}</span>
        </>
      }
      actions={
        <Button variant="outline" onClick={() => navigate('/orders')}>
          View all orders
        </Button>
      }
    >
      <PageScaffold
        aside={
          <>
            <SummaryPanel title="Order progress" description="Typical delivery timeline.">
              <CheckoutStepIndicator
                steps={['Placed', 'Confirmed', 'Shipped', 'Delivered']}
                currentStep={orderProgressStep}
                totalSteps={4}
              />
              {order.orderStatus === 'CANCELLED' && (
                <p className="text-sm text-destructive mt-4">This order was cancelled.</p>
              )}
            </SummaryPanel>
            <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Delivery
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p>Expected delivery: 3–5 business days</p>
              <p>Status: <span className="font-medium text-foreground">{order.orderStatus || 'Processing'}</span></p>
              <p>Payment: <span className="font-medium text-foreground">{order.paymentStatus || 'Pending'}</span></p>
            </CardContent>
          </Card>
          </>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Order items
            </CardTitle>
            <CardDescription>Items included in this order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items?.length ? (
              order.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex justify-between items-center rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty {item.quantity} {item.unit}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(item.totalPrice)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No line items returned.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {coinDiscount > 0 && (
              <div className="flex justify-between text-primary font-medium">
                <span>Coin discount ({coinDiscount} coins)</span>
                <span>- {formatCurrency(coinDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax & charges</span>
              <span>{formatCurrency(order.taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-border pt-3">
              <span>Final amount</span>
              <span className="text-primary">{formatCurrency(order.finalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/products')}>Browse marketplace</Button>
          <Link to="/support" className={cn(buttonVariants({ variant: 'outline' }))}>
            Need help?
          </Link>
        </div>
      </PageScaffold>
    </AppPage>
  )
}

export default OrderConfirmation
