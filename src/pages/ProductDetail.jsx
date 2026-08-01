import { useState, useEffect } from 'react'
import ProductMediaCarousel from '../components/ProductMediaCarousel'
import { useParams, useNavigate } from 'react-router-dom'
import ProductService from '../services/ProductService'
import { useToast } from '../hooks/useToast'
import AppPage from '../components/layout/AppPage'
import { sendNotification } from '../components/NotificationCenter'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { ErrorState } from '../components/ui/error-state'
import { PageSkeleton } from '../components/ui/Skeleton'
import { CartPromptDialog } from '../components/marketplace/CartPromptDialog'
import { useWishlist } from '../hooks/useWishlist'
import { buildCartItem, addToCartStorage } from '../lib/marketplace'
import {
  ArrowLeft, Heart, MapPin, Mail, Phone, Package, Truck, Share2, ShoppingCart,
} from 'lucide-react'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { isWishlisted, toggleWishlist } = useWishlist()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCartPrompt, setShowCartPrompt] = useState(false)
  const [revealedContact, setRevealedContact] = useState({ phone: false, email: false })
  const [addingToCart, setAddingToCart] = useState(false)

  const isNotDeliverable = product?.deliverable === false
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
          <Button variant="outline" onClick={() => navigate('/buying')} className="gap-2">
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
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={outOfStock || isNotDeliverable || addingToCart}
            className="gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {addingToCart ? 'Adding…' : 'Add to cart'}
          </Button>
        </>
      }
    >
      <Button variant="ghost" size="sm" className="gap-2 -mt-2 mb-2" onClick={() => navigate('/buying')}>
        <ArrowLeft className="h-4 w-4" />
        Marketplace
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="aspect-square bg-muted max-h-[min(70vh,520px)]">
            <ProductMediaCarousel mediaUrls={productMediaUrls} videoUrls={productVideoUrls} />
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-semibold tracking-tight">{product.productName}</CardTitle>
              <CardDescription className="text-base leading-relaxed">{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                {product.discountPercentage > 0 && (
                  <span className="text-muted-foreground line-through text-lg">₹{product.price}</span>
                )}
                <span className="text-3xl font-semibold text-primary">₹{displayPrice}</span>
                <span className="text-muted-foreground">/ {product.unit}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" /> Stock
                  </p>
                  <p className="font-semibold mt-1">{product.quantity} {product.unit}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Truck className="h-3.5 w-3.5" /> Delivery
                  </p>
                  <p className="font-semibold mt-1 text-sm">
                    {product.deliveryDaysMin || 3}–{product.deliveryDaysMax || 5} days
                  </p>
                </div>
              </div>

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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Seller</CardTitle>
              <CardDescription>{product.sellerFullName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {product.sellerLocation && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {product.sellerLocation}
                </p>
              )}
              {product.vendorName && (
                <p className="text-muted-foreground">Vendor: {product.vendorName}</p>
              )}
              <div className="flex flex-wrap gap-2">
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
                <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
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
            </CardContent>
          </Card>
        </div>
      </div>

      {product.imageUrls && product.imageUrls.split(',').length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Gallery</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

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
