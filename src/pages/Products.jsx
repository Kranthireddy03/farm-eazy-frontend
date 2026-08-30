import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Package, ShoppingBag, Sprout, Wheat, Flower2, Droplets,
  Wrench, Cog, Bone, Bird, Milk, Boxes, Layers, ShieldCheck, Plus, Pencil, Trash2,
  XCircle, ChevronRight, Search, RefreshCw, AlertCircle,
  Camera, Lock, Minus, Pause, Play, Eye, CalendarDays, Heart, MapPin, Volume2, VolumeX
} from 'lucide-react';
import AppPage from '../components/layout/AppPage';
import { Button } from '../components/ui/button';
import { GlassPanel, StrongPanel, SectionTitle } from '../components/ui/PremiumSurface';
import apiClient from '../services/apiClient';
import ProductService from '../services/ProductService';
import { buildCartItem, addToCartStorage } from '../lib/marketplace';
import { useWishlist } from '../hooks/useWishlist';
import { INDIAN_LOCATIONS } from '../lib/indianLocations';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const CATEGORIES = [
  { value: 'CROPS', label: 'Crops & Produce', icon: Wheat, desc: 'Rice, wheat, vegetables, fruits, pulses and oilseeds' },
  { value: 'SEEDS', label: 'Seeds', icon: Sprout, desc: 'Certified and hybrid seeds for all crops' },
  { value: 'FERTILIZERS', label: 'Fertilizers', icon: Flower2, desc: 'Urea, DAP, NPK and micronutrient fertilizers' },
  { value: 'MANURE', label: 'Manure & Soil Amendments', icon: Layers, desc: 'Organic manure, compost, vermicompost and soil conditioners' },
  { value: 'PESTICIDES', label: 'Pesticides & Crop Protection', icon: ShieldCheck, desc: 'Pesticides, herbicides and fungicides where legally permitted' },
  { value: 'EQUIPMENT', label: 'Farm Equipment', icon: Package, desc: 'Machinery, implements, pumps, sprayers and small machines' },
  { value: 'IRRIGATION', label: 'Irrigation Equipment', icon: Droplets, desc: 'Pumps, sprinklers, drip systems and pipes' },
  { value: 'TOOLS', label: 'Farm Tools', icon: Wrench, desc: 'Hand tools and small farm implements' },
  { value: 'SPARE_PARTS', label: 'Spare Parts', icon: Cog, desc: 'OEM and compatible replacement parts' },
  { value: 'ANIMAL_FEED', label: 'Animal Feed', icon: Bone, desc: 'Cattle and poultry feed, fodder and supplements' },
  { value: 'LIVESTOCK', label: 'Livestock / Cattle', icon: Package, desc: 'Cows, buffalo, goats and sheep with health details' },
  { value: 'POULTRY', label: 'Poultry', icon: Bird, desc: 'Chickens, ducks and poultry stock' },
  { value: 'DAIRY', label: 'Dairy Products', icon: Milk, desc: 'Milk, curd, ghee and dairy farm produce' },
  { value: 'OTHERS', label: 'Other Farm Supplies', icon: Boxes, desc: 'Any other legitimate agricultural product' },
];

const SPECS_BY_CATEGORY = {
  CROPS: [
    { key: 'cropName', label: 'Crop Name', type: 'text', placeholder: 'e.g. Basmati Rice' },
    { key: 'variety', label: 'Variety', type: 'text', placeholder: 'e.g. Pusa Basmati' },
    { key: 'grade', label: 'Grade / Quality', type: 'text', placeholder: 'e.g. Grade A' },
    { key: 'harvestDate', label: 'Harvest Date', type: 'text', placeholder: 'e.g. Nov 2026' },
    { key: 'organic', label: 'Organic / Conventional', type: 'select', options: ['Organic', 'Conventional'] },
    { key: 'farmingMethod', label: 'Farming Method', type: 'text', placeholder: 'e.g. SRI, Drip irrigated' },
    { key: 'moisture', label: 'Moisture %', type: 'text' },
    { key: 'storageCondition', label: 'Storage Condition', type: 'text', placeholder: 'e.g. Cool dry place' },
    { key: 'packaging', label: 'Packaging', type: 'text', placeholder: 'e.g. 50 kg jute bag' },
    { key: 'bestBefore', label: 'Best Before / Expiry', type: 'text', placeholder: 'e.g. 12 months' },
  ],
  SEEDS: [
    { key: 'crop', label: 'Crop', type: 'text' },
    { key: 'variety', label: 'Variety', type: 'text' },
    { key: 'seedType', label: 'Seed Type', type: 'select', options: ['Hybrid', 'Open Pollinated', 'Certified', 'Organic'] },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'germination', label: 'Germination Rate %', type: 'text' },
    { key: 'certification', label: 'Certification Info', type: 'text', placeholder: 'Only if genuinely certified' },
    { key: 'recommendedSeason', label: 'Recommended Growing Season', type: 'text' },
    { key: 'packaging', label: 'Packaging', type: 'text', placeholder: 'e.g. 1 kg packet' },
    { key: 'bestBefore', label: 'Best Before / Expiry', type: 'text' },
    { key: 'storage', label: 'Storage Instructions', type: 'text' },
  ],
  FERTILIZERS: [
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'type', label: 'Type', type: 'select', options: ['Urea', 'DAP', 'NPK', 'Potash', 'Calcium', 'Micronutrient', 'Other'] },
    { key: 'composition', label: 'Composition', type: 'text' },
    { key: 'npk', label: 'NPK Ratio', type: 'text', placeholder: 'e.g. 12-32-16' },
    { key: 'cropCompatibility', label: 'Crop Compatibility', type: 'text' },
    { key: 'usageInstructions', label: 'Usage Instructions', type: 'textarea' },
    { key: 'manufacturer', label: 'Manufacturer', type: 'text' },
    { key: 'regulatoryInfo', label: 'Regulatory / Legal Info', type: 'textarea' },
    { key: 'bestBefore', label: 'Best Before / Expiry', type: 'text' },
  ],
  MANURE: [
    { key: 'type', label: 'Type', type: 'select', options: ['Cow Dung Manure', 'Compost', 'Vermicompost', 'Green Manure', 'Bone Meal', 'Lime', 'Gypsum', 'Other'] },
    { key: 'composition', label: 'Composition', type: 'text' },
    { key: 'npk', label: 'NPK Ratio', type: 'text', placeholder: 'e.g. 0.5-0.2-0.5' },
    { key: 'cropCompatibility', label: 'Crop Compatibility', type: 'text' },
    { key: 'usageInstructions', label: 'Usage Instructions', type: 'textarea' },
    { key: 'bestBefore', label: 'Best Before / Expiry', type: 'text' },
  ],
  PESTICIDES: [
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'type', label: 'Type', type: 'select', options: ['Insecticide', 'Herbicide', 'Fungicide', 'Rodenticide', 'Other'] },
    { key: 'activeIngredient', label: 'Active Ingredient', type: 'text' },
    { key: 'cropCompatibility', label: 'Crop Compatibility', type: 'text' },
    { key: 'usageInstructions', label: 'Usage Instructions', type: 'textarea' },
    { key: 'regulatoryInfo', label: 'Regulatory / Legal Info', type: 'textarea' },
    { key: 'bestBefore', label: 'Best Before / Expiry', type: 'text' },
  ],
  EQUIPMENT: [
    { key: 'equipmentType', label: 'Equipment Type', type: 'text', placeholder: 'e.g. Tractor, Sprayer, Plough, Pump' },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'manufacturingYear', label: 'Manufacturing Year', type: 'text' },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like New', 'Used - Good', 'Used - Fair'] },
    { key: 'usageHours', label: 'Usage Hours', type: 'text' },
    { key: 'power', label: 'Power (HP/kW)', type: 'text' },
    { key: 'capacity', label: 'Capacity', type: 'text' },
    { key: 'dimensions', label: 'Dimensions', type: 'text' },
    { key: 'accessories', label: 'Included Accessories', type: 'text' },
    { key: 'legalInfo', label: 'Legal / Ownership Documents', type: 'textarea' },
  ],
  IRRIGATION: [
    { key: 'equipmentType', label: 'Equipment Type', type: 'select', options: ['Water Pump', 'Sprinkler System', 'Drip System', 'Pipes', 'Valves & Fittings', 'Motor', 'Other'] },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'model', label: 'Model', type: 'text' },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like New', 'Used - Good', 'Used - Fair'] },
    { key: 'power', label: 'Power (HP)', type: 'text' },
    { key: 'capacity', label: 'Capacity', type: 'text', placeholder: 'e.g. 3000 LPH' },
    { key: 'legalInfo', label: 'Legal / Ownership Documents', type: 'textarea' },
  ],
  TOOLS: [
    { key: 'toolType', label: 'Tool Type', type: 'text', placeholder: 'e.g. Hoe, Sickle, Spade' },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Carbon steel' },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used - Good', 'Used - Fair'] },
  ],
  SPARE_PARTS: [
    { key: 'partNumber', label: 'Part Number', type: 'text' },
    { key: 'oemNumber', label: 'OEM / Reference Number', type: 'text' },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'compatibleMachine', label: 'Compatible Machine', type: 'text' },
    { key: 'compatibleModel', label: 'Compatible Model', type: 'text' },
    { key: 'condition', label: 'New / Used', type: 'select', options: ['New', 'Used'] },
  ],
  ANIMAL_FEED: [
    { key: 'feedType', label: 'Feed Type', type: 'select', options: ['Cattle Feed', 'Poultry Feed', 'Fodder', 'Silage', 'Mineral Supplement', 'Other'] },
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'composition', label: 'Composition', type: 'text' },
    { key: 'suitableFor', label: 'Suitable For', type: 'text' },
    { key: 'packaging', label: 'Packaging', type: 'text' },
    { key: 'bestBefore', label: 'Best Before / Expiry', type: 'text' },
  ],
  POULTRY: [
    { key: 'poultryType', label: 'Poultry Type', type: 'select', options: ['Chicken', 'Duck', 'Turkey', 'Other'] },
    { key: 'breed', label: 'Breed', type: 'text' },
    { key: 'age', label: 'Age', type: 'text', placeholder: 'e.g. 6 weeks' },
    { key: 'sex', label: 'Sex', type: 'select', options: ['Male', 'Female', 'Mixed'] },
    { key: 'weight', label: 'Weight', type: 'text', placeholder: 'e.g. 1.8 kg' },
    { key: 'healthStatus', label: 'Health Status', type: 'text' },
    { key: 'vaccinationStatus', label: 'Vaccination Status', type: 'text' },
  ],
  DAIRY: [
    { key: 'dairyType', label: 'Product Type', type: 'select', options: ['Milk', 'Curd', 'Ghee', 'Butter', 'Paneer', 'Buttermilk', 'Other'] },
    { key: 'brand', label: 'Brand / Source', type: 'text' },
    { key: 'fatContent', label: 'Fat Content', type: 'text', placeholder: 'e.g. 6% for toned milk' },
    { key: 'packaging', label: 'Packaging', type: 'text' },
    { key: 'bestBefore', label: 'Best Before / Expiry', type: 'text' },
  ],
  OTHERS: [
    { key: 'brand', label: 'Brand', type: 'text' },
    { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used'] },
    { key: 'legalInfo', label: 'Legal / Regulatory Info', type: 'textarea' },
  ],
};

