/**
 * Component catalog — import from here for platform-consistent UI.
 * See COMPONENT_LIBRARY.md for usage guidelines.
 */

// App scaffold
export { KpiSection } from '../app/KpiSection';
export { PageScaffold } from '../app/PageScaffold';

// Layout
export { default as AppPage } from '../layout/AppPage';

// Feedback
export { EmptyState } from '../ui/empty-state';
export { ErrorState } from '../ui/error-state';
export { BrandLoader } from '../ui/brand-loader';

// Tables & filters
export { DataTable } from '../ui/data-table';
export { FilterBar } from '../ui/filter-bar';
export { PageToolbar, PageToolbarGroup } from '../ui/page-toolbar';

// Cards & headers
export { KpiCard } from '../ui/kpi-card';
export { PageHeader } from '../ui/page-header';

// Marketplace
export { ProductCard } from '../marketplace/ProductCard';
export { CartLineItem } from '../marketplace/CartLineItem';
export { OrderSummaryPanel } from '../marketplace/OrderSummaryPanel';
export { CartPromptDialog } from '../marketplace/CartPromptDialog';
export { CheckoutStepIndicator } from '../marketplace/CheckoutStepIndicator';
export { CheckoutProcessingOverlay } from '../marketplace/CheckoutProcessingOverlay';
export { CheckoutRetryPanel } from '../marketplace/CheckoutRetryPanel';
export { SellingProductForm } from '../marketplace/SellingProductForm';

// Platform building blocks
export {
  AppCard,
  MetricCard,
  StatsCard,
  SectionHeader,
  SectionContainer,
  InfoPanel,
  SummaryPanel,
  DetailPanel,
  PageBanner,
  HeroSection,
  FeatureGrid,
  FeatureGridItem,
} from '../platform';
