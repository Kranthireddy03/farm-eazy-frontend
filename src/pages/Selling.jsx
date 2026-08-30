import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Pencil, Trash2, Boxes, AlertTriangle, Lightbulb, Store, LayoutDashboard, Gavel } from 'lucide-react';
import ProductService from '../services/ProductService';
import apiClient from '../services/apiClient';
import { useGlobalToast } from '../context/ToastContext';
import AppPage from '../components/layout/AppPage';
import { SellingProductForm } from '../components/marketplace/SellingProductForm';
import { KpiSection } from '../components/app/KpiSection';
import { PageScaffold } from '../components/app/PageScaffold';
import { StatsCard } from '../components/platform/StatsCard';
import { SectionHeader } from '../components/platform/SectionHeader';
import { InfoPanel } from '../components/platform/InfoPanel';
import { SummaryPanel } from '../components/platform/SummaryPanel';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { DataTable } from '../components/ui/data-table';
import { EmptyState } from '../components/ui/empty-state';
import { PageSkeleton } from '../components/ui/Skeleton';
import { FilterBar } from '../components/ui/filter-bar';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const STATUS_STYLES = {
  ACTIVE: 'bg-primary/10 text-foreground dark:bg-primary/10 dark:text-primary',
  OUT_OF_STOCK: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  DRAFT: 'bg-muted text-muted-foreground',
};

