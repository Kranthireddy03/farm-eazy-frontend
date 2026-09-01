import { useState, useEffect } from 'react'
import ProductMediaCarousel from '../components/ProductMediaCarousel'
import { useParams, useNavigate } from 'react-router-dom'
import ProductService from '../services/ProductService'
import { useToast } from '../hooks/useToast'
import AppPage from '../components/layout/AppPage'
import { sendNotification } from '../components/NotificationCenter'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent } from '../components/ui/card'
import { ErrorState } from '../components/ui/error-state'
import { PageSkeleton } from '../components/ui/Skeleton'
import { CartPromptDialog } from '../components/marketplace/CartPromptDialog'
import { PageScaffold } from '../components/app/PageScaffold'
import { InfoPanel } from '../components/platform/InfoPanel'
import { SummaryPanel } from '../components/platform/SummaryPanel'
import { DetailPanel } from '../components/platform/DetailPanel'
import BidPanel from '../components/marketplace/BidPanel'
import { useWishlist } from '../hooks/useWishlist'
import { useAuth } from '../context/AuthContext'
import { buildCartItem, addToCartStorage } from '../lib/marketplace'
import ProductReviewsSection from '../components/ProductReviewsSection'
import {
  ArrowLeft, Heart, MapPin, Mail, Phone, Truck, Share2, ShoppingCart,
} from 'lucide-react'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { user } = useAuth()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCartPrompt, setShowCartPrompt] = useState(false)
  const [revealedContact, setRevealedContact] = useState({ phone: false, email: false })
  const [addingToCart, setAddingToCart] = useState(false)

  const isNotDeliverable = product?.deliverable === false
  const isOwnProduct = Boolean(user?.id && product?.sellerId && String(user.id) === String(product.sellerId))
  const sellerPhone = product?.sellerPhone || product?.contactPhone || ''
  const sellerEmail = product?.sellerEmail || product?.contactEmail || ''

  const productMediaUrls = Array.from(new Set([
    ...(Array.isArray(product?.mediaUrls) ? product.mediaUrls : []),
    ...(product?.imageUrls || '').split(',').map((url) => url.trim()).filter(Boolean),
  ]))
  const productVideoUrls = (product?.videoUrls || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const productData = await ProductService.getProductById(id)
        setProduct(productData)
      } catch (error) {
        console.error('Failed to fetch product:', error)
        showToast('Failed to load product details', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id, showToast])

  const displayPrice = product?.discountPercentage > 0
    ? (product.price * (1 - product.discountPercentage / 100)).toFixed(2)
    : Number(product?.price || 0).toFixed(2)

  const handleAddToCart = () => {
    if (!product) return
    if (isOwnProduct) {
      showToast('You cannot buy your own product listing.', 'warning')
      return
    }
    if (isNotDeliverable) {
      showToast(product.deliveryMessage || 'Not deliverable to your location', 'warning')
      return
    }
    setAddingToCart(true)
    try {
      const cartItem = buildCartItem(product, 1)
      addToCartStorage(cartItem)
      sendNotification(`${product.productName} added to cart`, 'success')
      showToast(`${product.productName} added to cart`, 'success')
      setShowCartPrompt(true)
    } catch (error) {
      showToast('Failed to add product to cart', 'error')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: product?.productName, url: window.location.href })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        showToast('Link copied', 'success')
      }
    } catch {
      /* cancelled */
    }
  }

  if (loading) {
    return (
      <AppPage title="Product" description="Loading product details…">
        <PageSkeleton variant="cards" />
      </AppPage>
    )
  }

  if (!product) {
    return (
      <AppPage title="Product not found" description="This listing may have been removed.">
        <ErrorState
          title="Product not found"
          description="The product you're looking for doesn't exist or is no longer available."
          showHome={false}
        />
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => navigate('/products')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to marketplace
          </Button>
        </div>
      </AppPage>
    )
  }

  const outOfStock = product.quantity <= 0 || product.status === 'OUT_OF_STOCK'

  return (
    <AppPage
      title={product.productName}
      description={product.category}
      meta={
        <>
          <Badge variant={isNotDeliverable ? 'destructive' : 'success'}>
            {isNotDeliverable ? 'Not deliverable' : 'Deliverable to you'}
          </Badge>
          {product.discountPercentage > 0 && (
            <Badge variant="success">{product.discountPercentage}% off</Badge>
          )}
        </>
      }
      actions={
        <>
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const added = toggleWishlist(product.id)
              showToast(added ? 'Product saved to your wishlist.' : 'Product removed from saved products.', 'success')
            }}
            className="gap-2"
            aria-pressed={isWishlisted(product.id)}
          >
            <Heart className={`h-4 w-4 ${isWishlisted(product.id) ? 'fill-primary text-primary' : ''}`} />
            Favorite
          </Button>
          {product.pricingType !== 'BIDDING' && (
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={outOfStock || isNotDeliverable || isOwnProduct || addingToCart}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {addingToCart ? 'Adding…' : 'Add to cart'}
            </Button>
          )}
        </>
      }
    >
      <Button variant="ghost" size="sm" className="gap-2 -mt-2 mb-2" onClick={() => navigate('/products')}>
        <ArrowLeft className="h-4 w-4" />
        Marketplace
      </Button>

      <PageScaffold
        aside={
          <>
            <SummaryPanel title="Order summary" description="Price and availability at your location">
              {product.pricingType === 'BIDDING' ? (
                <p className="text-lg font-semibold text-primary">Bidding — place a bid below</p>
              ) : (
                <div className="flex items-baseline gap-2">
                  {product.discountPercentage > 0 && (
                    <span className="text-muted-foreground line-through">₹{product.price}</span>
                  )}
                  <span className="text-3xl font-semibold text-primary tabular-nums">₹{displayPrice}</span>
                  <span className="text-muted-foreground text-sm">/ {product.unit}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Stock</p>
                  <p className="font-semibold mt-1">{product.quantity} {product.unit}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Delivery</p>
                  <p className="font-semibold mt-1 text-sm">
                    {product.deliveryDaysMin || 3}–{product.deliveryDaysMax || 5} days
                  </p>
                </div>
              </div>
              {/* Policy Highlights */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 mt-4 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] flex items-center space-x-1">
                  <span>🛡️</span> <span>Policies & Assurance</span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                    <span className="text-slate-500 block text-[10px]">Return Window</span>
                    <span className="font-bold text-slate-800">{product.returnWindowDays ? `${product.returnWindowDays} Days Return` : 'Non-Returnable'}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                    <span className="text-slate-500 block text-[10px]">Exchange</span>
                    <span className="font-bold text-slate-800">{product.exchangeAllowed ? 'Allowed' : 'Not Applicable'}</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200/60 col-span-2">
                    <span className="text-slate-500 block text-[10px]">Refund Terms</span>
                    <span className="font-bold text-slate-800">{product.refundPolicy || 'Full Refund on Return'}</span>
                  </div>
                </div>
                {product.cancellationPolicy && (
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                    ℹ️ {product.cancellationPolicy}
                  </p>
                )}
              </div>

              {product.pricingType !== 'BIDDING' && (
                <Button
                  className="w-full mt-4 gap-2"
                  onClick={handleAddToCart}
                  disabled={outOfStock || isNotDeliverable || isOwnProduct || addingToCart || product.isSuspended}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {product.isSuspended ? 'Listing Paused' : addingToCart ? 'Adding…' : 'Add to cart'}
                </Button>
              )}
              {product.pricingType === 'BIDDING' && (
                <div className="mt-4">
                  <BidPanel listing={product} />
                </div>
              )}

              {/* Owner / Admin Analytics Shortcut */}
              {isOwnProduct && (
                <button
                  onClick={() => navigate(`/selling/product/${product.id}/analytics`)}
                  className="w-full mt-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <span>📈 View Performance & Buyer Registry</span>
                </button>
              )}
            </SummaryPanel>

            {product.isSuspended && (
              <InfoPanel
                variant="warning"
                title="Listing Paused by Administration"
                description={`This listing is currently suspended: ${product.suspensionReason || 'Operational review in progress.'}`}
              />
            )}

            {isNotDeliverable && (
              <InfoPanel
                variant="warning"
                title="Not deliverable"
                description={product.deliveryMessage || 'This product cannot be delivered to your selected location.'}
              />
            )}
          </>
        }
      >
        <Card className="overflow-hidden">
          <div className="aspect-square bg-muted max-h-[min(70vh,520px)]">
            <ProductMediaCarousel mediaUrls={productMediaUrls} videoUrls={productVideoUrls} />
          </div>
        </Card>

        <DetailPanel title={product.productName} description={product.description}>
          {product.specifications && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Specifications</h3>
              <p className="text-sm text-muted-foreground">{product.specifications}</p>
            </div>
          )}
          {product.warrantyInfo && (
            <div>
              <h3 className="text-sm font-semibold mb-1">Warranty</h3>
              <p className="text-sm text-muted-foreground">{product.warrantyInfo}</p>
            </div>
          )}
        </DetailPanel>

        <DetailPanel title="Seller" description={product.sellerFullName}>
          {product.sellerLocation && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {product.sellerLocation}
            </p>
          )}
          {product.vendorName && (
            <p className="text-sm text-muted-foreground">Vendor: {product.vendorName}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!sellerPhone}
              onClick={() => setRevealedContact((p) => ({ ...p, phone: true }))}
              className="gap-2"
            >
              <Phone className="h-4 w-4" />
              Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!sellerEmail}
              onClick={() => setRevealedContact((p) => ({ ...p, email: true }))}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
          </div>
          {(revealedContact.phone || revealedContact.email) && (
            <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1 mt-3">
              {revealedContact.phone && sellerPhone && (
                <a href={`tel:${sellerPhone}`} className="text-primary font-medium hover:underline block">
                  {sellerPhone}
                </a>
              )}
              {revealedContact.email && sellerEmail && (
                <a href={`mailto:${sellerEmail}`} className="text-primary font-medium hover:underline block">
                  {sellerEmail}
                </a>
              )}
            </div>
          )}
        </DetailPanel>

        {/* Customer Reviews & Feedback */}
        <div className="pt-2">
          <ProductReviewsSection
            targetType="PRODUCT"
            targetId={product.id}
            targetTitle={product.productName}
            isOwner={isOwnProduct}
          />
        </div>

        {product.imageUrls && product.imageUrls.split(',').length > 1 && (
          <DetailPanel title="Gallery">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {product.imageUrls.split(',').slice(1).map((url, idx) => (
                <img
                  key={idx}
                  src={url.trim()}
                  alt=""
                  className="rounded-lg border border-border object-cover aspect-square w-full"
                  loading="lazy"
                />
              ))}
            </div>
          </DetailPanel>
        )}
      </PageScaffold>

      <CartPromptDialog
        open={showCartPrompt}
        productName={product.productName}
        quantity={1}
        unitPrice={displayPrice}
        onViewCart={() => {
          setShowCartPrompt(false)
          navigate('/cart')
        }}
        onContinue={() => setShowCartPrompt(false)}
      />
    </AppPage>
  )
}

export default ProductDetail