const UNITS = ['kg', 'quintal', 'tonne', 'bag', 'crate', 'piece', 'litre', 'packet', 'dozen', 'animal', 'lot'];

const IMG_FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#f1f5f9"/><text x="50%" y="50%" font-family="sans-serif" font-size="18" fill="#94a3b8" text-anchor="middle" dominant-baseline="middle">Image unavailable</text></svg>'
);

function isVideoUrl(url) {
  return !!String(url || '').match(/\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i);
}

function testVideoPlayable(file) {
  return new Promise((resolve) => {
    if (!file) return resolve(true);
    if (!String(file.type || '').startsWith('video/')) return resolve(true);
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        URL.revokeObjectURL(url);
        resolve(ok);
      };
      video.onloadedmetadata = () => finish(true);
      video.onerror = () => finish(false);
      video.onstalled = () => finish(true);
      video.src = url;
      setTimeout(() => finish(true), 8000);
    } catch {
      resolve(true);
    }
  });
}

function MediaPlaceholder({ label = 'No image / video attached' }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-muted/30 text-muted-foreground">
      <span className="text-3xl">📷</span>
      <span className="text-[10px] font-semibold text-center px-2 leading-tight">{label}</span>
    </div>
  );
}

function MediaTile({ url, isVideo, alt, className }) {
  if (!url) {
    return <MediaPlaceholder />;
  }
  if (isVideo || isVideoUrl(url)) {
    return (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        className={className || 'w-full h-full object-cover'}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  return (
    <img
      src={url}
      alt={alt || ''}
      className={className || 'w-full h-full object-cover'}
      onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
    />
  );
}

const emptyForm = {
  category: 'CROPS', productName: '', description: '', price: '', discountPercentage: '', quantity: 1, unit: 'kg', weight: '',
  warrantyInfo: '', livestockType: '', livestockBreed: '', livestockSex: '', livestockAge: '', livestockWeight: '',
  livestockHealthStatus: '', livestockVaccinationStatus: '', livestockTransportNotes: '',
  deliveryDaysMin: 3, deliveryDaysMax: 5, locationScope: 'INDIA', locationState: '', locationDistrict: '', locationCity: '', locationPincode: '',
  latitude: '', longitude: '', serviceRadiusKm: 50, deliveryLocationId: '',
  pricingType: 'FIXED_PRICE', specs: {}, keepMediaIds: [], existingMedia: []
};

function money(value) {
  const n = Number(value || 0);
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function parseSpecs(raw) {
  if (!raw) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw); } catch { return {}; }
}

function specText(raw) {
  const specs = parseSpecs(raw);
  const entries = Object.entries(specs).filter(([, v]) => v != null && String(v).trim() !== '');
  if (!entries.length) return '';
  return entries.map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}: ${v}`).join('\n');
}

function statusTone(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'ACTIVE') return 'text-emerald-600 dark:text-emerald-400';
  if (s === 'PAUSED') return 'text-amber-600 dark:text-amber-400';
  if (s === 'OUT_OF_STOCK') return 'text-rose-600 dark:text-rose-400';
  if (s === 'DRAFT' || s === 'PENDING' || s === 'PENDING_PAYMENT' || s === 'PROCESSING') return 'text-sky-600 dark:text-sky-400';
  if (s === 'CONFIRMED' || s === 'PAID' || s === 'DELIVERED' || s === 'COMPLETED' || s === 'SHIPPED') return 'text-sky-600 dark:text-sky-400';
  return 'text-muted-foreground';
}

function statusBadge(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40';
  if (s === 'PAUSED') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40';
  if (s === 'OUT_OF_STOCK') return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40';
  if (s === 'DRAFT' || s === 'PENDING' || s === 'PENDING_PAYMENT' || s === 'PROCESSING') return 'bg-sky-50 text-sky-700 dark:bg-sky-950/20 dark:text-sky-400 border border-sky-200 dark:border-sky-900/40';
  return 'bg-muted text-muted-foreground border border-border';
}

function Field({ label, children, hint, required }) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-sm font-semibold text-foreground">{label}{required ? ' *' : ''}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground block">{hint}</span>}
    </label>
  );
}

function Products() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const p = location.pathname;
    if (p.endsWith('/post')) return 'post';
    if (p.endsWith('/listings')) return 'listings';
    if (p.endsWith('/orders')) return 'orders';
    if (p.endsWith('/saved')) return 'saved';
    if (p.endsWith('/sales')) return 'sales';
    if (p.endsWith('/history')) return 'history';
    return 'marketplace';
  };
  const tab = getActiveTab();

  const [products, setProducts] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selected, setSelected] = useState(null);
  const [detailQty, setDetailQty] = useState(1);
  const [detailMediaIdx, setDetailMediaIdx] = useState(0);
  const [detailMediaError, setDetailMediaError] = useState(false);
  const [detailMediaMuted, setDetailMediaMuted] = useState(true);

  const [showWizard, setShowWizard] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  const [eligibility, setEligibility] = useState(null);
  const [historyMode, setHistoryMode] = useState('purchases');
  const { wishlistIds, isWishlisted, toggleWishlist } = useWishlist();

  const userId = Number(localStorage.getItem('farmEazy_userId'));
  const isOwned = (p) => p && Number(p.sellerId) === userId;

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const loadEligibility = async () => {
    try {
      const res = await apiClient.get('/vendors/listing-eligibility?listingType=PRODUCT', { validateStatus: (s) => s < 500 });
      setEligibility(res?.data || null);
    } catch { setEligibility(null); }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [productsRes, myRes, ordersRes, salesRes] = await Promise.allSettled([
        apiClient.get('/products', { params: { page: 0, size: 60 } }),
        apiClient.get('/products/my-products').catch(() => ({ data: [] })),
        apiClient.get('/orders').catch(() => ({ data: [] })),
        apiClient.get('/orders/seller').catch(() => ({ data: [] })),
      ]);
      setProducts(Array.isArray(productsRes?.value?.data) ? productsRes.value.data : (Array.isArray(productsRes?.value?.data?.content) ? productsRes.value.data.content : []));
      setMyProducts(Array.isArray(myRes?.value?.data) ? myRes.value.data : (Array.isArray(myRes?.value?.data?.content) ? myRes.value.data.content : []));
      setOrders(Array.isArray(ordersRes?.value?.data) ? ordersRes.value.data : []);
      setSales(Array.isArray(salesRes?.value?.data) ? salesRes.value.data : []);
    } catch (e) {
      toast.error('Could not load product marketplace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEligibility();
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload location-filtered products when the user changes their current location
  // (map picker / saved address on login) so the marketplace reflects the area.
  useEffect(() => {
    const onLocationChanged = () => { loadAll(); };
    window.addEventListener('farmeazy:location-changed', onLocationChanged);
    return () => window.removeEventListener('farmeazy:location-changed', onLocationChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (categoryFilter !== 'ALL') list = list.filter((p) => String(p.category || '').toUpperCase() === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.productName?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.sellerFullName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, categoryFilter, search]);

  const myFiltered = useMemo(() => {
    let list = myProducts;
    if (statusFilter !== 'ALL') {
      list = list.filter((p) => String(p.status || '').toUpperCase() === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.productName?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    return list;
  }, [myProducts, search, statusFilter]);

  const setTabFromRoute = (t) => {
    const pathMap = { marketplace: '/products', post: '/products/post', listings: '/products/listings', orders: '/products/orders', saved: '/products/saved', sales: '/products/sales', history: '/products/history' };
    navigate(pathMap[t]);
  };

  const openProduct = (p) => {
    setDetailQty(1);
    setDetailMediaIdx(0);
    setDetailMediaError(false);
    setDetailMediaMuted(true);
    setSelected(p);
  };

  const removeProductFile = (index) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (mediaId) => {
    setForm((f) => ({
      ...f,
      existingMedia: (f.existingMedia || []).filter((m) => m.id !== mediaId),
      keepMediaIds: (f.keepMediaIds || []).filter((id) => id !== mediaId),
    }));
  };

  const handleProductFileSelect = async (e) => {
    const remaining = Math.max(0, 8 - (form.existingMedia?.length || 0));
    const candidates = Array.from(e.target.files || []).slice(0, remaining);
    const accepted = [];
    for (const file of candidates) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds the 50 MB size limit.`);
        continue;
      }
      const playable = await testVideoPlayable(file);
      if (!playable) {
        toast.error(`"${file.name}" uses a video codec your browser can't play. Please upload MP4 (H.264/AAC) or WebM.`);
        continue;
      }
      accepted.push(file);
    }
    setAttachmentFiles((prev) => [...prev, ...accepted].slice(0, Math.max(0, remaining)));
    e.target.value = '';
  };

  const addToCart = (p, qty, goCheckout = false) => {
    if (!p || isOwned(p)) return;
    if (p.deliverable === false) {
      toast.warning(p.deliveryMessage || 'This product is not deliverable to your current location.');
      return;
    }
    if (String(p.status || 'ACTIVE').toUpperCase() !== 'ACTIVE') {
      toast.warning(p.status === 'PAUSED' ? 'This product is paused by the seller and not available for purchase.' : 'This product is not available for purchase.');
      return;
    }
    const requested = Math.max(1, Number(qty) || 1);
    if (Number(p.quantity) <= 0) {
      toast.warning('This product is out of stock.');
      return;
    }
    if (requested > Number(p.quantity)) {
      toast.warning(`Only ${p.quantity} ${p.unit || 'unit'}(s) are available in stock.`);
      return;
    }
    addToCartStorage(buildCartItem(p, requested));
    toast.success('Added to cart');
    if (goCheckout) navigate('/checkout');
    else navigate('/cart');
  };

  const startPost = () => {
    if (eligibility?.eligible !== true) {
      toast.warning(eligibility?.verificationMessage || 'Complete vendor verification to list products.');
      navigate(eligibility?.verificationRedirectPath || '/vendor-dashboard');
      return;
    }
    setForm(emptyForm);
    setEditingId(null);
    setAttachmentFiles([]);
    setCurrentStep(1);
    setShowWizard(true);
  };

  const startEdit = (p) => {
    if (eligibility?.eligible !== true) {
      toast.warning(eligibility?.verificationMessage || 'Complete vendor verification to edit products.');
      navigate(eligibility?.verificationRedirectPath || '/vendor-dashboard');
      return;
    }
    const specs = parseSpecs(p.specifications);
    const existingMedia = Array.isArray(p.mediaItems) ? p.mediaItems : [];
    setForm({
      category: p.category || 'OTHERS',
      productName: p.productName || '',
      description: p.description || '',
      price: p.price ?? '',
      discountPercentage: p.discountPercentage ?? '',
      quantity: Number(p.quantity || 1),
      unit: p.unit || 'kg',
      weight: p.weight || '',
      warrantyInfo: p.warrantyInfo || '',
      livestockType: p.livestockType || '', livestockBreed: p.livestockBreed || '', livestockSex: p.livestockSex || '',
      livestockAge: p.livestockAge || '', livestockWeight: p.livestockWeight || '', livestockHealthStatus: p.livestockHealthStatus || '',
      livestockVaccinationStatus: p.livestockVaccinationStatus || '', livestockTransportNotes: p.livestockTransportNotes || '',
      deliveryDaysMin: p.deliveryDaysMin ?? 3, deliveryDaysMax: p.deliveryDaysMax ?? 5,
      locationScope: p.locationScope || 'INDIA', locationState: p.locationState || '', locationDistrict: p.locationDistrict || '',
      locationCity: p.locationCity || '', locationPincode: p.locationPincode || '',
      latitude: p.geofenceLatitude ?? '', longitude: p.geofenceLongitude ?? '', serviceRadiusKm: p.geofenceRadiusKm ?? 50,
      deliveryLocationId: p.deliveryLocationId ?? '',
      pricingType: p.pricingType || 'FIXED_PRICE',
      specs,
      keepMediaIds: existingMedia.map((m) => m.id),
      existingMedia,
      vendorId: p.vendorId ?? '', vendorName: p.vendorName ?? '', vendorLocation: p.vendorLocation ?? '', vendorType: p.vendorType ?? '',
      sellerEmail: p.sellerEmail ?? '', sellerPhone: p.sellerPhone ?? '', contactEmail: p.contactEmail ?? '', contactPhone: p.contactPhone ?? '',
    });
    setAttachmentFiles([]);
    setEditingId(p.id);
    setCurrentStep(1);
    setShowWizard(true);
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!form.category) { toast.warning('Please choose a product category'); return false; }
    }
    if (currentStep === 2) {
      if (!form.productName.trim() || form.productName.trim().length < 3) { toast.warning('Product name must be at least 3 characters'); return false; }
      if (form.category === 'LIVESTOCK') {
        if (!form.livestockType.trim() || !form.livestockBreed.trim() || !form.livestockSex.trim() || !form.livestockAge.trim()) { toast.warning('Complete livestock type, breed, sex and age details'); return false; }
        if (!form.livestockHealthStatus.trim() || !form.livestockVaccinationStatus.trim()) { toast.warning('Provide livestock health and vaccination status'); return false; }
      }
    }
    if (currentStep === 4) {
      if (!form.price || Number(form.price) <= 0) { toast.warning('Price per unit is required'); return false; }
      if (!form.quantity || Number(form.quantity) < 1) { toast.warning('Available quantity is required'); return false; }
      if (!form.unit) { toast.warning('Price unit is required'); return false; }
      if (form.discountPercentage && (Number(form.discountPercentage) < 0 || Number(form.discountPercentage) > 100)) { toast.warning('Discount must be between 0 and 100'); return false; }
    }
    if (currentStep === 5) {
      if (['STATE', 'DISTRICT', 'CITY', 'RADIUS_KM'].includes(form.locationScope) && !form.locationState.trim()) { toast.warning('State is required for this coverage type'); return false; }
      if (['DISTRICT', 'CITY', 'RADIUS_KM'].includes(form.locationScope) && !form.locationDistrict.trim()) { toast.warning('District is required for this coverage type'); return false; }
      if (['CITY', 'RADIUS_KM'].includes(form.locationScope) && !form.locationCity.trim()) { toast.warning('City / village is required for this coverage type'); return false; }
      if (form.locationScope === 'PINCODE' && !form.locationPincode.trim()) { toast.warning('Pincode is required for pincode-scoped listings'); return false; }
      if (form.locationScope === 'RADIUS_KM') {
        if (!form.serviceRadiusKm || Number(form.serviceRadiusKm) < 1) { toast.warning('Service radius (km) is required'); return false; }
        if (form.latitude === '' || form.longitude === '') { toast.warning('Provide base latitude and longitude coordinates (use Fetch GPS)'); return false; }
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    if (currentStep < 7) setCurrentStep(currentStep + 1);
    else submitProduct();
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const submitProduct = async () => {
    if (!validateStep()) return;
    setSaving(true);
    try {
      const payload = {
        productName: form.productName.trim(),
        category: form.category,
        description: form.description || '',
        price: form.price === '' || !Number.isFinite(Number(form.price)) ? null : Number(form.price),
        discountPercentage: form.discountPercentage === '' || !Number.isFinite(Number(form.discountPercentage)) ? null : Math.min(100, Math.max(0, Number(form.discountPercentage))),
        quantity: Math.max(1, Number(form.quantity) || 1),
        unit: form.unit,
        weight: form.weight || '',
        specifications: JSON.stringify(form.specs || {}),
        warrantyInfo: form.warrantyInfo || '',
        livestockType: form.livestockType || '', livestockBreed: form.livestockBreed || '', livestockSex: form.livestockSex || '',
        livestockAge: form.livestockAge || '', livestockWeight: form.livestockWeight || '', livestockHealthStatus: form.livestockHealthStatus || '',
        livestockVaccinationStatus: form.livestockVaccinationStatus || '', livestockTransportNotes: form.livestockTransportNotes || '',
        deliveryDaysMin: Math.max(0, Number(form.deliveryDaysMin || 3)),
        deliveryDaysMax: Math.max(1, Number(form.deliveryDaysMax || 5)),
        locationScope: form.locationScope,
        locationState: form.locationState || '',
        locationDistrict: form.locationDistrict || '',
        locationCity: form.locationCity || '',
        locationPincode: form.locationPincode || '',
        geofenceLatitude: form.latitude === '' || !Number.isFinite(Number(form.latitude)) ? null : Number(form.latitude),
        geofenceLongitude: form.longitude === '' || !Number.isFinite(Number(form.longitude)) ? null : Number(form.longitude),
        geofenceRadiusKm: form.locationScope === 'RADIUS_KM' ? Math.max(1, Number(form.serviceRadiusKm || 50)) : null,
        deliveryLocationId: form.deliveryLocationId === '' || !Number.isFinite(Number(form.deliveryLocationId)) ? null : Number(form.deliveryLocationId),
        pricingType: 'FIXED_PRICE',
        sellerEmail: localStorage.getItem('farmEazy_email') || '',
        sellerPhone: localStorage.getItem('farmEazy_phone') || '',
        contactEmail: localStorage.getItem('farmEazy_email') || '',
        contactPhone: localStorage.getItem('farmEazy_phone') || '',
        vendorId: form.vendorId ?? '', vendorName: form.vendorName ?? '', vendorLocation: form.vendorLocation ?? '', vendorType: form.vendorType ?? '',
        keepMediaIds: editingId ? (form.keepMediaIds || []) : null,
      };

      const formData = new FormData();
      formData.append('product', JSON.stringify(payload));
      (attachmentFiles || []).forEach((file) => formData.append('files', file));

      if (editingId) {
        await apiClient.put(`/products/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated successfully. You can edit your listing anytime.');
      } else {
        await apiClient.post('/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product listed successfully!');
      }

      setForm(emptyForm);
      setAttachmentFiles([]);
      setCurrentStep(1);
      setEditingId(null);
      setShowWizard(false);
      await loadAll();
      setTabFromRoute('listings');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not save product listing');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (p) => {
    if (!window.confirm(`Delete "${p.productName}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await ProductService.deleteProduct(p.id);
      toast.success('Product deleted');
      await loadAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not delete product');
    } finally { setSaving(false); }
  };

  const toggleStatus = async (p) => {
    const isActive = p.status === 'ACTIVE';
    const isPaused = p.status === 'PAUSED';
    const outOfStock = Number(p.quantity) <= 0;

    if (isActive) {
      if (!window.confirm(`Do you really want to pause "${p.productName}" from the active listing?\n\nPaused products are no longer shown to buyers until you resume them. You can resume it anytime from My Listings.`)) return;
    } else {
      if (outOfStock) {
        toast.warning(`"${p.productName}" is out of stock. Update the quantity first, then it can be resumed.`);
        return;
      }
      if (!window.confirm(`Do you want to resume "${p.productName}"?\n\nIt will become active and visible to buyers again.`)) return;
    }

    const next = isActive ? 'PAUSED' : 'ACTIVE';
    setSaving(true);
    try {
      await ProductService.updateProductStatus(p.id, next);
      toast.success(next === 'ACTIVE' ? 'Product resumed and is now active' : 'Product paused');
      await loadAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not update product status');
    } finally {
      setSaving(false);
    }
  };

  const productImage = (p) => {
    if (Array.isArray(p?.mediaItems) && p.mediaItems.length) return p.mediaItems[0].url;
    if (Array.isArray(p?.mediaUrls) && p.mediaUrls.length) return p.mediaUrls[0];
    if (p?.imageUrls) return p.imageUrls.split(',')[0];
    return null;
  };

  const firstMedia = (p) => {
    if (Array.isArray(p?.mediaItems) && p.mediaItems.length) {
      const m = p.mediaItems[0];
      return { url: m.url, isVideo: String(m.mediaType || '').toUpperCase().includes('VIDEO') };
    }
    if (Array.isArray(p?.mediaUrls) && p.mediaUrls.length) return { url: p.mediaUrls[0], isVideo: isVideoUrl(p.mediaUrls[0]) };
    if (p?.imageUrls) return { url: p.imageUrls.split(',')[0], isVideo: false };
    return { url: null, isVideo: false };
  };

  const renderWizard = () => (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center animate-fadeIn" onClick={() => { setShowWizard(false); setForm(emptyForm); setEditingId(null); setCurrentStep(1); }}>
      <div className="max-w-4xl w-full my-8 ops-panel bg-background border border-border/80 rounded-3xl p-6 shadow-2xl animate-scaleUp relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => { setShowWizard(false); setForm(emptyForm); setEditingId(null); setCurrentStep(1); setAttachmentFiles([]); }}
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition font-bold"
          title="Cancel"
        ><XCircle className="h-5 w-5" /></button>
        <div className="mt-6 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
          <div className="space-y-6">
            <div className="ops-panel p-4 flex items-center justify-between border border-border/80 rounded-2xl bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm">{currentStep}</span>
                <div>
                  <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{editingId ? `Editing Product #${editingId}` : 'New Listing'} · Step {currentStep} of 7</span>
                  <h4 className="text-sm font-bold text-foreground">
                    {currentStep === 1 && 'Product Category'}
                    {currentStep === 2 && 'Basic Details'}
                    {currentStep === 3 && 'Product Specifications'}
                    {currentStep === 4 && 'Pricing & Inventory'}
                    {currentStep === 5 && 'Location & Fulfilment'}
                    {currentStep === 6 && 'Attachments'}
                    {currentStep === 7 && 'Review & Publish'}
                  </h4>
                </div>
              </div>
              <div className="w-1/3 bg-muted rounded-full h-1.5 dark:bg-slate-800 hidden sm:block">
                <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${(currentStep / 7) * 100}%` }}></div>
              </div>
            </div>

            {currentStep === 1 && (
              <GlassPanel className="p-6">
                <SectionTitle eyebrow="Step 1" title="Select product category" text="Each category shows only the fields relevant to that product type." />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    return (
                      <button key={c.value} type="button" onClick={() => {
                        setField('category', c.value);
                        if (form.category !== c.value) {
                          setField('specs', {});
                          setField('livestockType', ''); setField('livestockBreed', ''); setField('livestockSex', '');
                          setField('livestockAge', ''); setField('livestockWeight', '');
                          setField('livestockHealthStatus', ''); setField('livestockVaccinationStatus', ''); setField('livestockTransportNotes', '');
                        }
                      }}
                        className={`ops-panel p-5 text-left border rounded-3xl transition duration-300 flex flex-col justify-between ${form.category === c.value ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                        <Icon className="h-6 w-6 text-primary" />
                        <div className="mt-4">
                          <div className="font-bold text-base text-foreground">{c.label}</div>
                          <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </GlassPanel>
            )}

            {currentStep === 2 && (
              <StrongPanel className="p-6 space-y-6 rounded-3xl">
                <SectionTitle eyebrow="Step 2" title="Basic details" text="What are you selling and how would you describe it?" />
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <Field label="Product Name" required>
                      <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.productName} onChange={(e) => setField('productName', e.target.value)} placeholder="e.g. Organic Basmati Rice (5 kg)" />
                    </Field>
                  </div>
                  <div className="md:col-span-2">
                    <Field label="Description">
                      <textarea className="w-full min-h-[110px] rounded-xl border border-input bg-background px-3 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Describe the product, quality, origin, and anything a buyer should know." />
                    </Field>
                  </div>
                  <Field label="Weight per unit (optional)">
                    <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.weight} onChange={(e) => setField('weight', e.target.value)} placeholder="e.g. 5 kg, 50 kg bag, 450 kg animal" />
                  </Field>
                  <Field label="Warranty / Guarantee Info" hint="Only if applicable for the product">
                    <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.warrantyInfo} onChange={(e) => setField('warrantyInfo', e.target.value)} placeholder="e.g. 6 month manufacturer warranty" />
                  </Field>
                </div>
              </StrongPanel>
            )}

            {currentStep === 3 && (
              <StrongPanel className="p-6 space-y-6 rounded-3xl">
                <SectionTitle eyebrow="Step 3" title="Product specifications" text="Category-specific details buyers need to know. Fields change based on the product category you selected." />
                {(() => {
                  const activeCat = CATEGORIES.find((c) => c.value === form.category) || CATEGORIES[CATEGORIES.length - 1];
                  const CatIcon = activeCat.icon;
                  return (
                    <div className="flex items-center gap-3 bg-muted/20 border border-border/80 rounded-2xl p-4">
                      <span className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0"><CatIcon className="h-6 w-6" /></span>
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Selected category</span>
                        <span className="font-bold text-foreground text-sm">{activeCat.label}</span>
                        <span className="text-xs text-muted-foreground block">{activeCat.desc}</span>
                      </div>
                    </div>
                  );
                })()}
                {(form.category === 'LIVESTOCK') ? (
                  <div className="grid md:grid-cols-2 gap-5">
                    <Field label="Animal Type" required><input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.livestockType} onChange={(e) => setField('livestockType', e.target.value)} placeholder="e.g. Cow, Buffalo, Goat" /></Field>
                    <Field label="Breed" required><input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.livestockBreed} onChange={(e) => setField('livestockBreed', e.target.value)} placeholder="e.g. Gir" /></Field>
                    <Field label="Sex" required><select className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={form.livestockSex} onChange={(e) => setField('livestockSex', e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Mixed</option></select></Field>
                    <Field label="Age" required><input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.livestockAge} onChange={(e) => setField('livestockAge', e.target.value)} placeholder="e.g. 3 years" /></Field>
                    <Field label="Weight"><input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.livestockWeight} onChange={(e) => setField('livestockWeight', e.target.value)} placeholder="e.g. 450 kg" /></Field>
                    <Field label="Health Status" required><input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.livestockHealthStatus} onChange={(e) => setField('livestockHealthStatus', e.target.value)} placeholder="e.g. Healthy, vaccinated" /></Field>
                    <Field label="Vaccination Status" required><input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.livestockVaccinationStatus} onChange={(e) => setField('livestockVaccinationStatus', e.target.value)} placeholder="e.g. FMD + HS + Brucellosis vaccinated" /></Field>
                    <Field label="Transport Notes"><input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.livestockTransportNotes} onChange={(e) => setField('livestockTransportNotes', e.target.value)} placeholder="e.g. Buyer arranges transport" /></Field>
                    <div className="md:col-span-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300 flex gap-2">
                      <ShieldCheck className="h-5 w-5 shrink-0" /> Only list animals you are legally permitted to sell. Share genuine health and vaccination information only.
                    </div>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-5">
                    {(SPECS_BY_CATEGORY[form.category] || SPECS_BY_CATEGORY.OTHERS).map((spec) => {
                      const placeholder = spec.placeholder || `Enter ${spec.label.toLowerCase()}`;
                      return (
                      <Field key={spec.key} label={spec.label} hint={spec.type === 'select' ? placeholder : undefined}>
                        {spec.type === 'select' ? (
                          <select className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={form.specs[spec.key] || ''} onChange={(e) => setField('specs', { ...form.specs, [spec.key]: e.target.value })}>
                            <option value="">Select {spec.label}</option>
                            {spec.options.map((o) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : spec.type === 'textarea' ? (
                          <textarea className="w-full min-h-[90px] rounded-xl border border-input bg-background px-3 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" placeholder={placeholder} value={form.specs[spec.key] || ''} onChange={(e) => setField('specs', { ...form.specs, [spec.key]: e.target.value })} />
                        ) : (
                          <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" placeholder={placeholder} value={form.specs[spec.key] || ''} onChange={(e) => setField('specs', { ...form.specs, [spec.key]: e.target.value })} />
                        )}
                      </Field>
                      );
                    })}
                  </div>
                )}
              </StrongPanel>
            )}

            {currentStep === 4 && (
              <StrongPanel className="p-6 space-y-6 rounded-3xl">
                <SectionTitle eyebrow="Step 4" title="Pricing & inventory" text="Set the price per unit and the stock you have available." />
                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="Price per unit" required hint={`Shown as ₹{price} / {unit}`}>
                    <input type="number" min="0" step="0.01" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.price} onChange={(e) => setField('price', e.target.value)} placeholder="e.g. 3500" />
                  </Field>
                  <Field label="Price Unit" required>
                    <select className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={form.unit} onChange={(e) => setField('unit', e.target.value)}>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </Field>
                  <Field label="Available Quantity (stock)" required>
                    <input type="number" min="1" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.quantity} onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) < 1) { setField('quantity', ''); return; } setField('quantity', Number(v)); }} onBlur={() => { if (form.quantity === '' || Number(form.quantity) < 1) setField('quantity', 1); }} />
                  </Field>
                  <Field label="Discount % (optional)">
                    <input type="number" min="0" max="100" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.discountPercentage} onChange={(e) => setField('discountPercentage', e.target.value)} placeholder="e.g. 10" />
                  </Field>
                  {form.discountPercentage && Number(form.discountPercentage) > 0 && (
                    <div className="md:col-span-2 bg-muted/20 border border-border/80 rounded-2xl p-4 text-sm text-foreground">
                      Effective selling price: <span className="font-bold text-primary">{money(Number(form.price) * (1 - Number(form.discountPercentage) / 100))} / {form.unit}</span> (after {form.discountPercentage}% off {money(form.price)})
                    </div>
                  )}
                </div>
              </StrongPanel>
            )}

            {currentStep === 5 && (
              <StrongPanel className="p-6 space-y-6 rounded-3xl">
                <SectionTitle eyebrow="Step 5" title="Location & Fulfilment" text="Select the coverage limit for this product — radius, states, districts, cities or pincode — and how it is fulfilled." />
                <div className="grid md:grid-cols-2 gap-5">
                  <Field label="Coverage Type" hint="Only buyers within the selected limit can see this product">
                    <select className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={form.locationScope} onChange={(e) => {
                      const val = e.target.value;
                      setField('locationScope', val);
                      if (val === 'RADIUS_KM') {
                        if (form.latitude === '') setField('latitude', 20.5937);
                        if (form.longitude === '') setField('longitude', 78.9629);
                      }
                    }}>
                      <option value="INDIA">All India Coverage</option>
                      <option value="STATE">Limited to State</option>
                      <option value="DISTRICT">Limited to District</option>
                      <option value="CITY">Limited to City/Village</option>
                      <option value="PINCODE">Limited to Pincode</option>
                      <option value="RADIUS_KM">Radius distance from base</option>
                    </select>
                  </Field>

                  {['STATE', 'DISTRICT', 'CITY', 'RADIUS_KM'].includes(form.locationScope) && (
                    <Field label="State Name">
                      <select className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition cursor-pointer" value={form.locationState} onChange={(e) => { const st = e.target.value; setField('locationState', st); setField('locationDistrict', ''); setField('locationCity', ''); }}>
                        <option value="">-- Select State --</option>
                        {Object.keys(INDIAN_LOCATIONS).map((st) => (<option key={st} value={st}>{st}</option>))}
                      </select>
                    </Field>
                  )}

                  {['DISTRICT', 'CITY', 'RADIUS_KM'].includes(form.locationScope) && (
                    <Field label="District Name">
                      <select className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition cursor-pointer" value={form.locationDistrict} onChange={(e) => { const dist = e.target.value; setField('locationDistrict', dist); setField('locationCity', ''); }} disabled={!form.locationState}>
                        <option value="">-- Select District --</option>
                        {(INDIAN_LOCATIONS[form.locationState]?.districts || []).map((dist) => (<option key={dist} value={dist}>{dist}</option>))}
                      </select>
                    </Field>
                  )}

                  {['CITY', 'RADIUS_KM'].includes(form.locationScope) && (
                    <Field label="City / Locality">
                      {(() => {
                        const cities = INDIAN_LOCATIONS[form.locationState]?.cities?.[form.locationDistrict] || [];
                        if (cities.length > 0) {
                          return (
                            <select className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition cursor-pointer" value={form.locationCity} onChange={(e) => setField('locationCity', e.target.value)} disabled={!form.locationDistrict}>
                              <option value="">-- Select City/Village --</option>
                              {cities.map((city) => (<option key={city} value={city}>{city}</option>))}
                            </select>
                          );
                        }
                        return (
                          <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm" value={form.locationCity} onChange={(e) => setField('locationCity', e.target.value)} placeholder="Enter City/Village name" disabled={!form.locationDistrict} />
                        );
                      })()}
                    </Field>
                  )}

                  {form.locationScope === 'PINCODE' && (
                    <Field label="Pincode" required>
                      <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.locationPincode} onChange={(e) => setField('locationPincode', e.target.value)} placeholder="e.g. 500001" />
                    </Field>
                  )}

                  {form.locationScope === 'RADIUS_KM' && (
                    <>
                      <Field label="Service Radius (km)">
                        <input type="number" min="1" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.serviceRadiusKm} onChange={(e) => setField('serviceRadiusKm', e.target.value)} />
                      </Field>
                      <Field label="Latitude Coordinate">
                        <input type="number" step="any" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.latitude || ''} onChange={(e) => setField('latitude', e.target.value)} placeholder="e.g. 14.68" />
                      </Field>
                      <Field label="Longitude Coordinate">
                        <input type="number" step="any" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.longitude || ''} onChange={(e) => setField('longitude', e.target.value)} placeholder="e.g. 77.60" />
                      </Field>
                      <div className="flex items-end pb-1">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                (pos) => {
                                  setField('latitude', pos.coords.latitude);
                                  setField('longitude', pos.coords.longitude);
                                  toast.success('Coordinates fetched from GPS');
                                },
                                () => toast.error('Enable location services to fetch coordinates')
                              );
                            }
                          }}
                          className="w-full h-11 rounded-xl font-semibold border-primary/50 text-primary hover:bg-primary/5 transition flex items-center justify-center gap-2"
                        >
                          <MapPin className="h-4 w-4" /> Fetch GPS Coordinates
                        </Button>
                      </div>
                    </>
                  )}

                  <Field label="Delivery days (min)">
                    <input type="number" min="0" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.deliveryDaysMin} onChange={(e) => setField('deliveryDaysMin', Number(e.target.value) || 0)} />
                  </Field>
                  <Field label="Delivery days (max)">
                    <input type="number" min="0" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.deliveryDaysMax} onChange={(e) => setField('deliveryDaysMax', Number(e.target.value) || 0)} />
                  </Field>
                </div>
              </StrongPanel>
            )}

            {currentStep === 6 && (
              <StrongPanel className="p-6 space-y-6 rounded-3xl">
                <SectionTitle eyebrow="Step 6" title="Attachments" text="Add photos or videos of your product. This step is optional — you can list without attachments." />
                <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border rounded-3xl p-10 text-center">
                  <Camera className="h-10 w-10 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">Upload product images or videos (up to 8 files)</div>
                  <div className="text-xs text-muted-foreground bg-muted/40 border border-border/70 rounded-xl px-3 py-2">
                    <span className="font-semibold text-foreground">Accepted attachments:</span> Images (JPG, PNG, WebP, GIF) · Videos (MP4, WebM) · <span className="font-semibold text-foreground">Max 50 MB per file</span> · <span className="font-semibold text-foreground">Up to 8 files</span>. Videos must use a browser-compatible codec (H.264/AAC or VP8/VP9).
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="text-sm"
                    onChange={handleProductFileSelect}
                  />
                  {attachmentFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {attachmentFiles.map((f, i) => (
                        <span key={i} className="bg-muted/60 border border-border rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                          {f.name}
                          <button
                            type="button"
                            onClick={() => removeProductFile(i)}
                            className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                            title="Remove this file"
                            aria-label={`Remove ${f.name}`}
                          >✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                  {form.existingMedia?.length > 0 && (
                    <div className="mt-2 w-full">
                      <div className="text-xs text-muted-foreground mb-2">Existing media ({form.existingMedia.length} of 8) — tap ✕ to remove anything added by mistake:</div>
                      <div className="flex flex-wrap gap-3 justify-center">
                        {form.existingMedia.map((m) => {
                          const isVideo = String(m.mediaType || '').toUpperCase().includes('VIDEO');
                          return (
                            <div key={m.id} className="relative">
                              {isVideo ? (
                                <div className="h-16 w-16 rounded-xl overflow-hidden bg-black/80 flex items-center justify-center text-white text-lg">▶</div>
                              ) : (
                                <img src={m.url} alt="" className="h-16 w-16 rounded-xl border border-border object-cover" onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }} />
                              )}
                              <button
                                type="button"
                                onClick={() => removeExistingMedia(m.id)}
                                className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center hover:bg-rose-600 shadow"
                                title="Remove existing media"
                                aria-label="Remove existing media"
                              >✕</button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </StrongPanel>
            )}

            {currentStep === 7 && (
              <StrongPanel className="p-6 space-y-5 rounded-3xl">
                <SectionTitle eyebrow="Step 7" title="Review & publish" text="Confirm all the details before publishing." />
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Product</dt><dd className="font-bold text-foreground mt-0.5">{form.productName}</dd></div>
                  <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Category</dt><dd className="font-bold text-foreground mt-0.5">{CATEGORIES.find((c) => c.value === form.category)?.label || form.category}</dd></div>
                  <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Price</dt><dd className="font-bold text-foreground mt-0.5">{money(form.price)} / {form.unit}</dd></div>
                  <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Stock</dt><dd className="font-bold text-foreground mt-0.5">{form.quantity} {form.unit}(s)</dd></div>
                  <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Weight</dt><dd className="font-bold text-foreground mt-0.5">{form.weight || '—'}</dd></div>
                  <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Scope</dt><dd className="font-bold text-foreground mt-0.5">{form.locationScope}{form.locationScope === 'STATE' ? ` · ${form.locationState}` : ''}{form.locationScope === 'PINCODE' ? ` · ${form.locationPincode}` : ''}</dd></div>
                  <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Delivery</dt><dd className="font-bold text-foreground mt-0.5">{form.deliveryDaysMin}–{form.deliveryDaysMax} days</dd></div>
                  <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Attachments</dt><dd className="font-bold text-foreground mt-0.5">{attachmentFiles.length + (form.existingMedia?.length || 0)} file(s)</dd></div>
                  <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Mode</dt><dd className="font-bold text-foreground mt-0.5">{editingId ? 'Updating existing listing' : 'Publishing new listing'}</dd></div>
                </dl>
                {form.description && <p className="text-sm text-foreground leading-relaxed">{form.description}</p>}
                {specText(form.specs) && <pre className="text-xs whitespace-pre-wrap text-muted-foreground bg-muted/30 rounded-xl p-3">{specText(form.specs)}</pre>}
              </StrongPanel>
            )}

            <div className="flex justify-between pt-2">
              <Button size="lg" variant="outline" onClick={prevStep} disabled={currentStep === 1} className="rounded-xl">Back</Button>
              <Button size="lg" onClick={nextStep} disabled={saving} className="rounded-xl flex items-center gap-1 bg-gradient-to-r from-teal-500 to-primary text-white font-semibold">
                {currentStep < 7 ? <>Continue <ChevronRight className="h-4 w-4" /></> : (saving ? (editingId ? 'Updating...' : 'Publishing...') : (editingId ? 'Update Product' : 'Publish Product'))}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProductCard = (p) => {
    const owned = isOwned(p);
    const media = firstMedia(p);
    const effective = p.discountedPrice != null && p.discountedPrice > 0 ? p.discountedPrice : p.price;
    const saved = isWishlisted(p.id);
    return (
      <div key={p.id} className="ops-panel border border-border/80 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-muted/5 flex flex-col">
        <div onClick={() => openProduct(p)} className="cursor-pointer">
          <div className="h-44 bg-muted/30 flex items-center justify-center overflow-hidden relative">
            {media.url ? (
              <MediaTile url={media.url} isVideo={media.isVideo} alt={p.productName} />
            ) : (
              <MediaPlaceholder />
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
              className={`absolute top-2 right-2 h-8 w-8 rounded-full backdrop-blur flex items-center justify-center transition shadow-sm border ${saved ? 'bg-rose-500 text-white border-rose-500' : 'bg-background/90 text-muted-foreground border-border hover:text-rose-500'}`}
              title={saved ? 'Remove from saved' : 'Save product'}
            >
              <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
            </button>
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 px-2 py-0.5 rounded uppercase">{p.category}</span>
              {owned ? (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="h-3 w-3" /> Added by you</span>
              ) : (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>{p.status || 'ACTIVE'}</span>
              )}
            </div>
            <h3 className="font-bold text-foreground line-clamp-2">{p.productName}</h3>
            <div className="text-xs text-muted-foreground line-clamp-1">👤 {p.vendorName || p.sellerFullName || 'Seller'}{p.vendorLocation ? ` · 📍 ${p.vendorLocation}` : ''}</div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-lg font-bold text-foreground">{money(effective)} <span className="text-xs font-normal text-muted-foreground">/ {p.unit}</span></div>
                {p.discountedPrice != null && p.discountedPrice > 0 && p.discountedPrice < p.price && <div className="text-xs text-muted-foreground line-through">{money(p.price)}</div>}
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${Number(p.quantity) > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'}`}>
                {Number(p.quantity) > 0 ? `${p.quantity} ${p.unit}(s)` : 'Out of stock'}
              </span>
            </div>
          </div>
        </div>
        <div className="p-4 pt-0 mt-auto">
          {owned ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 rounded-xl border-primary/50 text-primary hover:bg-primary/5" onClick={() => startEdit(p)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
              <Button size="sm" variant="outline" className="flex-1 rounded-xl" onClick={() => setTabFromRoute('listings')}><Eye className="h-3.5 w-3.5" /> Manage</Button>
            </div>
          ) : p.status !== 'ACTIVE' || Number(p.quantity) <= 0 ? (
            <div className={`rounded-xl p-3 text-center text-xs font-semibold ${p.status === 'PAUSED' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'}`}>
              {p.status === 'PAUSED' ? 'Paused — not available for purchase' : 'Out of stock — not available'}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-primary text-white font-semibold" onClick={() => addToCart(p, 1)}>Add to Cart</Button>
              <Button size="sm" variant="outline" className="flex-1 rounded-xl border-primary/50 text-primary hover:bg-primary/5" onClick={() => { addToCart(p, 1, true); }}>Buy Now</Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selected) return null;
    const p = selected;
    const owned = isOwned(p);
    const effective = p.discountedPrice != null && p.discountedPrice > 0 ? p.discountedPrice : p.price;
    const media = Array.isArray(p.mediaItems) && p.mediaItems.length ? p.mediaItems : (Array.isArray(p.mediaUrls) && p.mediaUrls.length ? p.mediaUrls.map((u, i) => ({ id: i, url: u, mediaType: 'IMAGE' })) : []);
    const specs = parseSpecs(p.specifications);
    const activeMedia = media.length > 0 ? media[Math.min(detailMediaIdx, media.length - 1)] : null;
    const activeIsVideo = activeMedia && String(activeMedia.mediaType || '').toUpperCase().includes('VIDEO');
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setSelected(null)}>
        <div className="max-w-3xl w-full mx-auto my-8 ops-panel bg-background border border-border/80 rounded-3xl p-6 shadow-2xl animate-scaleUp" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between gap-4 border-b pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 px-2 py-0.5 rounded uppercase">{p.category}</span>
                {owned && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="h-3 w-3" /> Added by you</span>}
              </div>
              <h2 className="text-2xl font-bold mt-2 text-foreground">{p.productName}</h2>
              <p className="text-sm text-muted-foreground mt-1">👤 {p.vendorName || p.sellerFullName || 'Seller'}{p.vendorLocation ? ` · 📍 ${p.vendorLocation}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleWishlist(p.id)}
                className={`h-8 w-8 rounded-full flex items-center justify-center transition border ${isWishlisted(p.id) ? 'bg-rose-500 text-white border-rose-500' : 'bg-muted text-muted-foreground border-border hover:text-rose-500'}`}
                title={isWishlisted(p.id) ? 'Remove from saved' : 'Save product'}
              >
                <Heart className={`h-4 w-4 ${isWishlisted(p.id) ? 'fill-current' : ''}`} />
              </button>
              <Button variant="ghost" onClick={() => setSelected(null)} className="h-8 w-8 rounded-full p-0"><XCircle className="h-6 w-6 text-muted-foreground hover:text-foreground" /></Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-5">
            <div>
              {media.length ? (
                <div className="space-y-3">
                  {/* Main preview — fixed dimensions for images and videos */}
                  <div className="relative bg-muted/30 rounded-2xl border border-border/60 overflow-hidden h-72 md:h-80">
                    {activeIsVideo && detailMediaError ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-black text-center px-4">
                        <span className="text-3xl">🎥</span>
                        <span className="text-sm text-amber-300">This video uses a codec your browser can't play.</span>
                        <span className="text-xs text-white/70">Please ask the seller to re-upload it as MP4 (H.264/AAC) or WebM.</span>
                      </div>
                    ) : activeIsVideo ? (
                      <video
                        src={activeMedia.url}
                        controls
                        autoPlay
                        muted={detailMediaMuted}
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain bg-black"
                        onError={() => setDetailMediaError(true)}
                      />
                    ) : (
                      <img
                        src={activeMedia.url}
                        alt={p.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }}
                      />
                    )}
                    {activeIsVideo && !detailMediaError && (
                      <button
                        type="button"
                        onClick={(e) => {
                          const next = !detailMediaMuted;
                          setDetailMediaMuted(next);
                          const v = e.currentTarget.parentElement?.querySelector('video');
                          if (v) {
                            v.muted = next;
                            if (v.paused) v.play().catch(() => {});
                          }
                        }}
                        className="absolute bottom-2 left-2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                        title={detailMediaMuted ? 'Unmute (sound on)' : 'Mute (sound off)'}
                        aria-label={detailMediaMuted ? 'Unmute' : 'Mute'}
                      >
                        {detailMediaMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      </button>
                    )}
                    {media.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => { setDetailMediaIdx((i) => (i + media.length - 1) % media.length); setDetailMediaError(false); }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                          aria-label="Previous media"
                        >‹</button>
                        <button
                          type="button"
                          onClick={() => { setDetailMediaIdx((i) => (i + 1) % media.length); setDetailMediaError(false); }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition"
                          aria-label="Next media"
                        >›</button>
                        <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full">
                          {Math.min(detailMediaIdx, media.length - 1) + 1} / {media.length}
                        </span>
                      </>
                    )}
                  </div>
                  {/* Thumbnail strip — scrollable, supports all media up to 8 */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {media.slice(0, 8).map((m, i) => {
                      const isVideo = String(m.mediaType || '').toUpperCase().includes('VIDEO');
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => { setDetailMediaIdx(i); setDetailMediaError(false); }}
                          className={`h-16 w-16 shrink-0 rounded-xl border-2 overflow-hidden bg-muted/30 transition ${i === Math.min(detailMediaIdx, media.length - 1) ? 'border-primary' : 'border-border hover:border-primary/50'}`}
                          title={isVideo ? 'Video' : 'Photo'}
                        >
                          {isVideo ? (
                            <div className="relative w-full h-full bg-black/80 flex items-center justify-center text-white text-lg">▶</div>
                          ) : (
                            <img src={m.url} alt={`${p.productName} ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = IMG_FALLBACK; }} />
                          )}
                        </button>
                      );
                    })}
                    {media.length > 8 && (
                      <span className="shrink-0 h-16 w-16 rounded-xl border-2 border-border bg-muted/30 flex items-center justify-center text-xs font-bold text-muted-foreground">
                        +{media.length - 8}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-56 bg-muted/30 rounded-2xl flex items-center justify-center"><MediaPlaceholder label="No image or video attached to this product" /></div>
              )}
            </div>
            <div className="space-y-3">
              <div className="ops-panel p-4 border border-border/80 rounded-2xl bg-muted/10">
                <span className="text-xs text-muted-foreground font-semibold uppercase">Price</span>
                <div className="text-2xl font-bold text-foreground mt-1">{money(effective)} <span className="text-sm text-muted-foreground font-normal">/ {p.unit}</span></div>
                {p.discountedPrice != null && p.discountedPrice > 0 && p.discountedPrice < p.price && <div className="text-sm text-muted-foreground line-through">{money(p.price)}</div>}
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Status</dt><dd className={`font-bold mt-0.5 ${statusTone(p.status)}`}>{p.status || 'ACTIVE'}</dd></div>
                <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Stock</dt><dd className={`font-bold mt-0.5 ${Number(p.quantity) > 0 ? 'text-foreground' : 'text-rose-600'}`}>{Number(p.quantity) > 0 ? `${p.quantity} ${p.unit}(s)` : 'Out of stock'}</dd></div>
                <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Weight</dt><dd className="font-bold text-foreground mt-0.5">{p.weight || '—'}</dd></div>
                <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Delivery</dt><dd className="font-bold text-foreground mt-0.5">{p.deliveryDaysMin != null ? `${p.deliveryDaysMin}–${p.deliveryDaysMax} days` : '—'}</dd></div>
                <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Coverage</dt><dd className="font-bold text-foreground mt-0.5">
                  {p.locationScope || 'INDIA'}
                  {p.locationState ? ` · ${p.locationState}` : ''}
                  {p.locationDistrict ? ` · ${p.locationDistrict}` : ''}
                  {p.locationCity ? ` · ${p.locationCity}` : ''}
                  {p.locationPincode ? ` · ${p.locationPincode}` : ''}
                  {p.geofenceRadiusKm ? ` · ${p.geofenceRadiusKm} km` : ''}
                </dd></div>
                <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Condition / Warranty</dt><dd className="font-bold text-foreground mt-0.5">{p.warrantyInfo || '—'}</dd></div>
                <div className="bg-background p-3 rounded-xl border border-border/50"><dt className="text-[10px] text-muted-foreground uppercase font-bold">Deliverable</dt><dd className="font-bold text-foreground mt-0.5">{p.deliverable === false ? 'Check delivery' : 'Yes'}</dd></div>
              </dl>
              {p.livestockType && (
                <div className="bg-background p-3 rounded-xl border border-border/50 text-sm">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Livestock Details</span>
                  <div className="font-medium text-foreground">{p.livestockType} · {p.livestockBreed} · {p.livestockSex} · {p.livestockAge} · {p.livestockWeight || ''}</div>
                  {p.livestockHealthStatus && <div className="text-xs text-muted-foreground mt-1">Health: {p.livestockHealthStatus}</div>}
                  {p.livestockVaccinationStatus && <div className="text-xs text-muted-foreground mt-1">Vaccination: {p.livestockVaccinationStatus}</div>}
                  {p.livestockTransportNotes && <div className="text-xs text-muted-foreground mt-1">Transport: {p.livestockTransportNotes}</div>}
                </div>
              )}
            </div>
          </div>

          {p.description && (
            <div className="mt-5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description</span>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{p.description}</p>
            </div>
          )}

          {Object.keys(specs).length > 0 && (
            <div className="mt-4">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Specifications</span>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {Object.entries(specs).filter(([, v]) => v != null && String(v).trim() !== '').map(([k, v]) => (
                  <div key={k} className="bg-background p-3 rounded-xl border border-border/50">
                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">{k.replace(/([A-Z])/g, ' $1')}</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border/60">
            {owned ? (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Lock className="h-5 w-5 shrink-0" />
                <span>This product was added by you. It is visible in the marketplace for buyers but you cannot purchase it yourself. You can edit or manage it from <b>My Listings</b>.</span>
              </div>
            ) : p.status === 'PAUSED' ? (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <Pause className="h-5 w-5 shrink-0" /> This product is currently paused by the seller and not available for purchase.
              </div>
            ) : Number(p.quantity) > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-xl" disabled={detailQty <= 1} onClick={() => setDetailQty((q) => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></Button>
                  <input type="number" min="1" max={p.quantity} className="w-20 h-10 rounded-xl border border-input bg-background px-3 text-center text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={detailQty} onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) < 1) { setDetailQty(''); return; } setDetailQty(Math.min(Number(v), Number(p.quantity || 1))); }} onBlur={() => { if (!detailQty || Number(detailQty) < 1) setDetailQty(1); }} />
                  <Button size="sm" variant="outline" className="h-9 w-9 p-0 rounded-xl" disabled={detailQty >= Number(p.quantity || 1)} onClick={() => setDetailQty((q) => Math.min(Number(p.quantity || 1), (Number(q) || 1) + 1))}><Plus className="h-4 w-4" /></Button>
                </div>
                <Button className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-primary text-white font-semibold" onClick={() => addToCart(p, Number(detailQty) || 1)}>Add to Cart</Button>
                <Button variant="outline" className="flex-1 rounded-xl border-primary/50 text-primary hover:bg-primary/5" onClick={() => addToCart(p, Number(detailQty) || 1, true)}>Buy Now</Button>
              </div>
            ) : (
              <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl p-4 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" /> This product is currently out of stock.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOrderCard = (o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    return (
      <div key={o.id} className="ops-panel p-6 border border-border/80 rounded-2xl hover:shadow-lg transition bg-gradient-to-r from-background to-muted/5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded">ORDER #{o.id}</span>
              <span className={`text-sm font-bold ${statusTone(o.orderStatus)}`}>{o.orderStatus}</span>
              <span className="text-xs text-muted-foreground">{o.paymentStatus}</span>
            </div>
            <h3 className="font-bold text-lg text-foreground">{items.map((i) => i.productName).join(', ') || 'Order'}</h3>
            <div className="text-sm text-muted-foreground flex flex-wrap gap-4 leading-none">
              {items.map((i) => (
                <span key={i.productId} className="text-xs">×{i.quantity} @ {money(i.price)}/{i.quantity ? '' : ''} {i.sellerName ? ` · ${i.sellerName}` : ''}</span>
              ))}
              {o.createdAt && <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4 text-primary" /> {new Date(o.createdAt).toLocaleDateString('en-IN')}</span>}
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-lg font-bold text-foreground">{money(o.finalAmount ?? o.totalAmount)}</div>
            {o.coinsUsed > 0 && <div className="text-xs text-amber-600">🪙 {o.coinsUsed} coins used</div>}
            {o.couponCode && <div className="text-xs text-emerald-600">Coupon {o.couponCode}: -{money(o.couponDiscount)}</div>}
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => {
    const list = historyMode === 'purchases' ? orders : sales;
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Button size="sm" variant={historyMode === 'purchases' ? 'default' : 'outline'} className="rounded-xl" onClick={() => setHistoryMode('purchases')}>My Purchases</Button>
          <Button size="sm" variant={historyMode === 'sales' ? 'default' : 'outline'} className="rounded-xl" onClick={() => setHistoryMode('sales')}>My Sales</Button>
        </div>
        {list.length === 0 ? (
          <GlassPanel className="p-8 text-center text-muted-foreground">No {historyMode === 'purchases' ? 'purchase' : 'sales'} records yet.</GlassPanel>
        ) : (
          <div className="space-y-4">{list.map(renderOrderCard)}</div>
        )}
      </div>
    );
  };

  const renderOrdersTab = () => (
    orders.length === 0 ? (
      <GlassPanel className="p-8 text-center text-muted-foreground">You have not placed any product orders yet. Visit the Marketplace to start.</GlassPanel>
    ) : <div className="space-y-4">{orders.map(renderOrderCard)}</div>
  );

  const savedProducts = useMemo(() => {
    if (!wishlistIds.length) return [];
    const idSet = new Set(wishlistIds.map(Number));
    return products.filter((p) => idSet.has(Number(p.id)));
  }, [products, wishlistIds]);

  const renderSavedTab = () => {
    const list = savedProducts;
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2"><Heart className="h-5 w-5 text-rose-500" /> Saved Products</h3>
            <p className="text-sm text-muted-foreground">Products you saved. Add them to your cart or remove them anytime.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setTabFromRoute('marketplace')} className="rounded-xl">Browse Marketplace</Button>
        </div>
        {list.length === 0 ? (
          <GlassPanel className="p-10 text-center">
            <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">You have not saved any products yet. Tap the heart icon on a product to save it here.</p>
            <Button onClick={() => setTabFromRoute('marketplace')} className="rounded-xl bg-gradient-to-r from-teal-500 to-primary text-white font-semibold">Explore Products</Button>
          </GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {list.map((p) => {
              const media = firstMedia(p);
              const effective = p.discountedPrice != null && p.discountedPrice > 0 ? p.discountedPrice : p.price;
              const owned = isOwned(p);
              return (
                <div key={p.id} className="ops-panel border border-border/80 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-muted/5 flex flex-col">
                  <div className="h-40 bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => openProduct(p)}>
                    {media.url ? <MediaTile url={media.url} isVideo={media.isVideo} alt={p.productName} /> : <MediaPlaceholder />}
                  </div>
                  <div className="p-4 space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 px-2 py-0.5 rounded uppercase">{p.category}</span>
                      {owned && <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="h-3 w-3" /> Added by you</span>}
                    </div>
                    <h3 className="font-bold text-foreground">{p.productName}</h3>
                    <div className="text-sm font-semibold text-foreground">{money(effective)} <span className="text-xs text-muted-foreground">/ {p.unit} · Stock {p.quantity}</span></div>
                  </div>
                  <div className="p-4 pt-2 flex gap-2">
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => toggleWishlist(p.id)} title="Remove from saved"><Trash2 className="h-3.5 w-3.5 text-rose-500" /></Button>
                    {!owned && (
                      <Button size="sm" className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-primary text-white font-semibold" onClick={() => addToCart(p, 1)}>
                        <ShoppingBag className="h-3.5 w-3.5" /> Add to Cart
                      </Button>
                    )}
                    {!owned && (
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl border-primary/50 text-primary hover:bg-primary/5" onClick={() => addToCart(p, 1, true)}>Buy Now</Button>
                    )}
                    {owned && (
                      <Button size="sm" variant="outline" className="flex-1 rounded-xl border-primary/50 text-primary hover:bg-primary/5" onClick={() => startEdit(p)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderSalesTab = () => (
    sales.length === 0 ? (
      <GlassPanel className="p-8 text-center text-muted-foreground">You have not received any product orders yet. When buyers order your products, they appear here.</GlassPanel>
    ) : <div className="space-y-4">{sales.map(renderOrderCard)}</div>
  );

  const renderListingsTab = () => {
    const listings = myFiltered;
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input className="h-10 rounded-xl border border-input bg-background pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition w-56 md:w-64" placeholder="Search my products…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition cursor-pointer" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} title="Filter by listing status">
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="DISCONTINUED">Discontinued</option>
            </select>
            <span className="text-xs text-muted-foreground">{listings.length} of {myProducts.length} listing(s)</span>
          </div>
          <Button onClick={startPost} className="px-5 py-2.5 font-bold bg-gradient-to-r from-teal-500 to-primary hover:from-teal-600 hover:to-primary/95 text-white rounded-xl shadow-lg shadow-teal-500/10 transition transform hover:-translate-y-0.5">➕ Post Product</Button>
        </div>
        {listings.length === 0 ? (
          <GlassPanel className="p-8 text-center text-muted-foreground">No products match the current filter. {myProducts.length === 0 ? 'Click "Post Product" above to start.' : 'Try a different status or search term.'}</GlassPanel>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {listings.map((p) => {
              const media = firstMedia(p);
              const effective = p.discountedPrice != null && p.discountedPrice > 0 ? p.discountedPrice : p.price;
              const isActive = p.status === 'ACTIVE';
              return (
                <div key={p.id} className="ops-panel border border-border/80 rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-muted/5 flex flex-col">
                  <div className="h-40 bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => openProduct(p)}>
                    {media.url ? <MediaTile url={media.url} isVideo={media.isVideo} alt={p.productName} /> : <MediaPlaceholder />}
                  </div>
                  <div className="p-4 space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 px-2 py-0.5 rounded uppercase">{p.category}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>{p.status || 'ACTIVE'}</span>
                      {Number(p.quantity) <= 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">Out of stock</span>}
                    </div>
                    <h3 className="font-bold text-foreground">{p.productName}</h3>
                    <div className="text-sm font-semibold text-foreground">{money(effective)} <span className="text-xs text-muted-foreground">/ {p.unit} · Stock {p.quantity}</span></div>
                  </div>
                  <div className="p-4 pt-2 flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 rounded-xl border-primary/50 text-primary hover:bg-primary/5" onClick={() => startEdit(p)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                    <Button size="sm" variant={isActive ? 'outline' : 'default'} className={isActive ? 'rounded-xl' : 'rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold'} onClick={() => toggleStatus(p)} title={isActive ? 'Pause this product from active listing' : 'Resume this product as active'}>
                      {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      <span className="ml-1 hidden sm:inline">{isActive ? 'Pause' : 'Resume'}</span>
                    </Button>
                    <Button size="sm" variant="destructive" className="rounded-xl" onClick={() => deleteProduct(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const listingStats = useMemo(() => {
    const totalListings = myProducts.length;
    const activeListings = myProducts.filter((p) => p.status === 'ACTIVE').length;
    const outOfStockListings = myProducts.filter((p) => Number(p.quantity) <= 0).length;
    const listedUnits = myProducts.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    return { totalListings, activeListings, outOfStockListings, listedUnits };
  }, [myProducts]);

  const renderPostTab = () => (
    <div className="space-y-6">
      {eligibility?.eligible !== true ? (
        <GlassPanel className="p-8 text-center">
          <h3 className="text-lg font-bold text-foreground mb-1">Verified vendor access required</h3>
          <p className="text-sm text-muted-foreground mb-4">{eligibility?.verificationMessage || 'Complete vendor verification to list products.'}</p>
          <Button size="lg" onClick={() => navigate(eligibility?.verificationRedirectPath || '/vendor-dashboard')} className="rounded-xl bg-gradient-to-r from-teal-500 to-primary text-white font-bold px-8">Complete Verification</Button>
        </GlassPanel>
      ) : (
        <>
          {!showWizard && (
            <div className="space-y-6 animate-fadeIn">
              <GlassPanel className="p-6 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-primary/5 rounded-3xl relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/15 rounded-full blur-2xl"></div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full uppercase tracking-wider">Verified Product Seller 🌟</span>
                    <h3 className="text-2xl font-bold text-foreground">List your farm products and reach buyers near you</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                      Add produce, seeds, fertilizers, equipment, livestock and supplies. You can edit your listings anytime — no buyer approval is required.
                    </p>
                  </div>
                  <Button
                    onClick={() => { setEditingId(null); setForm(emptyForm); setAttachmentFiles([]); setCurrentStep(1); setShowWizard(true); }}
                    className="px-6 py-3 font-bold bg-gradient-to-r from-teal-500 to-primary hover:from-teal-600 hover:to-primary/95 text-white rounded-2xl shadow-lg shadow-teal-500/10 transition transform hover:-translate-y-0.5"
                    title="Add a new product listing"
                  >
                    ➕ Post Product
                  </Button>
                </div>
              </GlassPanel>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="ops-panel p-5 border border-border/80 rounded-2xl bg-card">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">Total Listed Products</span>
                  <div className="text-3xl font-bold text-foreground mt-2">{listingStats.totalListings}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">Total products registered</p>
                </div>
                <div className="ops-panel p-5 border border-border/80 rounded-2xl bg-card">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">Active Listings</span>
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{listingStats.activeListings}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">Live and purchasable</p>
                </div>
                <div className="ops-panel p-5 border border-border/80 rounded-2xl bg-card">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">Out of Stock</span>
                  <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-2">{listingStats.outOfStockListings}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">Need restocking</p>
                </div>
                <div className="ops-panel p-5 border border-border/80 rounded-2xl bg-card">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">Total Units Listed</span>
                  <div className="text-3xl font-bold text-foreground mt-2">{listingStats.listedUnits}</div>
                  <p className="text-[10px] text-muted-foreground mt-1">Combined stock across products</p>
                </div>
              </div>

              {myProducts.length > 0 && (
                <div>
                  <SectionTitle eyebrow="My Listings" title="Your product inventory" text="Manage stock, price and status — edit any time." />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
                    {myProducts.slice(0, 6).map((p) => {
                      const media = firstMedia(p);
                      const effective = p.discountedPrice != null && p.discountedPrice > 0 ? p.discountedPrice : p.price;
                      return (
                        <div key={p.id} className="ops-panel border border-border/80 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-muted/5 flex flex-col">
                          <div className="h-36 bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => openProduct(p)}>
                            {media.url ? <MediaTile url={media.url} isVideo={media.isVideo} alt={p.productName} /> : <MediaPlaceholder />}
                          </div>
                          <div className="p-4 space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 px-2 py-0.5 rounded uppercase">{p.category}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>{p.status || 'ACTIVE'}</span>
                              {Number(p.quantity) <= 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">Out of stock</span>}
                            </div>
                            <h3 className="font-bold text-foreground text-sm">{p.productName}</h3>
                            <div className="text-sm font-semibold text-foreground">{money(effective)} <span className="text-xs text-muted-foreground">/ {p.unit} · Stock {p.quantity}</span></div>
                          </div>
                          <div className="p-4 pt-2 flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 rounded-xl border-primary/50 text-primary hover:bg-primary/5" onClick={() => startEdit(p)}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                            <Button size="sm" variant={p.status === 'ACTIVE' ? 'outline' : 'default'} className={p.status === 'ACTIVE' ? 'rounded-xl' : 'rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold'} onClick={() => toggleStatus(p)} title={p.status === 'ACTIVE' ? 'Pause this product' : 'Resume this product'}>
                              {p.status === 'ACTIVE' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                              <span className="ml-1 hidden sm:inline">{p.status === 'ACTIVE' ? 'Pause' : 'Resume'}</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-right">
                    <Button variant="outline" size="sm" onClick={() => setTabFromRoute('listings')} className="rounded-xl">View all my listings →</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderMarketplaceTab = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ops-panel p-4 border border-border/80 rounded-2xl bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase">Products Near You</span>
          <div className="text-2xl font-bold text-foreground mt-1">{products.length}</div>
        </div>
        <div className="ops-panel p-4 border border-border/80 rounded-2xl bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase">My Listings</span>
          <div className="text-2xl font-bold text-foreground mt-1">{listingStats.totalListings}</div>
        </div>
        <div className="ops-panel p-4 border border-border/80 rounded-2xl bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase">Active</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{listingStats.activeListings}</div>
        </div>
        <div className="ops-panel p-4 border border-border/80 rounded-2xl bg-card">
          <span className="text-xs text-muted-foreground font-semibold uppercase">Out of Stock</span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{listingStats.outOfStockListings}</div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input className="w-full h-11 rounded-xl border border-input bg-background pl-9 pr-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" placeholder="Search products, sellers, categories…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select className="h-11 rounded-xl border border-input bg-background px-3 text-sm focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition cursor-pointer" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <Button onClick={startPost} className="px-5 py-2.5 font-bold bg-gradient-to-r from-teal-500 to-primary hover:from-teal-600 hover:to-primary/95 text-white rounded-xl shadow-lg shadow-teal-500/10 transition transform hover:-translate-y-0.5">➕ Post Product</Button>
        </div>
      </div>
      {filteredProducts.length === 0 ? (
        <GlassPanel className="p-10 text-center text-muted-foreground">No products match your filters. Try another category or search term.</GlassPanel>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(renderProductCard)}
        </div>
      )}
    </div>
  );

  if (loading && !products.length && !myProducts.length) {
    return <AppPage title="Products" description="Agricultural product marketplace"><div className="h-64 flex items-center justify-center text-muted-foreground">Loading…</div></AppPage>;
  }

  const getHeaderInfo = () => {
    switch (tab) {
      case 'post':
        return { title: 'Sell / Post Product', description: 'List produce, seeds, fertilizers, equipment, livestock and farm supplies for sale.' };
      case 'listings':
        return { title: 'My Product Listings', description: 'Manage your listed products, stock, pricing and status. You can edit anytime.' };
      case 'orders':
        return { title: 'My Product Orders', description: 'Orders you placed as a buyer — track status and payment.' };
      case 'saved':
        return { title: 'Saved Products', description: 'Products you saved from the marketplace — add them to your cart anytime.' };
      case 'sales':
        return { title: 'My Sales', description: 'Orders received for your products.' };
      case 'history':
        return { title: 'Product History', description: 'Your past purchases and sales.' };
      default:
        return { title: 'Products Marketplace', description: 'Buy and sell agricultural produce, seeds, fertilizers, equipment, livestock and farm supplies.' };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <AppPage noMotion title={headerInfo.title} description={headerInfo.description}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={loadAll} title="Refresh marketplace and order data" className="rounded-xl flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh Data
          </Button>
        </div>

        {tab === 'marketplace' && renderMarketplaceTab()}
        {tab === 'post' && renderPostTab()}
        {tab === 'listings' && renderListingsTab()}
        {tab === 'orders' && renderOrdersTab()}
        {tab === 'saved' && renderSavedTab()}
        {tab === 'sales' && renderSalesTab()}
        {tab === 'history' && renderHistoryTab()}
      </div>

      {showWizard && renderWizard()}
      {renderDetailModal()}
    </AppPage>
  );
}

export default Products;
