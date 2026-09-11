import { useState, useEffect } from 'react'
import ProductMediaCarousel from '../components/ProductMediaCarousel'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import ProductService from '../services/ProductService'
import apiClient from '../services/apiClient'
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
  Edit, PauseCircle, PlayCircle, Trash2, BarChart2, Users, CheckCircle2, MessageSquare
} from 'lucide-react'
import MarketplaceDirectChatModal from '../components/marketplace/MarketplaceDirectChatModal'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const routerLocation = useLocation()
  const { showToast } = useToast()
  const { isWishlisted, toggleWishlist } = useWishlist()
  const { user } = useAuth()

  const queryParams = new URLSearchParams(routerLocation.search)
  const locationParam = queryParams.get('location')

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCartPrompt, setShowCartPrompt] = useState(false)
  const [showDirectChat, setShowDirectChat] = useState(false)
  const [revealedContact, setRevealedContact] = useState({ phone: false, email: false })
  const [addingToCart, setAddingToCart] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)

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

  const effectiveLocation = locationParam || product?.locationPincode || product?.locationCity || product?.locationState || ''

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

  // Seller Action: Toggle Pause / Resume Status
  const handleToggleStatus = async () => {
    if (!product) return
    const newStatus = product.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setStatusUpdating(true)
    try {
      await apiClient.put(`/products/${product.id}/status`, { status: newStatus })
      setProduct((prev) => ({ ...prev, status: newStatus }))
      showToast(newStatus === 'PAUSED' ? 'Product listing paused' : 'Product listing is now active', 'success')
    } catch (err) {
      showToast('Failed to update listing status', 'error')
    } finally {
      setStatusUpdating(false)
    }
  }

  // Seller Action: Delete Product
  const handleDeleteProduct = async () => {
    if (!product) return
    if (window.confirm(`Are you sure you want to permanently delete "${product.productName}"?`)) {
      try {
        await ProductService.deleteProduct(product.id)
        showToast('Product listing deleted successfully', 'success')
        navigate('/vendor/dashboard')
      } catch (err) {
        showToast('Failed to delete product', 'error')
      }
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
  const isPaused = product.status === 'PAUSED' || product.isSuspended

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
          {isOwnProduct && (
            <Badge variant="outline" className="text-primary border-primary">
              Your Listing
            </Badge>
          )}
        </>
      }
      actions={
        <>
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          {!isOwnProduct && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const added = toggleWishlist(product)
                showToast(added ? 'Product saved to your wishlist.' : 'Product removed from saved products.', 'success')
              }}
              className="gap-2"
              aria-pressed={isWishlisted(product.id)}
            >
              <Heart className={`h-4 w-4 ${isWishlisted(product.id) ? 'fill-primary text-primary' : ''}`} />
              Favorite
            </Button>
          )}
          {product.pricingType !== 'BIDDING' && !isOwnProduct && (
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={outOfStock || isNotDeliverable || addingToCart || isPaused}
              className="gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              {isPaused ? 'Listing Paused' : addingToCart ? 'Adding…' : 'Add to cart'}
            </Button>
          )}
        </>
      }
    >
      {/* Location Navigation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 -mt-2 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 p-0 h-auto" 
          onClick={() => navigate(effectiveLocation ? `/products?location=${encodeURIComponent(effectiveLocation)}` : '/products')}
        >
          <ArrowLeft className="h-4 w-4" />
          {effectiveLocation ? `Back to all products in ${effectiveLocation}` : 'Back to all marketplace products'}
        </Button>

        {effectiveLocation && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Coverage: <strong>{effectiveLocation}</strong>
          </span>
        )}
      </div>

      <PageScaffold
        aside={
          <>
            {/* SELLER MANAGEMENT CONTROLS */}
            {isOwnProduct && (
              <div className="rounded-2xl border-2 border-primary/30 bg-primary/[0.02] p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-primary/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🏪</span>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Seller Management</h4>
                      <p className="text-[11px] text-muted-foreground">Manage your product listing & buyers</p>
                    </div>
                  </div>
                  <Badge variant={isPaused ? 'warning' : 'success'} className="text-[10px]">
                    {product.status || 'ACTIVE'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/selling/product/edit/${product.id}`)}
                    className="gap-1.5 text-xs w-full justify-center border-border hover:bg-muted"
                  >
                    <Edit className="h-3.5 w-3.5 text-primary" /> Edit
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleToggleStatus}
                    disabled={statusUpdating}
                    className="gap-1.5 text-xs w-full justify-center border-border hover:bg-muted"
                  >
                    {isPaused ? (
                      <>
                        <PlayCircle className="h-3.5 w-3.5 text-emerald-600" /> Resume
                      </>
                    ) : (
                      <>
                        <PauseCircle className="h-3.5 w-3.5 text-amber-600" /> Pause
                      </>
                    )}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/selling/product/${product.id}/analytics`)}
                    className="gap-1.5 text-xs w-full justify-center col-span-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-primary dark:hover:bg-primary/90"
                  >
                    <BarChart2 className="h-3.5 w-3.5" /> Buyer Registry & Analytics
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDeleteProduct}
                    className="gap-1.5 text-xs w-full justify-center col-span-2 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete Product
                  </Button>
                </div>
              </div>
            )}

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
              <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2 mt-4 text-xs">
                <p className="font-bold text-foreground uppercase tracking-wider text-[10px] flex items-center space-x-1">
                  <span>🛡️</span> <span>Policies & Assurance</span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-card p-2 rounded-lg border border-border">
                    <span className="text-muted-foreground block text-[10px]">Return Window</span>
                    <span className="font-bold text-foreground">{product.returnWindowDays ? `${product.returnWindowDays} Days Return` : 'Non-Returnable'}</span>
                  </div>
                  <div className="bg-card p-2 rounded-lg border border-border">
                    <span className="text-muted-foreground block text-[10px]">Exchange</span>
                    <span className="font-bold text-foreground">{product.exchangeAllowed ? 'Allowed' : 'Not Applicable'}</span>
                  </div>
                  <div className="bg-card p-2 rounded-lg border border-border col-span-2">
                    <span className="text-muted-foreground block text-[10px]">Refund Terms</span>
                    <span className="font-bold text-foreground">{product.refundPolicy || 'Full Refund on Return'}</span>
                  </div>
                </div>
                {product.cancellationPolicy && (
                  <p className="text-[10px] text-muted-foreground pt-1 border-t border-border">
                    ℹ️ {product.cancellationPolicy}
                  </p>
                )}
              </div>

              {product.pricingType !== 'BIDDING' && !isOwnProduct && (
                <Button
                  className="w-full mt-4 gap-2"
                  onClick={handleAddToCart}
                  disabled={outOfStock || isNotDeliverable || addingToCart || isPaused}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {isPaused ? 'Listing Paused' : addingToCart ? 'Adding…' : 'Add to cart'}
                </Button>
              )}
              {product.pricingType === 'BIDDING' && (
                <div className="mt-4">
                  <BidPanel listing={product} />
                </div>
              )}
            </SummaryPanel>

            {isPaused && (
              <InfoPanel
                variant="warning"
                title="Listing Currently Paused"
                description={product.suspensionReason || 'This listing is paused and temporarily not accepting new orders.'}
              />
            )}

            {isNotDeliverable && !isOwnProduct && (
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
            {!isOwnProduct && product?.allowBuyerChat !== false && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (!user) {
                    showToast('Please login to chat directly with the seller.', 'info');
                    navigate('/login');
                    return;
                  }
                  setShowDirectChat(true);
                }}
                className="gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-900/10"
              >
                <MessageSquare className="h-4 w-4" />
                Chat with Seller
              </Button>
            )}
            {!isOwnProduct && product?.allowBuyerChat === false && (
              <div className="w-full text-xs text-muted-foreground bg-muted/60 p-2 rounded-lg border border-border">
                ℹ️ <em>Seller has disabled direct chat for this listing. Contact via phone/email below.</em>
              </div>
            )}
            {isOwnProduct && (
              <div className="w-full text-xs font-medium text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border">
                💬 Direct Buyer Chat: {product?.allowBuyerChat !== false ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">Enabled</span> : <span className="text-amber-600 dark:text-amber-400 font-bold">Disabled</span>}
              </div>
            )}
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

        {/* Customer Reviews & Feedback with Star/Media Filters */}
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

      <MarketplaceDirectChatModal
        open={showDirectChat}
        onClose={() => setShowDirectChat(false)}
        product={product}
      />
    </AppPage>
  )
}

export default ProductDetail
