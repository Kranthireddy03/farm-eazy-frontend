/**
 * Marketplace — browse and buy agricultural products (Phase 2 enterprise UI).
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, ShoppingCart, Store, Package, MapPin, Lightbulb, ClipboardList } from 'lucide-react'
import apiClient from '../services/apiClient'
import { useToast } from '../hooks/useToast'
import AppPage from '../components/layout/AppPage'
import { sendNotification } from '../components/NotificationCenter'
import { useAuth } from '../context/AuthContext'
import ProductModal from '../components/ProductModal'
import { ProductCard } from '../components/marketplace/ProductCard'
import { CartPromptDialog } from '../components/marketplace/CartPromptDialog'
import { PageScaffold } from '../components/app/PageScaffold'
import { KpiCard } from '../components/ui/kpi-card'
import { Button } from '../components/ui/button'
import { FilterBar } from '../components/ui/filter-bar'
import { PageToolbar, PageToolbarGroup } from '../components/ui/page-toolbar'
import { EmptyState } from '../components/ui/empty-state'
import { PageSkeleton } from '../components/ui/Skeleton'
import { Badge } from '../components/ui/badge'
import { InfoPanel } from '../components/platform/InfoPanel'
import { SummaryPanel } from '../components/platform/SummaryPanel'
import { useWishlist } from '../hooks/useWishlist'
import { useMarketplaceFilters } from '../hooks/useMarketplaceFilters'
import { buildCartItem, addToCartStorage } from '../lib/marketplace'

const CATEGORIES = [
  { value: 'ALL', label: 'All' },
  { value: 'SEEDS', label: 'Seeds' },
  { value: 'FERTILIZERS', label: 'Fertilizers' },
  { value: 'PESTICIDES', label: 'Pesticides' },
  { value: 'TOOLS', label: 'Tools' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'ORGANIC', label: 'Organic' },
  { value: 'OTHERS', label: 'Others' },
]

const QUICK_CHIPS = ['Seeds', 'Fertilizers', 'Tools', 'Irrigation']

function Buying() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { getUserId, getUserEmail } = useAuth()
  const { isWishlisted, toggleWishlist, wishlistIds } = useWishlist()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [revealedContacts, setRevealedContacts] = useState({})
  const [showCartPrompt, setShowCartPrompt] = useState(false)
  const [lastAddedProduct, setLastAddedProduct] = useState(null)

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    filteredProducts: filteredByFilters,
    clearFilters,
    hasActiveFilters,
  } = useMarketplaceFilters(products, {
    categories: CATEGORIES,
    excludeOwnProducts: true,
    getUserId,
    getUserEmail,
  })

  const filteredProducts = useMemo(
    () => filteredByFilters.filter((p) => p.deliverable !== false),
    [filteredByFilters],
  )

  const deliverableCount = filteredProducts.length
  const categoryBreakdown = useMemo(() => {
    const counts = {}
    filteredProducts.forEach((p) => {
      const key = p.category || 'Other'
      counts[key] = (counts[key] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [filteredProducts])

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const onLocationChanged = () => {
      setLoading(true)
      fetchProducts()
    }
    window.addEventListener('farmeazy:location-changed', onLocationChanged)
    window.addEventListener('storage', onLocationChanged)
    return () => {
      window.removeEventListener('farmeazy:location-changed', onLocationChanged)
      window.removeEventListener('storage', onLocationChanged)
    }
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/products')
      setProducts(response.data)
    } catch (error) {
      showToast('Failed to load products', 'error')
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (cartItem) => {
    addToCartStorage(cartItem)
    sendNotification(`${cartItem.productName} added to cart`, 'info')
    setLastAddedProduct(cartItem)
    setShowCartPrompt(true)
    setShowModal(false)
  }

  const handleQuickAdd = (product) => {
    if (product.deliverable === false) {
      showToast(product.deliveryMessage || 'Not deliverable to your location', 'warning')
      return
    }
    const cartItem = buildCartItem(product, 1)
    handleAddToCart(cartItem)
  }

  const handleViewDetails = (product, openInNewTab = false) => {
    const url = `/product/${product.id}`
    if (openInNewTab) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    navigate(url)
  }

  const handleShare = async (product) => {
    const url = `${window.location.origin}/product/${product.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: product.productName, url })
      } else {
        await navigator.clipboard.writeText(url)
        showToast('Link copied to clipboard', 'success')
      }
    } catch {
      /* user cancelled share */
    }
  }

  const handleToggleWishlist = (product) => {
    const added = toggleWishlist(product.id)
    showToast(added ? 'Product saved to your wishlist.' : 'Product removed from saved products.', 'success')
  }

  const handleExportList = () => {
    const rows = filteredProducts.map((p) =>
      [p.id, p.productName, p.category, p.price, p.quantity, p.sellerFullName].join(','),
    )
    const csv = ['id,name,category,price,stock,seller', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'farmeazy-products.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const toolbar = (
    <PageToolbar sticky>
      <FilterBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search products, sellers…"
        filters={CATEGORIES}
        activeFilter={selectedCategory}
        onFilterChange={setSelectedCategory}
        className="flex-1"
      />
      <PageToolbarGroup>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleExportList}>
          <Download className="h-4 w-4" />
          Export
        </Button>
      </PageToolbarGroup>
    </PageToolbar>
  )

  return (
    <AppPage
      title="Marketplace"
      description="Browse quality agricultural products from verified sellers in your delivery zone."
      meta={
        <>
          <Badge variant="muted">{products.length} live listings</Badge>
          <Badge variant="outline">{filteredProducts.length} deliverable to you</Badge>
        </>
      }
      actions={
        <>
          <Button variant="outline" onClick={() => navigate('/selling')} className="gap-2">
            <Store className="h-4 w-4" />
            Sell products
          </Button>
          <Button onClick={() => navigate('/cart')} className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            View cart
          </Button>
        </>
      }
      toolbar={toolbar}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Live products" value={products.length} hint="All listings" icon={Package} />
        <KpiCard title="In your zone" value={deliverableCount} hint="Deliverable now" icon={MapPin} />
        <KpiCard
          title="Category"
          value={CATEGORIES.find((c) => c.value === selectedCategory)?.label || 'All'}
          hint="Active filter"
        />
        <KpiCard title="Saved products" value={wishlistIds.length} hint="On this device" />
      </div>

      <PageScaffold
        aside={
          <>
            <InfoPanel
              icon={MapPin}
              title="Your delivery zone"
              description={`${deliverableCount} product(s) can reach your current location.`}
            >
              {categoryBreakdown.length > 0 && (
                <ul className="text-sm text-muted-foreground space-y-1">
                  {categoryBreakdown.map(([cat, count]) => (
                    <li key={cat} className="flex justify-between gap-2">
                      <span className="capitalize">{cat}</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </InfoPanel>
            <SummaryPanel title="Quick actions" description="Continue your purchase journey.">
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate('/cart')} className="w-full gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  View cart
                </Button>
                <Button variant="outline" onClick={() => navigate('/wishlist')} className="w-full gap-2">
                  Saved products
                </Button>
                <Button variant="outline" onClick={() => navigate('/orders')} className="w-full gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Your orders
                </Button>
                <Button variant="outline" onClick={() => navigate('/selling')} className="w-full gap-2">
                  <Store className="h-4 w-4" />
                  Sell products
                </Button>
              </div>
            </SummaryPanel>
            <InfoPanel
              icon={Lightbulb}
              title="Buying tips"
              description="Get more value from the marketplace."
            >
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                <li>Update your location in the header for accurate delivery.</li>
                <li>Compare seller ratings and delivery windows before ordering.</li>
                <li>Save products to your wishlist to compare and buy later.</li>
              </ul>
            </InfoPanel>
          </>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {QUICK_CHIPS.map((chip) => (
              <Button
                key={chip}
                type="button"
                size="sm"
                variant={searchTerm === chip ? 'default' : 'outline'}
                onClick={() => setSearchTerm(chip)}
              >
                {chip}
              </Button>
            ))}
            {hasActiveFilters && (
              <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>

          {loading ? (
            <PageSkeleton variant="cards" />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              title={products.length === 0 ? 'No products yet' : 'Nothing deliverable here'}
              description={
                products.length === 0
                  ? 'Be the first seller in your region or check back soon.'
                  : 'Try another category or update your delivery location.'
              }
              action={
                products.length === 0 ? (
                  <Button onClick={() => navigate('/selling')}>List a product</Button>
                ) : (
                  <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                )
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onView={(p) => handleViewDetails(p)}
                  onQuickView={(p) => {
                    setSelectedProduct(p)
                    setShowModal(true)
                  }}
                  onAddToCart={handleQuickAdd}
                  onRevealPhone={(p) => {
                    if (!p.sellerPhone) {
                      showToast('Seller phone not available', 'warning')
                      return
                    }
                    setRevealedContacts((prev) => ({
                      ...prev,
                      [p.id]: { ...prev[p.id], phone: true },
                    }))
                  }}
                  onRevealEmail={(p) => {
                    if (!p.sellerEmail) {
                      showToast('Seller email not available', 'warning')
                      return
                    }
                    setRevealedContacts((prev) => ({
                      ...prev,
                      [p.id]: { ...prev[p.id], email: true },
                    }))
                  }}
                  onShare={handleShare}
                  isWishlisted={isWishlisted(product.id)}
                  onToggleWishlist={handleToggleWishlist}
                  revealedPhone={revealedContacts[product.id]?.phone}
                  revealedEmail={revealedContacts[product.id]?.email}
                />
              ))}
            </div>
          )}
        </div>
      </PageScaffold>

      <ProductModal
          product={selectedProduct}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setSelectedProduct(null)
          }}
          onAddToCart={handleAddToCart}
        />

        <CartPromptDialog
          open={showCartPrompt && lastAddedProduct}
          productName={lastAddedProduct?.productName}
          quantity={lastAddedProduct?.quantity}
          unitPrice={lastAddedProduct?.discountedPrice ?? lastAddedProduct?.price}
          onViewCart={() => {
            setShowCartPrompt(false)
            navigate('/cart')
          }}
          onContinue={() => setShowCartPrompt(false)}
      />
    </AppPage>
  )
}

export default Buying
