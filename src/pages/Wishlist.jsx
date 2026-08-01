/**
 * Saved products (local wishlist) — browse saved marketplace items.
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Store, Trash2 } from 'lucide-react'
import apiClient from '../services/apiClient'
import { useToast } from '../hooks/useToast'
import AppPage from '../components/layout/AppPage'
import { PageScaffold } from '../components/app/PageScaffold'
import { ProductCard } from '../components/marketplace/ProductCard'
import { KpiCard } from '../components/ui/kpi-card'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/ui/empty-state'
import { PageSkeleton } from '../components/ui/Skeleton'
import { InfoPanel } from '../components/platform/InfoPanel'
import { SummaryPanel } from '../components/platform/SummaryPanel'
import { useWishlist } from '../hooks/useWishlist'
import { buildCartItem, addToCartStorage } from '../lib/marketplace'

function Wishlist() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { wishlistIds, isWishlisted, toggleWishlist } = useWishlist()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get('/products')
        setProducts(Array.isArray(response.data) ? response.data : [])
      } catch {
        showToast('Could not load products. Try again.', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [showToast])

  const savedProducts = useMemo(() => {
    if (!wishlistIds.length) return []
    const idSet = new Set(wishlistIds.map(Number))
    return products.filter((p) => idSet.has(Number(p.id)))
  }, [products, wishlistIds])

  const handleQuickAdd = (product) => {
    if (product.deliverable === false) {
      showToast(product.deliveryMessage || 'This product is not deliverable to your location.', 'warning')
      return
    }
    addToCartStorage(buildCartItem(product, 1))
    showToast(`${product.productName} added to cart.`, 'success')
  }

  const handleRemove = (product) => {
    toggleWishlist(product.id)
    showToast('Product removed from saved products.', 'success')
  }

  return (
    <AppPage
      title="Saved products"
      description="Products you saved from the marketplace. Stored on this device until you remove them."
      meta={
        <span className="text-muted-foreground text-xs">
          {wishlistIds.length} saved · local only
        </span>
      }
      actions={
        <Button variant="outline" onClick={() => navigate('/buying')} className="gap-2">
          <Store className="h-4 w-4" />
          Browse marketplace
        </Button>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
        <KpiCard title="Saved" value={wishlistIds.length} hint="On this device" icon={Heart} />
        <KpiCard title="Available now" value={savedProducts.length} hint="Still listed" />
        <KpiCard
          title="Deliverable"
          value={savedProducts.filter((p) => p.deliverable !== false).length}
          hint="To your zone"
        />
      </div>

      <PageScaffold
        aside={
          <>
            <SummaryPanel title="Quick actions" description="Continue shopping or review your cart.">
              <div className="flex flex-col gap-2">
                <Button className="w-full gap-2" onClick={() => navigate('/cart')}>
                  <ShoppingCart className="h-4 w-4" />
                  View cart
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate('/buying')}>
                  Browse marketplace
                </Button>
              </div>
            </SummaryPanel>
            <InfoPanel
              title="About saved products"
              description="Saved products are stored locally in your browser."
            >
              <p className="text-sm text-muted-foreground">
                They are not synced across devices. Remove items anytime from the heart icon on a product card.
              </p>
            </InfoPanel>
          </>
        }
      >
        {loading ? (
          <PageSkeleton variant="cards" />
        ) : wishlistIds.length === 0 ? (
          <EmptyState
            title="No saved products yet"
            description="Save products from the marketplace to compare options and buy when you are ready."
            action={
              <Button onClick={() => navigate('/buying')} className="gap-2">
                <Store className="h-4 w-4" />
                Browse marketplace
              </Button>
            }
          />
        ) : savedProducts.length === 0 ? (
          <EmptyState
            title="Saved products unavailable"
            description="These products may have been removed or are no longer listed. Clear saved items and browse again."
            action={
              <Button
                variant="outline"
                onClick={() => {
                localStorage.setItem('farmeazy_wishlist', '[]')
                window.dispatchEvent(new Event('farmeazy:wishlist-updated'))
                showToast('Saved products cleared.', 'success')
              }}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear saved products
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {savedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={(p) => navigate(`/product/${p.id}`)}
                onQuickView={(p) => navigate(`/product/${p.id}`)}
                onAddToCart={handleQuickAdd}
                isWishlisted={isWishlisted(product.id)}
                onToggleWishlist={() => handleRemove(product)}
              />
            ))}
          </div>
        )}
      </PageScaffold>
    </AppPage>
  )
}

export default Wishlist
