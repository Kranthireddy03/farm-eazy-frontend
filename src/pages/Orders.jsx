import { useEffect, useState, useMemo } from 'react'
import ProductMediaCarousel from '../components/ProductMediaCarousel'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useToast } from '../hooks/useToast'
import AppPage from '../components/layout/AppPage'
import CancelOrderModal from '../components/CancelOrderModal'
import RefundDetailsModal from '../components/RefundDetailsModal'
import { KpiCard } from '../components/ui/kpi-card'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ErrorState } from '../components/ui/error-state'
import { EmptyState } from '../components/ui/empty-state'
import { PageSkeleton } from '../components/ui/Skeleton'
import { FilterBar } from '../components/ui/filter-bar'
import { Package, ShoppingBag, Truck, IndianRupee } from 'lucide-react'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const ORDER_STATUS_STYLES = {
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  DELIVERED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  SHIPPED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PENDING: 'bg-muted text-muted-foreground',
}

const REFUND_STATUS_STYLES = {
  REFUND_DETAILS_REQUIRED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  REQUESTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  PROCESSING: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  PARTIALLY_REFUNDED: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
}

const STATUS_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

function Orders() {
  const dashboardWindow = window
  const refreshDashboardStats = () => {
    if (dashboardWindow.fetchStats) dashboardWindow.fetchStats()
  }

  const navigate = useNavigate()
  const { showToast } = useToast()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const debouncedSearch = useDebouncedValue(search)

  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [showRefundDetailsModal, setShowRefundDetailsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)

  const fetchOrders = async () => {
    try {
      const response = await apiClient.get('/orders')
      const list = Array.isArray(response.data) ? response.data : []
      setOrders(list)
      setError(null)
    } catch (err) {
      setError('Could not load orders')
    } finally {
      setLoading(false)
      refreshDashboardStats()
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const formatCurrency = (amount) => `₹${Number(amount || 0).toFixed(2)}`

  const orderMetrics = useMemo(() => {
    const total = orders.length
    const active = orders.filter((o) => !['CANCELLED', 'DELIVERED'].includes(o.orderStatus)).length
    const delivered = orders.filter((o) => o.orderStatus === 'DELIVERED').length
    const revenue = orders
      .filter((o) => o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + Number(o.finalAmount || 0), 0)
    return { total, active, delivered, revenue }
  }, [orders])

  const filteredOrders = useMemo(() => {
    let list = orders
    if (statusFilter !== 'ALL') {
      list = list.filter((o) => o.orderStatus === statusFilter)
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      list = list.filter(
        (o) =>
          String(o.id).includes(q) ||
          (o.orderStatus && o.orderStatus.toLowerCase().includes(q)) ||
          (o.items?.some((i) => i.productName?.toLowerCase().includes(q))),
      )
    }
    return list
  }, [orders, statusFilter, debouncedSearch])

  const handleCancelClick = (order) => {
    setSelectedOrder(order)
    setShowCancelModal(true)
  }

  const handleReturnClick = (order) => {
    setSelectedOrder(order)
    setShowReturnModal(true)
  }

  const handleRefundDetailsClick = (order) => {
    setSelectedOrder(order)
    setShowRefundDetailsModal(true)
  }

  const handleCancelSuccess = (result) => {
    showToast(result.message || 'Order cancelled successfully', 'success')
    fetchOrders()
  }

  const handleReturnSuccess = (result) => {
    showToast(result.message || 'Return request submitted successfully', 'success')
    fetchOrders()
  }

  const handleRefundDetailsSuccess = () => {
    showToast('Refund details saved. Your refund will be processed shortly.', 'success')
    fetchOrders()
  }

  const getRefundBadge = (order) => {
    if (!order.refundStatus || order.refundStatus === 'NOT_REQUESTED') return null
    const labels = {
      REFUND_DETAILS_REQUIRED: 'Add refund details',
      REQUESTED: 'Refund requested',
      APPROVED: 'Refund approved',
      PROCESSING: 'Processing refund',
      COMPLETED: 'Refunded',
      FAILED: 'Refund failed',
      REJECTED: 'Refund rejected',
      PARTIALLY_REFUNDED: 'Partial refund',
    }
    return (
      <Badge className={REFUND_STATUS_STYLES[order.refundStatus] || REFUND_STATUS_STYLES.REQUESTED}>
        {labels[order.refundStatus] || order.refundStatus}
      </Badge>
    )
  }

  if (loading) {
    return (
      <AppPage title="My Orders" description="View and manage your order history.">
        <PageSkeleton variant="cards" />
      </AppPage>
    )
  }

  if (error) {
    return (
      <AppPage title="My Orders" description="View and manage your order history.">
        <ErrorState
          title="Could not load orders"
          description={error}
          onRetry={fetchOrders}
          showHome={false}
        />
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => navigate('/buying')}>Back to shop</Button>
        </div>
      </AppPage>
    )
  }

  return (
    <AppPage
      title="My Orders"
      description="View and manage your order history."
      actions={
        <Button onClick={() => navigate('/buying')}>
          <ShoppingBag className="h-4 w-4" />
          Continue shopping
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title="Total orders" value={orderMetrics.total} hint="All time" icon={Package} />
          <KpiCard title="Active" value={orderMetrics.active} hint="In progress" icon={Truck} />
          <KpiCard title="Delivered" value={orderMetrics.delivered} hint="Completed" icon={Package} />
          <KpiCard title="Spend" value={formatCurrency(orderMetrics.revenue)} hint="Excluding cancelled" icon={IndianRupee} />
        </div>

        <FilterBar
          value={search}
          onChange={setSearch}
          placeholder="Search orders or products…"
          filters={STATUS_FILTERS}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />

        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Your order history will appear here once you make a purchase."
            action={<Button onClick={() => navigate('/buying')}>Start shopping</Button>}
          />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title="No matching orders"
            description="Try adjusting your search or status filter."
            action={<Button variant="outline" onClick={() => { setSearch(''); setStatusFilter('ALL') }}>Clear filters</Button>}
          />
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="overflow-hidden transition-shadow hover:shadow-md">
                <CardHeader className="pb-3 border-b border-border bg-muted/30">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                      <div>
                        <CardDescription>Order ID</CardDescription>
                        <CardTitle className="text-base font-semibold">#FZ{order.id}</CardTitle>
                      </div>
                      <div>
                        <CardDescription>Placed</CardDescription>
                        <p className="text-sm font-medium">{order.createdAt?.split('T')[0] || '—'}</p>
                      </div>
                      <div>
                        <CardDescription>Total</CardDescription>
                        <p className="text-sm font-semibold text-primary">{formatCurrency(order.finalAmount)}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={ORDER_STATUS_STYLES[order.orderStatus] || ORDER_STATUS_STYLES.PENDING}>
                          {order.orderStatus || 'PENDING'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Payment: {order.paymentStatus}</span>
                        {getRefundBadge(order)}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {order.items?.length > 0 && (
                  <CardContent className="pt-4 space-y-4">
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.productId}`} className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-20 shrink-0 rounded-md border border-border overflow-hidden">
                            <ProductMediaCarousel mediaUrls={item.mediaUrls || (item.imageUrls ? item.imageUrls.split(',') : [])} />
                          </div>
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
                            {item.discountedPrice !== undefined && item.discountedPrice < item.price ? (
                              <p className="text-sm mt-1">
                                <span className="font-semibold text-primary">{formatCurrency(item.discountedPrice)}</span>
                                <span className="ml-2 line-through text-muted-foreground">{formatCurrency(item.price)}</span>
                              </p>
                            ) : (
                              <p className="text-sm font-semibold text-primary mt-1">{formatCurrency(item.price)}</p>
                            )}
                          </div>
                        </div>
                        <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                      </div>
                    ))}
                  </CardContent>
                )}

                {order.refundStatus && order.refundStatus !== 'NOT_REQUESTED' && (
                  <CardContent className="pt-0">
                    <div className="rounded-md border border-border bg-muted/40 p-3 text-sm space-y-1">
                      {order.refundAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Refund amount</span>
                          <span className="font-medium text-green-600">{formatCurrency(order.refundAmount)}</span>
                        </div>
                      )}
                      {order.coinsRefunded > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Coins refunded</span>
                          <span className="font-medium">+{order.coinsRefunded}</span>
                        </div>
                      )}
                      {order.refundReason && (
                        <p className="text-xs text-muted-foreground">Reason: {order.refundReason}</p>
                      )}
                    </div>
                  </CardContent>
                )}

                <CardContent className="pt-0 flex flex-wrap gap-2 border-t border-border">
                  {order.refundStatus === 'REFUND_DETAILS_REQUIRED' && (
                    <Button size="sm" variant="secondary" onClick={() => handleRefundDetailsClick(order)}>
                      Add refund details
                    </Button>
                  )}
                  {order.canCancel && order.orderStatus !== 'CANCELLED' && (!order.refundStatus || order.refundStatus === 'NOT_REQUESTED') && (
                    <Button size="sm" variant="destructive" onClick={() => handleCancelClick(order)}>
                      Cancel order
                    </Button>
                  )}
                  {order.canReturn && order.orderStatus === 'DELIVERED' && (!order.refundStatus || order.refundStatus === 'NOT_REQUESTED') && (
                    <Button size="sm" variant="outline" onClick={() => handleReturnClick(order)}>
                      Request return
                    </Button>
                  )}
                  {['DELIVERED', 'CANCELLED'].includes(order.orderStatus) && (
                    <Button size="sm" variant="outline" onClick={() => navigate('/buying')}>
                      Buy again
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CancelOrderModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setSelectedOrder(null)
        }}
        onSuccess={handleCancelSuccess}
        order={selectedOrder}
        type="cancel"
      />

      <CancelOrderModal
        isOpen={showReturnModal}
        onClose={() => {
          setShowReturnModal(false)
          setSelectedOrder(null)
        }}
        onSuccess={handleReturnSuccess}
        order={selectedOrder}
        type="return"
      />

      <RefundDetailsModal
        isOpen={showRefundDetailsModal}
        onClose={() => {
          setShowRefundDetailsModal(false)
          setSelectedOrder(null)
        }}
        onSuccess={handleRefundDetailsSuccess}
        orderId={selectedOrder?.id}
      />
    </AppPage>
  )
}

export default Orders