function Selling() {
  const navigate = useNavigate();
  const { showToast } = useGlobalToast();

  const [myProducts, setMyProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(true);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    loadEligibilityAndProducts();
  }, []);

  const loadEligibilityAndProducts = async () => {
    try {
      setEligibilityLoading(true);
      const eligibilityResponse = await apiClient.get('/vendors/listing-eligibility?listingType=PRODUCT', {
        validateStatus: (status) => status < 500,
      });
      const eligibilityData = eligibilityResponse?.data || {};
      const isEligible = Boolean(eligibilityData?.eligible) && eligibilityResponse.status === 200;
      setEligibility(eligibilityData);

      if (isEligible) {
        await fetchMyProducts();
      } else {
        setMyProducts([]);
      }
    } catch (error) {
      console.error('Error fetching listing eligibility:', error);
      setEligibility({
        eligible: false,
        verificationInProgress: false,
        verificationMessage: 'Unable to validate vendor verification right now. Please complete or retry verification.',
        verificationRedirectPath: '/vendor-dashboard',
      });
      setMyProducts([]);
    } finally {
      setEligibilityLoading(false);
    }
  };

  const fetchMyProducts = async () => {
    try {
      const products = await ProductService.getMyProducts();
      setMyProducts(Array.isArray(products) ? products : []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const vendorDashboardEligible = Boolean(eligibility?.vendorDashboardEligible);
  const canSellProducts = Boolean(eligibility?.eligible);

  const sellingStats = useMemo(() => {
    const totalListings = myProducts.length;
    const activeListings = myProducts.filter((p) => p.status === 'ACTIVE').length;
    const outOfStockListings = myProducts.filter((p) => p.status === 'OUT_OF_STOCK').length;
    const listedUnits = myProducts.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    return { totalListings, activeListings, outOfStockListings, listedUnits };
  }, [myProducts]);

  const filteredProducts = useMemo(() => {
    if (!debouncedSearch.trim()) return myProducts;
    const q = debouncedSearch.toLowerCase();
    return myProducts.filter(
      (p) =>
        p.productName?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.status?.toLowerCase().includes(q),
    );
  }, [myProducts, debouncedSearch]);

  const handleOpenNew = () => {
    if (!canSellProducts) {
      showToast(eligibility?.verificationMessage || 'Complete vendor verification first.', 'warning');
      navigate(eligibility?.verificationRedirectPath || '/vendor-dashboard');
      return;
    }
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    if (!canSellProducts) {
      showToast(eligibility?.verificationMessage || 'Complete vendor verification first.', 'warning');
      navigate(eligibility?.verificationRedirectPath || '/vendor-dashboard');
      return;
    }
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      await ProductService.deleteProduct(productId);
      showToast('Product deleted successfully!', 'success');
      await fetchMyProducts();
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = async () => {
    await fetchMyProducts();
    handleFormClose();
  };

  const productColumns = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: 'Product',
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium truncate">{row.original.productName}</p>
            <p className="text-xs text-muted-foreground capitalize">{row.original.category}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge className={STATUS_STYLES[row.original.status] || STATUS_STYLES.DRAFT}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'price',
        header: 'Price',
        cell: ({ row }) => (
          <span className="font-medium">₹{Number(row.original.discountedPrice || row.original.price || 0).toFixed(2)}</span>
        ),
      },
      {
        id: 'stock',
        header: 'Stock',
        cell: ({ row }) => `${row.original.quantity || 0} ${row.original.unit || ''}`,
      },
      {
        id: 'delivery',
        header: 'Delivery',
        cell: ({ row }) => `${row.original.deliveryDaysMin || 3}-${row.original.deliveryDaysMax || 5} days`,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.pricingType === 'BIDDING' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/selling/bids/product/${row.original.id}`)}
                className="gap-1"
              >
                <Gavel className="h-3.5 w-3.5" />
                View Bids
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => handleEditProduct(row.original)} className="gap-1">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteProduct(row.original.id)}
              className="gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [canSellProducts, eligibility],
  );

  if (showForm) {
    return (
      <SellingProductForm
        editingProduct={editingProduct}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    );
  }

  if (eligibilityLoading) {
    return (
      <AppPage title="Selling" description="Manage your product listings.">
        <PageSkeleton rows={4} />
      </AppPage>
    );
  }

  if (!vendorDashboardEligible) {
    return (
      <AppPage title="Vendor verification required" description="Complete verification to list products.">
        <InfoPanel
          variant="warning"
          icon={AlertTriangle}
          title="Verification required"
          description={eligibility?.verificationMessage || 'To access product listing, complete vendor verification first.'}
        >
          {eligibility?.verificationInProgress && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Your verification is in progress. Vendor dashboard and listings unlock after approval.
            </p>
          )}
          <div className="flex flex-wrap gap-3 mt-4">
            <Button onClick={() => navigate('/vendor-dashboard')}>Open vendor dashboard</Button>
            <Button variant="outline" onClick={loadEligibilityAndProducts}>Refresh status</Button>
          </div>
        </InfoPanel>
      </AppPage>
    );
  }

  return (
    <AppPage
      title="Selling"
      description="Publish, optimize, and manage your product inventory."
      meta={
        <>
          <Badge variant="muted">{sellingStats.totalListings} listings</Badge>
          <Badge variant="outline">{sellingStats.activeListings} active</Badge>
          {sellingStats.outOfStockListings > 0 && (
            <Badge variant="outline" className="text-amber-700 dark:text-amber-400">
              {sellingStats.outOfStockListings} out of stock
            </Badge>
          )}
        </>
      }
      actions={
        <Button onClick={handleOpenNew} className="gap-2" disabled={loading}>
          <Plus className="h-4 w-4" />
          Create product
        </Button>
      }
    >
      {vendorDashboardEligible && !canSellProducts && (
        <InfoPanel
          variant="warning"
          title="Complete listing requirements"
          description={
            eligibility?.verificationMessage ||
            'Your vendor profile is active. Complete the remaining steps to publish products.'
          }
        >
          {Array.isArray(eligibility?.missingRequirements) && eligibility.missingRequirements.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc pl-5">
              {eligibility.missingRequirements.map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          )}
        </InfoPanel>
      )}

      <KpiSection>
        <StatsCard title="Total listings" value={sellingStats.totalListings} icon={Package} />
        <StatsCard title="Active" value={sellingStats.activeListings} tone="success" icon={Boxes} />
        <StatsCard title="Out of stock" value={sellingStats.outOfStockListings} tone="warning" icon={AlertTriangle} />
        <StatsCard title="Listed units" value={sellingStats.listedUnits} tone="info" />
      </KpiSection>

      <SectionHeader title="My products" description="Edit inventory, pricing, and delivery windows." />

      <PageScaffold
        aside={
          <>
            <SummaryPanel title="Listing status" description="Snapshot of your seller inventory.">
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Active</dt>
                  <dd className="text-lg font-semibold">{sellingStats.activeListings}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Units listed</dt>
                  <dd className="text-lg font-semibold">{sellingStats.listedUnits}</dd>
                </div>
              </dl>
            </SummaryPanel>
            <SummaryPanel title="Quick actions" description="Common seller workflows.">
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/vendor-dashboard')}>
                  <LayoutDashboard className="h-4 w-4" />
                  Vendor dashboard
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={() => navigate('/products')}>
                  <Store className="h-4 w-4" />
                  Browse marketplace
                </Button>
              </div>
            </SummaryPanel>
            <InfoPanel
              icon={Lightbulb}
              title="Listing tips"
              description="Improve visibility and conversion."
            >
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                <li>Use clear photos and accurate delivery windows.</li>
                <li>Keep stock updated to avoid cancelled orders.</li>
                <li>Set competitive pricing with honest discounts.</li>
              </ul>
            </InfoPanel>
          </>
        }
      >
        <FilterBar
          value={search}
          onChange={setSearch}
          placeholder="Search listings…"
          onClear={() => setSearch('')}
        />

        {myProducts.length === 0 ? (
          <EmptyState
            title="No products yet"
            description="Start listing your products to reach buyers across the marketplace."
            action={
              <Button onClick={handleOpenNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Create your first product
              </Button>
            }
          />
        ) : (
          <DataTable columns={productColumns} data={filteredProducts} />
        )}
      </PageScaffold>
    </AppPage>
  );
}

export default Selling;
