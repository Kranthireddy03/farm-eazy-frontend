import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  CalendarDays, CheckCircle2, Clock3, Coins, Filter, MapPin, 
  PackagePlus, Tractor, Users, Wrench, XCircle, ChevronRight, 
  Plus, RefreshCw, AlertCircle, AlertTriangle, ArrowLeft, Trash2, Sparkles, 
  Store, Check, Info, ShieldCheck, HelpCircle, Pencil, Lock, Volume2, VolumeX
} from 'lucide-react';
import AppPage from '../components/layout/AppPage';
import { Button } from '../components/ui/button';
import { GlassPanel, StrongPanel, SectionTitle } from '../components/ui/PremiumSurface';
import apiClient from '../services/apiClient';
import LocationService from '../services/LocationService';
import { toast } from 'sonner';

const TYPES = [
  ['TRACTOR', 'Tractor', Tractor, 'Ploughing, tilling, rotavation, transport support'],
  ['JCB', 'JCB / Excavator', Wrench, 'Excavation, trench digging, land leveling'],
  ['MANUAL', 'Manual Labour', Users, 'Sowing, weeding, harvesting, loading support'],
  ['HARVESTER', 'Harvester', PackagePlus, 'Paddy, wheat, maize crop harvesting'],
  ['IRRIGATION', 'Irrigation Equipment', Wrench, 'Sprinklers, water pumps, pipe systems'],
  ['OTHER', 'Other Equipment / Services', Wrench, 'Custom agricultural services & rentals'],
];

const PURPOSES_BY_TYPE = {
  TRACTOR: ['Ploughing', 'Tilling', 'Cultivation', 'Rotavation', 'Sowing', 'Seed drilling', 'Harvest support', 'Transportation', 'Trailer/trolley work', 'Land preparation', 'Levelling', 'Other'],
  JCB: ['Excavation', 'Land levelling', 'Pond digging', 'Trench digging', 'Farm road work', 'Earth moving', 'Drainage', 'Construction support', 'Other'],
  MANUAL: ['Sowing', 'Weeding', 'Harvesting', 'Transplanting', 'Spraying support', 'Loading/unloading', 'Sorting', 'Packing', 'General farm work', 'Other'],
  HARVESTER: ['Paddy harvester', 'Wheat harvester', 'Maize harvester', 'Multi-crop harvester', 'Sugarcane harvester', 'Other'],
  IRRIGATION: ['Water pump rental', 'Sprinkler setup', 'Drip installation', 'Water tank transportation', 'Other'],
  OTHER: ['General rental', 'Repair support', 'Agronomy support', 'Other'],
};

const emptyForm = {
  type: 'TRACTOR', title: '', description: '', location: '', rate: '', basePrice: '', machinePrice: '', driverPrice: '', priceUnit: 'PER_HOUR',
  driverOption: 'NOT_AVAILABLE', fuelIncluded: false, operatorIncluded: false, minimumHours: 1, maximumHours: '', serviceRadiusKm: 50,
  locationScope: 'INDIA', locationState: '', locationDistrict: '', locationCity: '', locationPincode: '', availableFrom: '', availableUntil: '', availabilityStartTime: '06:00', availabilityEndTime: '18:00', availableDaysOfWeek: 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY', blackoutDates: '',
  quantityTotal: 1, pickupDropAvailable: false, pickupCharge: '', dropCharge: '', transportPerKm: '', equipmentPower: '', equipmentModel: '', implementsAvailable: '', workersCount: '', toolsIncluded: false, experienceYears: '', servicePurposes: [], customAttributes: {}, unitConfigurations: [],
  sameUnitConfig: true,
  cancellationPolicy: 'Free cancellation up to 24 hours prior to service start',
  refundPolicy: 'FULL_REFUND',
  rescheduleAllowed: true
};

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

function money(value) {
  const n = Number(value || 0);
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function unitPrice(l) {
  if (!l) return 0;
  const isManual = String(l.type || '').toUpperCase() === 'MANUAL';
  const machine = Number(l.machinePrice ?? 0);
  const total = Number(l.totalPrice ?? 0);
  const rate = Number(l.rate ?? 0);
  if (isManual) return rate || total || machine;
  return machine || total || rate;
}

function priceUnitLabel(value) {
  return String(value || 'PER_HOUR').toLowerCase().replace('per_', '');
}

function unitLabel(unit) {
  return unit != null ? `Unit ${unit}` : 'Unit';
}

function statusTone(status) {  const s = String(status || '').toUpperCase();
  if (['APPROVED', 'CONFIRMED', 'COMPLETED', 'SUCCESS', 'PAID'].includes(s)) return 'text-emerald-600 dark:text-emerald-400 font-semibold';
  if (['PENDING', 'PAYMENT_PENDING'].includes(s)) return 'text-amber-600 dark:text-amber-400 font-semibold';
  if (['DECLINED', 'CANCELLED', 'EXPIRED', 'FAILED'].includes(s)) return 'text-rose-600 dark:text-rose-400 font-semibold';
  return 'text-sky-600 dark:text-sky-400 font-semibold';
}

function Field({ label, children, hint }) {
  return (
    <label className="space-y-1.5 block">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground block">{hint}</span>}
    </label>
  );
}

function UnitDetailsPanel({ listing, selectedUnit, onSelectUnit }) {
  const units = Array.isArray(listing?.unitConfigurations) ? listing.unitConfigurations : [];
  const totalUnits = Math.max(1, Number(listing?.quantityTotal || 1));
  const isManual = String(listing?.type || '').toUpperCase() === 'MANUAL';
  const priceUnit = priceUnitLabel(listing?.priceUnit);
  const selectedIdx = Math.min(Math.max(0, selectedUnit ?? 0), Math.max(0, totalUnits - 1));
  const unit = units.length > 0 ? units[selectedIdx] : null;

  const unitPriceValue = (u) => {
    const machine = Number(u?.machinePrice ?? 0);
    const rate = Number(u?.rate ?? 0);
    if (isManual) return rate || machine;
    return machine || rate;
  };

  return (
    <div className="space-y-3">
      {totalUnits > 1 && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-foreground">View unit:</span>
          <select
            className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition cursor-pointer"
            value={selectedIdx}
            onChange={(e) => onSelectUnit && onSelectUnit(Number(e.target.value))}
            title="Select which physical unit details to view"
          >
            {Array.from({ length: totalUnits }, (_, i) => (
              <option key={i} value={i}>Unit {i + 1} of {totalUnits}</option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
        <div className="bg-background p-3 rounded-xl border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Unit Number</div>
          <div className="font-bold text-foreground mt-0.5">Unit {selectedIdx + 1} of {totalUnits}</div>
        </div>
        <div className="bg-background p-3 rounded-xl border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Model / Ref</div>
          <div className="font-bold text-foreground mt-0.5">{unit?.model || listing?.equipmentModel || '—'}</div>
        </div>
        <div className="bg-background p-3 rounded-xl border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Power / Capacity</div>
          <div className="font-bold text-foreground mt-0.5">{unit?.power || listing?.equipmentPower || '—'}</div>
        </div>
        <div className="bg-background p-3 rounded-xl border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase font-bold">{isManual ? 'Worker Rate' : 'Machine Price'}</div>
          <div className="font-bold text-foreground mt-0.5">
            {money(unitPriceValue(unit) || unitPrice(listing))} <span className="text-xs font-normal text-muted-foreground">/ {priceUnit}</span>
          </div>
        </div>
        <div className="bg-background p-3 rounded-xl border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Driver / Operator</div>
          <div className="font-bold text-foreground mt-0.5">
            {unit ? (
              unit.driverAvailable ? `Available${unit.driverPrice != null && unit.driverPrice !== '' ? ` (${money(unit.driverPrice)}/hr)` : ''}` : 'Not available'
            ) : (
              listing?.driverOption === 'INCLUDED' ? 'Included' : listing?.driverOption === 'AVAILABLE' ? 'Available (extra)' : 'Not available'
            )}
          </div>
        </div>
        <div className="bg-background p-3 rounded-xl border border-border/50">
          <div className="text-[10px] text-muted-foreground uppercase font-bold">Implements</div>
          <div className="font-bold text-foreground mt-0.5">{unit?.implements || '—'}</div>
        </div>
        {unit?.status && (
          <div className="bg-background p-3 rounded-xl border border-border/50">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Unit Status</div>
            <div className={`font-bold mt-0.5 ${statusTone(unit.status)}`}>{unit.status}</div>
          </div>
        )}
      </div>
      {!units.length && (
        <p className="text-xs text-muted-foreground">Unit-wise configuration is not available for this listing; a single shared configuration applies to all {totalUnits} unit(s).</p>
      )}
    </div>
  );
}

const INDIAN_LOCATIONS = {
  "Andhra Pradesh": {
    districts: ["Anantapur", "Chittoor", "East Godavari", "Guntur", "Krishna", "Kurnool", "Nellore", "Prakasam", "Srikakulam", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
    cities: {
      "Anantapur": ["Anantapur City", "Gooty", "Dharmavaram", "Hindupur", "Tadipatri", "Kadiri", "Rayadurg"],
      "Chittoor": ["Chittoor City", "Tirupati", "Madanapalle", "Kalahasti", "Punganur"],
      "Guntur": ["Guntur City", "Tenali", "Narasaraopet", "Bapatla", "Repalle"],
      "Kurnool": ["Kurnool City", "Adoni", "Nandyal", "Yemmiganur", "Dhone"],
      "West Godavari": ["Eluru", "Bhimavaram", "Tadepalligudem", "Tanuku", "Palakollu"]
    }
  },
  "Karnataka": {
    districts: ["Bagalkot", "Bangalore Rural", "Bangalore Urban", "Belgaum", "Bellary", "Bidar", "Bijapur", "Chamarajanagar", "Chikballapur", "Chikmagalur", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Gulbarga", "Hassan", "Haveri", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysore", "Raichur", "Ramanagara", "Shimoga", "Tumkur", "Udupi", "Uttara Kannada", "Yadgir"],
    cities: {
      "Bangalore Urban": ["Bengaluru City", "Yelahanka", "Kengeri", "Anekal", "Krishnarajapuram"],
      "Belgaum": ["Belagavi City", "Gokak", "Nipani", "Athani", "Bailhongal"],
      "Mysore": ["Mysuru City", "Nanjangud", "Hunsur", "T. Narasipura", "K.R. Nagar"],
      "Dharwad": ["Hubballi City", "Dharwad City", "Navalgund", "Kundgol", "Kalghatgi"],
      "Kolar": ["Kolar City", "Robertsonpet", "Bangarapet", "Mulbagal", "Malur"]
    }
  },
  "Maharashtra": {
    districts: ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
    cities: {
      "Pune": ["Pune City", "Baramati", "Chakan", "Lonavala", "Jejuri"],
      "Nashik": ["Nashik City", "Malegaon", "Manmad", "Sinnar", "Yeola"],
      "Nagpur": ["Nagpur City", "Kamptee", "Umred", "Katol", "Ramtek"],
      "Kolhapur": ["Kolhapur City", "Ichalkaranji", "Jaysingpur", "Kagal", "Panhala"]
    }
  },
  "Punjab": {
    districts: ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Tarn Taran"],
    cities: {
      "Amritsar": ["Amritsar City", "Ajnala", "Rayya", "Majitha", "Baba Bakala"],
      "Ludhiana": ["Ludhiana City", "Khanna", "Jagraon", "Samrala", "Mullanpur"],
      "Patiala": ["Patiala City", "Rajpura", "Nabha", "Samana", "Patran"],
      "Jalandhar": ["Jalandhar City", "Nakodar", "Phillaur", "Kartarpur", "Shahkot"]
    }
  },
  "Haryana": {
    districts: ["Ambala", "Bhiwani", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
    cities: {
      "Gurugram": ["Gurugram City", "Sohna", "Manesar", "Pataudi", "Farrukhnagar"],
      "Hisar": ["Hisar City", "Hansi", "Uklana", "Barwala", "Narnaund"],
      "Karnal": ["Karnal City", "Gharaunda", "Indri", "Nilokheri", "Assandh"],
      "Rohtak": ["Rohtak City", "Meham", "Kalanaur", "Sampla"]
    }
  },
  "Uttar Pradesh": {
    districts: ["Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amroha", "Auraiya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bijnor", "Budaun", "Buldhahr", "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Faizabad", "Farrukhabad", "Fatehpur", "Firozabad", "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi", "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kheri", "Kushinagar", "Lalitpur", "Lucknow", "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Moradabad", "Muzaffarnagar", "Pilibhit", "Pratapgarh", "Raebareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti", "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"],
    cities: {
      "Lucknow": ["Lucknow City", "Malihabad", "Bakshi Ka Talab", "Kakori", "Gosainganj"],
      "Varanasi": ["Varanasi City", "Ramnagar", "Pindra", "Cholapur"],
      "Agra": ["Agra City", "Fatehpur Sikri", "Etmadpur", "Achhnera", "Pinahat"],
      "Kanpur Nagar": ["Kanpur City", "Bilhau", "Ghatampur", "Bidhuna"]
    }
  },
  "Telangana": {
    districts: ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam", "Kumuram Bheem Asifabad", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak", "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"],
    cities: {
      "Karimnagar": ["Karimnagar City", "Huzurabad", "Jagtial", "Choppadandi", "Manakondur"],
      "Nalgonda": ["Nalgonda City", "Miryalaguda", "Suryapet City", "Devarakonda", "Nagarjuna Sagar"],
      "Mahabubnagar": ["Mahabubnagar City", "Jadcherla", "Kalwakurthy", "Wanaparthy City", "Gadwal City"],
      "Nizamabad": ["Nizamabad City", "Armoor", "Bodhan", "Kamareddy City", "Banswada"]
    }
  }
};

export default function Services() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.endsWith('/post')) return 'post';
    if (path.endsWith('/posted')) return 'posted';
    if (path.endsWith('/bookings')) return 'bookings';
    if (path.endsWith('/requests')) return 'requests';
    if (path.endsWith('/history')) return 'history';
    if (path.endsWith('/provider-history')) return 'provider-history';
    
    // Fallback to query params for legacy DB notification links
    const queryTab = searchParams.get('tab');
    if (queryTab) return queryTab;
    
    return 'discover';
  };

  const tab = getActiveTab();

  const tabs = [
    ['discover', 'Marketplace'],
    ['post', 'Post Service'],
    ['posted', 'My Listings'],
    ['bookings', 'My Bookings'],
    ['requests', 'Service Requests'],
    ['history', 'Service History'],
    ['provider-history', 'Provider History']
  ];

  // Load state and listings/bookings lists
  const [listings, setListings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [historyBookings, setHistoryBookings] = useState([]);
  const [activeRequests, setActiveRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [providerListings, setProviderListings] = useState([]);
  const [farms, setFarms] = useState([]);
  const [crops, setCrops] = useState([]);
  const [selected, setSelected] = useState(null);
  
  // Forms & Wizards
  const [form, setForm] = useState(emptyForm);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentUnitSetupIdx, setCurrentUnitSetupIdx] = useState(0);
  const [showPostingWizard, setShowPostingWizard] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailUnitIdx, setDetailUnitIdx] = useState(0);
  const [serviceMediaIdx, setServiceMediaIdx] = useState(0);
  const [serviceMediaError, setServiceMediaError] = useState(false);
  const [serviceMediaMuted, setServiceMediaMuted] = useState(true);
  const [postedUnitIdx, setPostedUnitIdx] = useState({});

  const [booking, setBooking] = useState({
    latitude: null, longitude: null, serviceDate: '', startTime: '08:00', endTime: '12:00',
    hours: 4, requestedQuantity: 1, selectedUnitNumbers: [1], peopleCount: '', areaQuantity: '',
    farmId: '', cropId: '', includeDriver: false, includePickup: false, includeDrop: false,
    location: '', notes: ''
  });

  const [eligibility, setEligibility] = useState({ eligible: true, verificationMessage: '' });
  const [activeZones, setActiveZones] = useState([]);
  const [serviceZoneCheck, setServiceZoneCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('');
  
  // History tab filtering
  const [statusFilter, setStatusFilter] = useState('');
  const [historyFarmId, setHistoryFarmId] = useState('');
  const [historyCropId, setHistoryCropId] = useState('');
  
  // Price adjustments & checkout
  const [adjustments, setAdjustments] = useState({});
  const [attachmentFiles, setAttachmentFiles] = useState([]);
  const [serviceCoupons, setServiceCoupons] = useState({});
  const [couponApplying, setCouponApplying] = useState({});

  const selectedFarms = useMemo(() => farms || [], [farms]);
  const visibleCrops = useMemo(() => {
    if (!booking.farmId) return crops || [];
    return (crops || []).filter((c) => String(c.farmId ?? c.farm?.id ?? '') === String(booking.farmId));
  }, [booking.farmId, crops]);

  const load = async () => {
    setLoading(true);
    try {
      const [eligRes, ls, bs, ps, myLs, hs, phs, fs, cs, azs] = await Promise.all([
        apiClient.get('/vendors/listing-eligibility?listingType=SERVICE', { validateStatus: (status) => status < 500 }).catch(() => null),
        apiClient.get('/services/listings', { params: { page: 0, size: 30 } }),
        apiClient.get('/services/bookings/my-bookings', { params: { page: 0, size: 30 } }),
        apiClient.get('/services/bookings/my-listings', { params: { page: 0, size: 30 } }),
        apiClient.get('/services/listings/my', { params: { page: 0, size: 30 } }).catch(() => ({ data: { content: [] } })),
        apiClient.get('/services/bookings/history', { params: { page: 0, size: 100 } }).catch(() => ({ data: { content: [] } })),
        apiClient.get('/services/bookings/provider-history', { params: { page: 0, size: 100 } }).catch(() => ({ data: { content: [] } })),
        apiClient.get('/farms'),
        apiClient.get('/crops'),
        LocationService.getActiveZones().catch(() => []),
      ]);

      if (eligRes) setEligibility(eligRes.data);
      setListings(ls?.data?.content || []);
      setActiveBookings(bs?.data?.content || []);
      setActiveRequests(ps?.data?.content || []);
      setProviderListings(myLs?.data?.content || []);
      setHistoryBookings(hs?.data?.content || []);
      setHistoryRequests(phs?.data?.content || []);
      setFarms(fs?.data?.content || fs?.data || []);
      setCrops(cs?.data?.content || cs?.data || []);
      setActiveZones(Array.isArray(azs) ? azs : []);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Unable to load services data');
    } finally {
      setLoading(false);
    }
  };

  // Real-time verification of service coverage against active zones
  useEffect(() => {
    let active = true;
    const verifyServiceLocation = async () => {
      if (currentStep !== 5) return;

      const payload = {
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        city: form.locationCity || null,
        state: form.locationState || null,
        postalCode: form.locationPincode || null,
      };

      const res = await LocationService.checkLocationStatus(payload);
      if (active) {
        setServiceZoneCheck(res);
      }
    };

    verifyServiceLocation();
    return () => { active = false; };
  }, [currentStep, form.locationScope, form.locationState, form.locationDistrict, form.locationCity, form.locationPincode, form.latitude, form.longitude]);

  useEffect(() => {
    load();
  }, []);

  // Reload location-filtered listings when the user changes their current location
  // (map picker / saved address on login) so services immediately reflect the area.
  useEffect(() => {
    const onLocationChanged = () => { load(); };
    window.addEventListener('farmeazy:location-changed', onLocationChanged);
    return () => window.removeEventListener('farmeazy:location-changed', onLocationChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize Leaflet Map for radius-based location base coordinate selection
  useEffect(() => {
    if (tab !== 'post' || currentStep !== 5 || form.locationScope !== 'RADIUS_KM') return;

    let mapInstance = null;
    let markerInstance = null;
    let circleInstance = null;

    const initMap = () => {
      const container = document.getElementById('posting-map');
      if (!container) return;

      const initLat = Number(form.latitude || 20.5937);
      const initLng = Number(form.longitude || 78.9629);

      // Create map
      mapInstance = window.L.map('posting-map').setView([initLat, initLng], 5);

      // Add OpenStreetMap tile layer
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
        crossOrigin: true
      }).addTo(mapInstance);

      // Add draggable marker
      markerInstance = window.L.marker([initLat, initLng], { draggable: true }).addTo(mapInstance);

      // Add radius overlay circle
      const radiusMeters = Number(form.serviceRadiusKm || 50) * 1000;
      circleInstance = window.L.circle([initLat, initLng], {
        color: '#14b8a6',
        fillColor: '#14b8a6',
        fillOpacity: 0.15,
        radius: radiusMeters
      }).addTo(mapInstance);

      // Adjust map view to fit circle boundary
      mapInstance.fitBounds(circleInstance.getBounds());

      // Update coordinates on dragend
      markerInstance.on('dragend', () => {
        const pos = markerInstance.getLatLng();
        setForm((f) => ({ ...f, latitude: pos.lat, longitude: pos.lng }));
        circleInstance.setLatLng(pos);
      });
    };

    // Load Leaflet CDN assets dynamically if not already available in global window
    if (!window.L) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setTimeout(initMap, 150);
      };
      document.body.appendChild(script);
    } else {
      setTimeout(initMap, 150);
    }

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [tab, currentStep, form.locationScope, form.serviceRadiusKm]);

  const setTab = (newTab) => {
    if (newTab === 'discover') navigate('/services');
    else navigate(`/services/${newTab}`);
  };

  const setField = (key, value) => {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      // Default dynamic implements or purposes when categories change
      if (key === 'type') {
        updated.servicePurposes = [PURPOSES_BY_TYPE[value]?.[0] || 'Other'];
        updated.unitConfigurations = [];
        updated.quantityTotal = 1;
        updated.sameUnitConfig = true;
      }
      return updated;
    });
  };

  const resizeUnitConfigurations = (count, sameConfig = true) => {
    const n = Math.max(1, Number(count || 1));
    setForm((f) => {
      const isManual = f.type === 'MANUAL';
      const existing = f.unitConfigurations || [];
      const next = [];
      for (let i = 0; i < n; i++) {
        if (sameConfig) {
          next.push({
            unitNumber: i + 1,
            model: f.equipmentModel || '',
            power: f.equipmentPower || '',
            machinePrice: isManual ? (f.rate || '') : (f.machinePrice || ''),
            rate: isManual ? (f.rate || '') : '',
            driverPrice: f.driverPrice || '',
            driverAvailable: f.driverOption !== 'NOT_AVAILABLE',
            implements: f.implementsAvailable || ''
          });
        } else {
          next.push(existing[i] || {
            unitNumber: i + 1,
            model: '',
            power: '',
            machinePrice: isManual ? (f.rate || '') : '',
            rate: isManual ? (f.rate || '') : '',
            driverPrice: '',
            driverAvailable: f.driverOption !== 'NOT_AVAILABLE',
            implements: ''
          });
        }
      }
      return { ...f, quantityTotal: n, unitConfigurations: next, sameUnitConfig: sameConfig };
    });
  };

  const updateUnit = (index, key, value) => {
    setForm((f) => ({
      ...f,
      unitConfigurations: (f.unitConfigurations || []).map((u, i) => i === index ? { ...u, [key]: value } : u)
    }));
  };

  const setBookingField = (key, value) => setBooking((b) => ({ ...b, [key]: value }));

  const filteredListings = listings.filter((l) => !filterType || String(l.type).toUpperCase() === filterType);
  const filteredHistory = historyBookings.filter((b) => 
    (!statusFilter || String(b.status || '').toUpperCase() === statusFilter) && 
    (!historyFarmId || String(b.farmId || '') === String(historyFarmId)) && 
    (!historyCropId || String(b.cropId || '') === String(historyCropId))
  );
  const historyTotal = filteredHistory.reduce((sum, b) => sum + Number(b.finalTotalAmount ?? b.totalAmount ?? 0), 0);

  // File validator
  const handleAttachmentSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    const existingCount = Array.isArray(form.attachmentUrls) ? form.attachmentUrls.length : 0;
    if (existingCount + attachmentFiles.length + files.length > 10) {
      toast.error('You can upload at most 10 images/videos in total.');
      return;
    }
    const validated = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB size limit.`);
        continue;
      }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`Unsupported format for ${file.name}. Only images/videos allowed.`);
        continue;
      }
      const playable = await testVideoPlayable(file);
      if (!playable) {
        toast.error(`"${file.name}" uses a video codec your browser can't play. Please upload MP4 (H.264/AAC) or WebM.`);
        continue;
      }
      validated.push(file);
    }
    setAttachmentFiles((prev) => [...prev, ...validated]);
    e.target.value = '';
  };

  const removeSelectedFile = (idx) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingServiceAttachment = (url) => {
    setForm((f) => ({
      ...f,
      attachmentUrls: (Array.isArray(f.attachmentUrls) ? f.attachmentUrls : []).filter((u) => u !== url),
    }));
  };

  // Stepper Validations
  const validateStep = () => {
    if (currentStep === 1) {
      if (!form.title.trim()) { toast.warning('Title is required'); return false; }
      if (!form.location.trim()) { toast.warning('Location base is required'); return false; }
      if (!form.contactName.trim()) { toast.warning('Contact name is required'); return false; }
      if (!form.contactPhone.match(/^[0-9]{10}$/)) { toast.warning('Provide a valid 10-digit phone number'); return false; }
    }
    if (currentStep === 2) {
      if (form.type === 'TRACTOR') {
        if (!form.equipmentPower.trim()) { toast.warning('Tractor horsepower is required'); return false; }
      }
    }
    if (currentStep === 3) {
      if (form.type !== 'MANUAL') {
        if (form.sameUnitConfig) {
          if (!form.machinePrice || Number(form.machinePrice) <= 0) { toast.warning('Base machine price is required'); return false; }
        } else {
          // Validate individual units configuration
          for (let i = 0; i < form.unitConfigurations.length; i++) {
            const u = form.unitConfigurations[i];
            if (!u.machinePrice || Number(u.machinePrice) <= 0) {
              toast.warning(`Provide machine price for Unit ${i + 1}`);
              return false;
            }
          }
        }
      } else if (form.sameUnitConfig || Number(form.quantityTotal || 1) <= 1) {
        if (!form.rate || Number(form.rate) <= 0) { toast.warning('Worker rate is required'); return false; }
      } else {
        // Validate individual labour unit rates
        for (let i = 0; i < (form.unitConfigurations || []).length; i++) {
          const u = form.unitConfigurations[i];
          const r = Number(u?.rate ?? u?.machinePrice ?? 0);
          if (!r || r <= 0) {
            toast.warning(`Provide worker rate for Unit ${i + 1}`);
            return false;
          }
        }
      }
    }
    if (currentStep === 4) {
      if (form.availableFrom && form.availableUntil && new Date(form.availableUntil) < new Date(form.availableFrom)) {
        toast.warning('Availability end date cannot precede start date');
        return false;
      }
    }
    if (currentStep === 5) {
      if (form.locationScope === 'RADIUS_KM' && (!form.serviceRadiusKm || Number(form.serviceRadiusKm) < 1)) {
        toast.warning('Provide a valid service radius (km)');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    
    // Multi-unit configuration stepper control
    if (currentStep === 3 && !form.sameUnitConfig && Number(form.quantityTotal || 1) > 1) {
      if (currentUnitSetupIdx < Number(form.quantityTotal) - 1) {
        setCurrentUnitSetupIdx(currentUnitSetupIdx + 1);
        return;
      }
    }

    setCurrentStep((s) => s + 1);
  };

  const prevStep = () => {
    if (currentStep === 3 && !form.sameUnitConfig && currentUnitSetupIdx > 0) {
      setCurrentUnitSetupIdx(currentUnitSetupIdx - 1);
      return;
    }
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  // Submit listing wizard
  const createListing = async () => {
    setSaving(true);
    try {
      let uploadedUrls = [];
      if (attachmentFiles.length) {
        const data = new FormData();
        attachmentFiles.forEach((file) => data.append('files', file));
        const uploaded = await apiClient.post('/services/attachments/upload', data, { 
          headers: { 'Content-Type': 'multipart/form-data' } 
        });
        uploadedUrls = uploaded?.data?.urls || uploaded?.data?.attachmentUrls || [];
      }

      const isManual = form.type === 'MANUAL';
      const qty = Math.max(1, Number(form.quantityTotal || 1));
      const srcConfigs = form.unitConfigurations || [];
      const unitConfigurations = [];
      for (let i = 0; i < qty; i++) {
        const u = srcConfigs[i] || {};
        let machinePrice;
        let unitRate;
        if (isManual) {
          if (form.sameUnitConfig) {
            unitRate = Number(form.rate) || 0;
            machinePrice = unitRate;
          } else {
            unitRate = Number(u.rate) || Number(u.machinePrice) || 0;
            machinePrice = unitRate;
          }
        } else {
          machinePrice = form.sameUnitConfig ? (form.machinePrice === '' ? null : Number(form.machinePrice)) : (u.machinePrice === '' || u.machinePrice == null ? null : Number(u.machinePrice));
        }
        unitConfigurations.push({
          unitNumber: i + 1,
          model: u.model || form.equipmentModel || '',
          power: u.power || form.equipmentPower || '',
          machinePrice,
          rate: isManual ? unitRate : undefined,
          driverPrice: form.sameUnitConfig
            ? (form.driverOption === 'NOT_AVAILABLE' ? 0 : Number(form.driverPrice) || 0)
            : (u.driverPrice === '' || u.driverPrice == null ? null : Number(u.driverPrice)),
          driverAvailable: form.sameUnitConfig ? form.driverOption !== 'NOT_AVAILABLE' : Boolean(u.driverAvailable),
          implements: u.implements || ''
        });
      }

      const effectiveManualRate = isManual
        ? (form.sameUnitConfig
          ? (Number(form.rate) || 1)
          : (Number(srcConfigs[0]?.rate) || Number(srcConfigs[0]?.machinePrice) || Number(form.rate) || 1))
        : Number(form.rate || 1);

      const payload = {
        ...form,
        basePrice: form.basePrice === '' ? null : Number(form.basePrice),
        machinePrice: isManual ? effectiveManualRate : (form.machinePrice === '' ? null : Number(form.machinePrice)),
        driverPrice: form.driverPrice === '' ? null : Number(form.driverPrice),
        minimumHours: Number(form.minimumHours || 1),
        maximumHours: form.maximumHours === '' ? null : Number(form.maximumHours),
        serviceRadiusKm: Number(form.serviceRadiusKm || 50),
        quantityTotal: qty,
        pickupCharge: form.pickupCharge === '' ? 0 : Number(form.pickupCharge),
        dropCharge: form.dropCharge === '' ? 0 : Number(form.dropCharge),
        transportPerKm: form.transportPerKm === '' ? 0 : Number(form.transportPerKm),
        workersCount: isManual ? qty : (form.workersCount === '' ? null : Number(form.workersCount)),
        experienceYears: form.experienceYears === '' ? null : Number(form.experienceYears),
        implementsAvailable: form.implementsAvailable ? form.implementsAvailable.split(',').map((x) => x.trim()).filter(Boolean) : [],
        servicePurposes: form.servicePurposes,
        unitConfigurations,
        availability: `${form.availableFrom || 'open'} to ${form.availableUntil || 'open'}`,
        rate: isManual ? effectiveManualRate : (form.rate === '' ? (form.machinePrice === '' ? 1 : Number(form.machinePrice)) : Number(form.rate)),
        attachmentUrls: [...(Array.isArray(form.attachmentUrls) ? form.attachmentUrls : []), ...uploadedUrls]
      };

      if (editingId) {
        await apiClient.put(`/services/listings/${editingId}/enhanced`, payload);
        toast.success('Service listing updated successfully!');
      } else {
        await apiClient.post('/services/listings/enhanced', payload);
        toast.success('Marketplace service listing published!');
      }

      setForm(emptyForm);
      setAttachmentFiles([]);
      setCurrentStep(1);
      setCurrentUnitSetupIdx(0);
      setEditingId(null);
      setShowPostingWizard(false);
      await load();
      setTab('posted');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not publish service listing');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (l) => {
    const isManual = String(l.type || '').toUpperCase() === 'MANUAL';
    const units = Array.isArray(l.unitConfigurations) ? l.unitConfigurations : [];
    const qty = Math.max(1, Number(l.quantityTotal || 1));
    const same = units.length < 2 || units.every((u) =>
      String(u?.machinePrice ?? '') === String(units[0]?.machinePrice ?? '')
      && String(u?.driverPrice ?? '') === String(units[0]?.driverPrice ?? '')
      && Boolean(u?.driverAvailable) === Boolean(units[0]?.driverAvailable)
    );
    const firstUnit = units[0] || {};
    setForm((f) => ({
      ...f,
      type: l.type || 'TRACTOR',
      title: l.title || '',
      description: l.description || '',
      location: l.location || '',
      rate: l.rate != null ? l.rate : (isManual ? l.machinePrice : ''),
      machinePrice: isManual ? (l.rate ?? l.machinePrice) : (l.machinePrice ?? firstUnit.machinePrice ?? ''),
      driverPrice: l.driverPrice ?? firstUnit.driverPrice ?? '',
      priceUnit: l.priceUnit || 'PER_HOUR',
      driverOption: l.driverOption || (l.operatorIncluded ? 'INCLUDED' : l.hasDriver ? 'AVAILABLE' : 'NOT_AVAILABLE'),
      fuelIncluded: Boolean(l.fuelIncluded),
      operatorIncluded: Boolean(l.operatorIncluded),
      minimumHours: l.minimumHours ?? 1,
      maximumHours: l.maximumHours ?? '',
      serviceRadiusKm: l.serviceRadiusKm ?? 50,
      locationScope: l.locationScope || 'INDIA',
      locationState: l.locationState || '',
      locationDistrict: l.locationDistrict || '',
      locationCity: l.locationCity || '',
      locationPincode: l.locationPincode || '',
      availableFrom: l.availableFrom || '',
      availableUntil: l.availableUntil || '',
      availabilityStartTime: l.availabilityStartTime || '06:00',
      availabilityEndTime: l.availabilityEndTime || '18:00',
      availableDaysOfWeek: l.availableDaysOfWeek || '',
      blackoutDates: l.blackoutDates || '',
      quantityTotal: qty,
      pickupDropAvailable: Boolean(l.pickupDropAvailable),
      pickupCharge: l.pickupCharge ?? '',
      dropCharge: l.dropCharge ?? '',
      transportPerKm: l.transportPerKm ?? '',
      equipmentPower: l.equipmentPower || '',
      equipmentModel: l.equipmentModel || '',
      implementsAvailable: Array.isArray(l.implementsAvailable) ? l.implementsAvailable.join(', ') : (l.implementsAvailable || ''),
      workersCount: l.workersCount ?? '',
      toolsIncluded: Boolean(l.toolsIncluded),
      experienceYears: l.experienceYears ?? '',
      servicePurposes: Array.isArray(l.servicePurposes) ? l.servicePurposes : [],
      contactName: l.contactName || '',
      contactPhone: l.contactPhone || '',
      contactEmail: l.contactEmail || '',
      attachmentUrls: Array.isArray(l.attachmentUrls) ? l.attachmentUrls : [],
      sameUnitConfig: same,
      unitConfigurations: same ? [] : units.map((u, i) => ({
        unitNumber: i + 1,
        model: u?.model || '',
        power: u?.power || '',
        machinePrice: u?.machinePrice ?? '',
        rate: u?.rate ?? '',
        driverPrice: u?.driverPrice ?? '',
        driverAvailable: Boolean(u?.driverAvailable),
        implements: u?.implements || ''
      }))
    }));
    setAttachmentFiles([]);
    setEditingId(l.id);
    setCurrentStep(1);
    setCurrentUnitSetupIdx(0);
    setShowPostingWizard(true);
    setTimeout(() => {
      if (same) resizeUnitConfigurations(qty, true);
    }, 0);
  };

  const openBooking = async (listing) => {
    setServiceMediaIdx(0);
    setServiceMediaError(false);
    setServiceMediaMuted(true);
    let resolved = listing;
    try {
      const detail = await apiClient.get(`/services/listings/${listing.id}/details`);
      resolved = detail.data;
      setSelected(detail.data);
    } catch {
      setSelected(listing);
    }
    const unitCount = Math.max(1, Number(resolved.quantityTotal || 1));
    const initialQuantity = Math.min(Math.max(1, Number(booking.requestedQuantity || 1)), unitCount);
    setBooking((b) => ({
      ...b,
      location: resolved.location || '',
      serviceDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      includeDriver: Boolean(resolved.operatorIncluded),
      requestedQuantity: initialQuantity,
      selectedUnitNumbers: Array.from({ length: initialQuantity }, (_, i) => i + 1)
    }));
    if (resolved.locationScope === 'RADIUS_KM' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setBooking((b) => ({ ...b, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
        () => { }
      );
    }
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.post('/services/bookings/enhanced', {
        serviceListingId: selected.id,
        farmId: booking.farmId ? Number(booking.farmId) : null,
        cropId: booking.cropId ? Number(booking.cropId) : null,
        location: booking.location,
        serviceDate: booking.serviceDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        hours: Math.max(1, Number(booking.hours) || 1),
        peopleCount: booking.peopleCount ? Number(booking.peopleCount) : null,
        requestedQuantity: Math.max(1, Number(booking.requestedQuantity || 1)),
        selectedUnitNumbers: Array.isArray(booking.selectedUnitNumbers) ? booking.selectedUnitNumbers.map(Number) : [],
        areaQuantity: booking.areaQuantity ? Number(booking.areaQuantity) : null,
        includeDriver: Boolean(booking.includeDriver),
        includePickup: Boolean(booking.includePickup),
        includeDrop: Boolean(booking.includeDrop),
        latitude: booking.latitude,
        longitude: booking.longitude,
        notes: booking.notes,
      });
      toast.success('Booking request sent to the provider');
      setSelected(null);
      await load();
      setTab('bookings');
    } catch (e2) {
      toast.error(e2?.response?.data?.message || 'Could not create booking');
    } finally {
      setSaving(false);
    }
  };

  const applyServiceCoupon = async (b) => {
    const code = String(serviceCoupons[b.id] || '').trim();
    if (!code) return toast.error('Enter a coupon code');
    setCouponApplying((x) => ({ ...x, [b.id]: true }));
    try {
      await apiClient.post(`/services/bookings/${b.id}/coupon`, null, { params: { code } });
      toast.success('Coupon applied to service booking');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Coupon could not be applied');
    } finally {
      setCouponApplying((x) => ({ ...x, [b.id]: false }));
    }
  };

  const payServiceOnline = async (b) => {
    try {
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }
      const order = await apiClient.post(`/services/bookings/${b.id}/payment/order`);
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.data.amount,
        currency: order.data.currency || 'INR',
        order_id: order.data.id,
        name: 'FarmEazy',
        description: `Service booking #${b.id}`,
        handler: async (response) => {
          await apiClient.post(`/services/bookings/${b.id}/payment`, null, {
            params: {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentMethod: 'RAZORPAY'
            }
          });
          toast.success('Service payment completed successfully!');
          await load();
        }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', () => toast.error('Service payment failed'));
      razorpay.open();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Unable to start service payment');
    }
  };

  const payCoins = async (b) => {
    const payable = Number(b.finalTotalAmount ?? b.totalAmount ?? 0);
    if (!Number.isInteger(payable)) {
      return toast.error('Coin-only payment requires a whole-rupee final amount. Use Razorpay or Direct Payment.');
    }
    try {
      await apiClient.post(`/services/bookings/${b.id}/payment/coins`, null, { params: { coins: payable } });
      toast.success(`Service paid with ${payable} coins. 10% coin-back was credited.`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Coin payment failed');
    }
  };

  const confirmDirect = async (b) => {
    const payable = Number(b.finalTotalAmount ?? b.totalAmount ?? 0);
    const ok = window.confirm(`Confirm that ₹${payable.toLocaleString('en-IN')} was paid directly to the service provider? This records an off-platform payment and does not create a gateway transaction.`);
    if (!ok) return;
    setSaving(true);
    try {
      await apiClient.post(`/services/bookings/${b.id}/payment/direct`, null, { params: { amount: payable, coins: 0 } });
      toast.success('Direct payment recorded successfully');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not record direct payment');
    } finally {
      setSaving(false);
    }
  };

  const providerAction = async (id, action) => {
    setSaving(true);
    try {
      if (action === 'approve') await apiClient.put(`/services/bookings/${id}/approve`);
      if (action === 'decline') await apiClient.put(`/services/bookings/${id}/decline`);
      if (action === 'complete') await apiClient.put(`/services/bookings/${id}/complete`);
      toast.success('Booking request updated successfully');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not update booking status');
    } finally {
      setSaving(false);
    }
  };

  const confirmCompletedByCustomer = async (b) => {
    const ok = window.confirm(`Confirm that the service for booking #${b.id} (${b.serviceTitle}) has been completed? This unlocks the provider's ability to edit the listing.`);
    if (!ok) return;
    setSaving(true);
    try {
      await apiClient.put(`/services/bookings/${b.id}/complete-by-customer`);
      toast.success('Service marked as completed. The provider can now edit this listing.');
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not confirm service completion');
    } finally {
      setSaving(false);
    }
  };

  const updatePrice = async (id) => {
    const draft = adjustments[id];
    if (!draft?.amount || !draft?.reason) return toast.error('Enter a final amount and reason');
    setSaving(true);
    try {
      await apiClient.put(`/services/bookings/${id}/final-price`, { finalAmount: Number(draft.amount), reason: draft.reason });
      toast.success('Final price adjusted');
      await load();
      setAdjustments((x) => ({ ...x, [id]: undefined }));
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not adjust price');
    } finally {
      setSaving(false);
    }
  };

  // Onboarding warning renderer
  const renderProviderOnboardingBanner = () => {
    return (
      <GlassPanel className="p-8 text-center max-w-2xl mx-auto space-y-5 my-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary text-3xl">
          🏪
        </div>
        <h3 className="text-xl font-bold">Become a FarmEazy Service Provider</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {eligibility.verificationMessage || 'Start offering tractor rentals, labour, and agricultural equipment to farmers in your region. Complete your vendor verification and setup your bank details to unlock this workspace.'}
        </p>
        <div className="pt-2">
          <Button 
            onClick={() => navigate(eligibility.verificationRedirectPath || '/vendor-onboarding')}
            className="px-6 py-2.5 font-semibold bg-gradient-to-r from-teal-500 to-primary hover:from-teal-600 hover:to-primary/95 text-white rounded-xl shadow-lg transition"
          >
            Start Vendor Verification
          </Button>
        </div>
      </GlassPanel>
    );
  };

  const getHeaderInfo = () => {
    switch (tab) {
      case 'post':
        return {
          title: 'Post Agricultural Service',
          description: 'List your machinery, operators, and manual labor services for hire.'
        };
      case 'posted':
        return {
          title: 'My Service Listings',
          description: 'Manage your active service listings, machine inventory, and unit pricing.'
        };
      case 'bookings':
        return {
          title: 'My Bookings',
          description: 'View and track your rented machinery and service requests.'
        };
      case 'requests':
        return {
          title: 'Service Requests Queue',
          description: 'Manage incoming service booking requests from customers.'
        };
      case 'history':
        return {
          title: 'Customer Service History',
          description: 'View completed or cancelled service bookings you made.'
        };
      case 'provider-history':
        return {
          title: 'Provider Service History',
          description: 'View completed or cancelled service requests you fulfilled.'
        };
      default:
        return {
          title: 'Services Marketplace',
          description: 'Rent tractors, excavation equipment, manual labour, and irrigation setups.'
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <AppPage noMotion title={headerInfo.title} description={headerInfo.description}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Floating Actions Panel */}
        <div className="flex justify-end -mt-4 mb-2">
          <Button variant="outline" onClick={load} title="Refresh marketplace and booking database lists" className="rounded-xl flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh Data
          </Button>
        </div>

        {loading ? (
          <GlassPanel className="p-6">
            <div className="flex items-center gap-3 text-muted-foreground justify-center">
              <RefreshCw className="animate-spin h-5 w-5" /> Loading marketplace listings and data...
            </div>
          </GlassPanel>
        ) : null}

        {/* TAB 1: DISCOVER SERVICES */}
        {!loading && tab === 'discover' && (
          <div className="space-y-5">
            <GlassPanel className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <SectionTitle 
                  eyebrow="Agricultural Marketplace" 
                  title="Find agricultural services near you" 
                  text="Radius-based listings are filtered server-side based on your registered address coordinates." 
                />
                <div className="flex gap-2 items-center">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  {filterType ? (
                    <div className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 rounded-xl px-3 py-1.5 text-sm font-semibold select-none animate-fadeIn">
                      <span>Category: {TYPES.find(([v]) => v === filterType)?.[1] || filterType}</span>
                      <button 
                        onClick={() => setFilterType('')} 
                        className="hover:text-rose-600 transition" 
                        title="Clear active category filter"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <select 
                      className="h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition cursor-pointer" 
                      value={filterType} 
                      onChange={(e) => setFilterType(e.target.value)}
                      title="Select agricultural machinery or labor category to filter"
                    >
                      <option value="">All Categories</option>
                      {TYPES.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </GlassPanel>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredListings.map((l) => (
                <div key={l.id} className="ops-panel p-6 space-y-4 border border-border/80 hover:border-primary/50 transition-all duration-300 hover:shadow-xl group relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/10 rounded-3xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] tracking-widest uppercase font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 px-2 py-0.5 rounded">
                        {l.type}
                      </span>
                      <h3 className="text-lg font-bold text-foreground mt-2 group-hover:text-primary transition-colors">{l.title}</h3>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${l.isActive === false ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'}`}>
                      {l.isActive === false ? 'Expired' : 'Available'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 min-h-[60px] leading-relaxed">{l.description || 'Agricultural equipment/machinery or labour services.'}</p>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm border-t border-b border-border/50 py-3 my-2">
                    <div className="flex gap-2 items-center text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="truncate">{l.location}</span>
                    </div>
                    <div className="flex gap-2 items-center text-muted-foreground">
                      <Clock3 className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground">{money(unitPrice(l))} <span className="text-xs font-normal text-muted-foreground">/{priceUnitLabel(l.priceUnit)}</span></span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap text-xs pt-1">
                    <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground">Driver: {l.hasDriver ? 'Yes' : 'No'}</span>
                    <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground">Units: {l.quantityTotal || 1} available</span>
                    <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground">Radius: {l.serviceRadiusKm || 50} km</span>
                  </div>
                  <Button 
                    className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-primary hover:from-teal-600 hover:to-primary/95 text-white font-semibold transition" 
                    onClick={() => openBooking(l)} 
                    disabled={l.isActive === false}
                  >
                    View details & book <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            {!filteredListings.length && (
              <GlassPanel className="p-8 text-center text-muted-foreground">
                No active services found matching the criteria in your region.
              </GlassPanel>
            )}
          </div>
        )}

        {/* TAB 2: POST SERVICE WIZARD */}
        {!loading && tab === 'post' && (
          <div className="space-y-6">
            {!eligibility?.eligible ? renderProviderOnboardingBanner() : (
              <>
                {!showPostingWizard ? (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Congratulations Banner */}
                    <GlassPanel className="p-6 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-primary/5 rounded-3xl relative overflow-hidden">
                      <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/15 rounded-full blur-2xl"></div>
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full uppercase tracking-wider">Verified Service Provider 🌟</span>
                          <h3 className="text-2xl font-bold text-foreground">Congratulations on your active provider portal!</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                            Your listed agricultural machinery and labor solutions are directly helping farmers nearby. Keep your listings updated to maintain maximum bookings.
                          </p>
                        </div>
                        <Button 
                          onClick={() => { setEditingId(null); setShowPostingWizard(true); }}
                          className="px-6 py-3 font-bold bg-gradient-to-r from-teal-500 to-primary hover:from-teal-600 hover:to-primary/95 text-white rounded-2xl shadow-lg shadow-teal-500/10 transition transform hover:-translate-y-0.5"
                          title="Add a new machinery or labor service listing"
                        >
                          ➕ Add New Service
                        </Button>
                      </div>
                    </GlassPanel>

                    {/* Stats Dashboard Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="ops-panel p-5 border border-border/80 rounded-2xl bg-card">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Total Listed Services</span>
                        <div className="text-3xl font-bold text-foreground mt-2">{providerListings.length}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Total physical services registered</p>
                      </div>

                      <div className="ops-panel p-5 border border-border/80 rounded-2xl bg-card">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Active Listings</span>
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                          {providerListings.filter(l => l.isActive !== false).length}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Currently visible on the marketplace</p>
                      </div>

                      <div className="ops-panel p-5 border border-border/80 rounded-2xl bg-card">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Pending Requests</span>
                        <div className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{activeRequests.length}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Requires provider review/approval</p>
                      </div>

                      <div className="ops-panel p-5 border border-border/80 rounded-2xl bg-card">
                        <span className="text-xs text-muted-foreground font-semibold uppercase">Fulfillments Done</span>
                        <div className="text-3xl font-bold text-primary mt-2">{historyRequests.length}</div>
                        <p className="text-[10px] text-muted-foreground mt-1">Completed booking requests</p>
                      </div>
                    </div>

                    {/* Listed Services List Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="font-bold text-base text-foreground">Your Listed Machinery & Labor</h4>
                        <button onClick={() => setTab('posted')} className="text-xs text-primary font-bold hover:underline">View Detailed Manager &rarr;</button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        {providerListings.map((l) => (
                          <div 
                            key={l.id} 
                            onClick={() => setTab('posted')} 
                            className="ops-panel p-4 border border-border/80 rounded-2xl bg-card/65 hover:border-primary/50 cursor-pointer transition flex items-start justify-between gap-3 group"
                            title="Click to view and edit this listing in My Listings manager"
                          >
                            <div className="space-y-1">
                              <span className="text-[9px] tracking-wider uppercase font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/20 dark:text-teal-400 px-2 py-0.5 rounded">
                                {l.type}
                              </span>
                              <h5 className="font-bold text-foreground group-hover:text-primary transition-colors text-sm">{l.title}</h5>
                              <p className="text-xs text-muted-foreground mt-1">{money(unitPrice(l))} / {priceUnitLabel(l.priceUnit)}</p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${l.isActive === false ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'}`}>
                              {l.isActive === false ? 'Expired' : 'Active'}
                            </span>
                          </div>
                        ))}
                        {!providerListings.length && (
                          <div className="sm:col-span-2 border border-dashed border-border/85 p-8 text-center rounded-2xl bg-muted/5 text-muted-foreground text-sm">
                            You haven't listed any services yet. Click "Add New Service" above to start!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 overflow-y-auto flex items-center justify-center animate-fadeIn" onClick={() => {
                    setShowPostingWizard(false);
                    setForm(emptyForm);
                    setCurrentStep(1);
                    setCurrentUnitSetupIdx(0);
                    setEditingId(null);
                  }}>
                    <div className="max-w-4xl w-full my-8 ops-panel bg-background border border-border/80 rounded-3xl p-6 shadow-2xl animate-scaleUp relative" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => {
                          setShowPostingWizard(false);
                          setForm(emptyForm);
                          setCurrentStep(1);
                          setCurrentUnitSetupIdx(0);
                          setEditingId(null);
                        }} 
                        className="absolute top-4 right-4 h-8 w-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition font-bold"
                        title="Cancel listing creation"
                      >
                        &times;
                      </button>
                      <div className="mt-6 max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
                        <div className="space-y-6">
                
                {/* Stepper Header */}
                <div className="ops-panel p-4 flex items-center justify-between border border-border/80 rounded-2xl bg-muted/20">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm">
                      {currentStep}
                    </span>
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{editingId ? `Editing Listing #${editingId}` : 'New Listing'} · Step {currentStep} of 6</span>
                      <h4 className="text-sm font-bold text-foreground">
                        {currentStep === 1 && 'Basic Information'}
                        {currentStep === 2 && 'Category Specifications'}
                        {currentStep === 3 && 'Pricing & Configurations'}
                        {currentStep === 4 && 'Availability Schedule'}
                        {currentStep === 5 && 'Coverage & Location'}
                        {currentStep === 6 && 'Review & Publish'}
                      </h4>
                    </div>
                  </div>
                  <div className="w-1/3 bg-muted rounded-full h-1.5 dark:bg-slate-800 hidden sm:block">
                    <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${(currentStep / 6) * 100}%` }}></div>
                  </div>
                </div>

                {/* Step 1: Category & Basic Info */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <GlassPanel className="p-6">
                      <SectionTitle eyebrow="Provider Workspace" title="Select service category" text="Each category changes the configuration and dynamic pricing formats." />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                        {TYPES.map(([v, n, Icon, desc]) => (
                          <button 
                            key={v} 
                            type="button" 
                            onClick={() => setField('type', v)} 
                            className={`ops-panel p-5 text-left border rounded-3xl transition duration-300 flex flex-col justify-between ${form.type === v ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-border hover:border-primary/50'}`}
                          >
                            <Icon className="h-6 w-6 text-primary" />
                            <div className="mt-4">
                              <div className="font-bold text-base text-foreground">{n}</div>
                              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </GlassPanel>

                    <StrongPanel className="p-6 space-y-5 rounded-3xl">
                      <div className="grid md:grid-cols-2 gap-5">
                        <Field label="Service Listing Title" hint="Provide a professional name for your service">
                          <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="e.g. Swaraj 744 XT with Rotavator" required />
                        </Field>
                        <Field label="Contact Person Name">
                          <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} required />
                        </Field>
                        <Field label="Contact Phone Number (10 digits)">
                          <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.contactPhone} onChange={(e) => setField('contactPhone', e.target.value)} maxLength="10" placeholder="9876543210" required />
                        </Field>
                        <Field label="Contact Email Address (optional)">
                          <input type="email" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.contactEmail} onChange={(e) => setField('contactEmail', e.target.value)} />
                        </Field>
                        <Field label="Service Hub Location Base" hint="The primary location where the machine/labour operates">
                          <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.location} onChange={(e) => setField('location', e.target.value)} placeholder="Village / town / district base" required />
                        </Field>
                        <div className="md:col-span-2">
                          <Field label="Description / Services Included">
                            <textarea className="w-full min-h-[100px] rounded-xl border border-input bg-background px-3 py-2.5 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Describe specifications, implements supported, labor skills, operator details, and terms..." />
                          </Field>
                        </div>
                      </div>
                    </StrongPanel>
                  </div>
                )}

                {/* Step 2: Category Specifications */}
                {currentStep === 2 && (
                  <StrongPanel className="p-6 space-y-6 rounded-3xl">
                    <SectionTitle eyebrow="Step 2" title="Category Details & Purposes" text={`Setup specifications for ${form.type.toLowerCase()} service.`} />
                    
                    <div className="grid md:grid-cols-2 gap-5 pt-3">
                      {form.type === 'TRACTOR' && (
                        <>
                          <Field label="Tractor Model Name">
                            <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.equipmentModel} onChange={(e) => setField('equipmentModel', e.target.value)} placeholder="e.g. John Deere 5050D" />
                          </Field>
                          <Field label="Horsepower (HP)" hint="Required for tractors">
                            <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.equipmentPower} onChange={(e) => setField('equipmentPower', e.target.value)} placeholder="e.g. 50 HP" required />
                          </Field>
                          <div className="md:col-span-2">
                            <Field label="Available Implements / Attachments" hint="Comma-separated items list">
                              <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.implementsAvailable} onChange={(e) => setField('implementsAvailable', e.target.value)} placeholder="e.g. rotavator, trolley, cultivator, plough" />
                            </Field>
                          </div>
                        </>
                      )}

                      {form.type === 'JCB' && (
                        <>
                          <Field label="Excavator Model Name">
                            <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.equipmentModel} onChange={(e) => setField('equipmentModel', e.target.value)} placeholder="e.g. JCB 3DX Backhoe" />
                          </Field>
                          <Field label="Bucket Capacity">
                            <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.customAttributes.bucketCapacity || ''} onChange={(e) => setField('customAttributes', { ...form.customAttributes, bucketCapacity: e.target.value })} placeholder="e.g. 1.0 cu.m." />
                          </Field>
                        </>
                      )}

                      {form.type === 'MANUAL' && (
                        <>
                          <div className="flex items-center gap-2 pt-4 md:col-span-2">
                            <input type="checkbox" id="toolsIncluded" checked={form.toolsIncluded} onChange={(e) => setField('toolsIncluded', e.target.checked)} className="h-4 w-4 rounded accent-teal-600 focus:ring-teal-500 cursor-pointer" />
                            <label htmlFor="toolsIncluded" className="text-sm font-semibold cursor-pointer">Sowing/harvesting tools included with labor</label>
                          </div>
                        </>
                      )}

                      {form.type === 'HARVESTER' && (
                        <>
                          <Field label="Harvester Model & Crop Type">
                            <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.equipmentModel} onChange={(e) => setField('equipmentModel', e.target.value)} placeholder="e.g. Claas Crop Tiger 40 (Paddy/Wheat)" />
                          </Field>
                          <Field label="Harvester Capacity">
                            <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.customAttributes.harvesterCapacity || ''} onChange={(e) => setField('customAttributes', { ...form.customAttributes, harvesterCapacity: e.target.value })} placeholder="e.g. 5 tons/hour" />
                          </Field>
                        </>
                      )}

                      {form.type === 'IRRIGATION' && (
                        <>
                          <Field label="Pump / Sprinkler Power">
                            <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.equipmentPower} onChange={(e) => setField('equipmentPower', e.target.value)} placeholder="e.g. 10 HP diesel pump" />
                          </Field>
                          <Field label="Pipe System Length (Feet)">
                            <input type="number" min="0" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.customAttributes.pipeLength || ''} onChange={(e) => setField('customAttributes', { ...form.customAttributes, pipeLength: e.target.value })} placeholder="e.g. 500" />
                          </Field>
                        </>
                      )}

                      <div className="md:col-span-2 space-y-3">
                        <span className="text-sm font-semibold block text-foreground">Specific Purposes Supported</span>
                        <div className="flex flex-wrap gap-2">
                          {(PURPOSES_BY_TYPE[form.type] || []).map((p) => {
                            const selected = form.servicePurposes.includes(p);
                            return (
                              <button 
                                type="button" 
                                key={p} 
                                onClick={() => setField('servicePurposes', selected ? form.servicePurposes.filter((x) => x !== p) : [...form.servicePurposes, p])}
                                className={`px-4 py-2 rounded-2xl border text-xs font-semibold transition ${selected ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/10' : 'bg-background hover:border-primary/50'}`}
                              >
                                {p}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </StrongPanel>
                )}

                {/* Step 3: Pricing & Unit Configurations */}
                {currentStep === 3 && (
                  <StrongPanel className="p-6 space-y-6 rounded-3xl">
                    <SectionTitle eyebrow="Step 3" title="Pricing Engine & Capacity" text="Configure server-authoritative rates and physical machine unit settings." />
                    
                    <div className="grid md:grid-cols-2 gap-5 pt-3">
                      {form.type !== 'MANUAL' && (
                        <Field label="Driver/Operator option">
                          <select className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={form.driverOption} onChange={(e) => setField('driverOption', e.target.value)}>
                            <option value="NOT_AVAILABLE">No driver / operator option</option>
                            <option value="AVAILABLE">Driver available as extra charge</option>
                            <option value="INCLUDED">Driver included in base machine price</option>
                          </select>
                        </Field>
                      )}

                      <Field label={form.type === 'MANUAL' ? 'Number of Units / No. of Labour' : 'Total quantity of physical units available'}>
                        <input 
                          type="number" 
                          min="1" 
                          className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" 
                          value={form.quantityTotal} 
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === '' || !Number.isFinite(Number(v)) || Number(v) < 1) {
                              setField('quantityTotal', '');
                              return;
                            }
                            resizeUnitConfigurations(v, form.sameUnitConfig);
                          }}
                          onBlur={() => {
                            if (form.quantityTotal === '' || Number(form.quantityTotal) < 1) {
                              resizeUnitConfigurations(1, form.sameUnitConfig);
                            }
                          }}
                        />
                      </Field>

                      {Number(form.quantityTotal || 1) > 1 && (
                        <div className="md:col-span-2 bg-muted/20 p-4 border border-border/80 rounded-2xl space-y-3">
                          <span className="text-sm font-semibold text-foreground block">Multi-unit pricing layout:</span>
                          <div className="flex gap-4 flex-wrap">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="sameUnitConfig" checked={form.sameUnitConfig} onChange={() => resizeUnitConfigurations(form.quantityTotal, true)} className="h-4 w-4 accent-teal-600 cursor-pointer" />
                              <span className="text-sm font-medium">Replicate same configuration and pricing for all units</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="radio" name="sameUnitConfig" checked={!form.sameUnitConfig} onChange={() => resizeUnitConfigurations(form.quantityTotal, false)} className="h-4 w-4 accent-teal-600 cursor-pointer" />
                              <span className="text-sm font-medium">Configure each unit individually</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Same config form */}
                      {(form.sameUnitConfig || Number(form.quantityTotal || 1) <= 1) ? (
                        <>
                          <Field label={form.type === 'MANUAL' ? 'Worker Rate' : 'Machine Base Rate'}>
                            <input 
                              type="number" 
                              min="0" 
                              step="0.01" 
                              className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" 
                              value={form.type === 'MANUAL' ? form.rate : form.machinePrice} 
                              onChange={(e) => setField(form.type === 'MANUAL' ? 'rate' : 'machinePrice', e.target.value)} 
                              placeholder="e.g. 800" 
                            />
                          </Field>

                          <Field label="Price Unit">
                            <select className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={form.priceUnit} onChange={(e) => setField('priceUnit', e.target.value)}>
                              <option value="PER_HOUR">Per hour</option>
                              <option value="PER_DAY">Per day</option>
                              <option value="PER_ACRE">Per acre</option>
                              <option value="PER_HECTARE">Per hectare</option>
                              <option value="FIXED">Fixed Price</option>
                            </select>
                          </Field>

                          {form.type !== 'MANUAL' && form.driverOption === 'AVAILABLE' && (
                            <Field label="Extra Driver Rate (per hour)">
                              <input type="number" min="0" step="0.01" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.driverPrice} onChange={(e) => setField('driverPrice', e.target.value)} placeholder="e.g. 200" />
                            </Field>
                          )}
                        </>
                      ) : (
                        // Individual unit setup wizard view (sub-stepper)
                        <div className="md:col-span-2 border border-primary/20 bg-primary/5 rounded-3xl p-5 space-y-4">
                          <div className="flex justify-between items-center border-b border-border/50 pb-3">
                            <div>
                              <h5 className="font-bold text-foreground">{form.type === 'MANUAL' ? `Configure Labour ${currentUnitSetupIdx + 1} of ${form.quantityTotal}` : `Configure Unit ${currentUnitSetupIdx + 1} of ${form.quantityTotal}`}</h5>
                              <p className="text-xs text-muted-foreground mt-0.5">Customize specifications and rates for this specific physical unit.</p>
                            </div>
                            <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded">{form.type === 'MANUAL' ? `LABOUR ${currentUnitSetupIdx + 1}` : `UNIT ${currentUnitSetupIdx + 1}`}</span>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            <Field label={form.type === 'MANUAL' ? 'Labour Group / Worker Ref' : 'Machine Model / Ref #'}>
                              <input className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.unitConfigurations[currentUnitSetupIdx]?.model || ''} onChange={(e) => updateUnit(currentUnitSetupIdx, 'model', e.target.value)} placeholder={form.type === 'MANUAL' ? 'e.g. Group A / Worker 1' : 'e.g. Tractor unit A'} />
                            </Field>
                            {form.type !== 'MANUAL' && (
                              <Field label="Power / HP">
                                <input className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.unitConfigurations[currentUnitSetupIdx]?.power || ''} onChange={(e) => updateUnit(currentUnitSetupIdx, 'power', e.target.value)} placeholder="e.g. 45 HP" />
                              </Field>
                            )}
                            <Field label={form.type === 'MANUAL' ? 'Worker Rate' : 'Machine Price'}>
                              <input type="number" min="0" step="0.01" className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.type === 'MANUAL' ? ((form.unitConfigurations[currentUnitSetupIdx]?.rate ?? '') || (form.unitConfigurations[currentUnitSetupIdx]?.machinePrice || '')) : (form.unitConfigurations[currentUnitSetupIdx]?.machinePrice || '')} onChange={(e) => { const v = e.target.value; updateUnit(currentUnitSetupIdx, form.type === 'MANUAL' ? 'rate' : 'machinePrice', v); if (form.type === 'MANUAL') updateUnit(currentUnitSetupIdx, 'machinePrice', v); }} placeholder="e.g. 900" />
                            </Field>
                            {form.type !== 'MANUAL' && (
                              <Field label="Implements Installed">
                                <input className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.unitConfigurations[currentUnitSetupIdx]?.implements || ''} onChange={(e) => updateUnit(currentUnitSetupIdx, 'implements', e.target.value)} placeholder="e.g. rotavator, trolley" />
                              </Field>
                            )}
                            
                            {form.type !== 'MANUAL' && form.driverOption !== 'NOT_AVAILABLE' && (
                              <>
                                <Field label="Driver Available for this unit">
                                  <select className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={form.unitConfigurations[currentUnitSetupIdx]?.driverAvailable ? 'yes' : 'no'} onChange={(e) => updateUnit(currentUnitSetupIdx, 'driverAvailable', e.target.value === 'yes')}>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                  </select>
                                </Field>
                                <Field label="Driver Rate (per hour)">
                                  <input type="number" min="0" step="0.01" className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.unitConfigurations[currentUnitSetupIdx]?.driverPrice || ''} onChange={(e) => updateUnit(currentUnitSetupIdx, 'driverPrice', e.target.value)} placeholder="e.g. 200" disabled={!form.unitConfigurations[currentUnitSetupIdx]?.driverAvailable} />
                                </Field>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {form.type !== 'MANUAL' && (
                        <>
                          <Field label="Minimum hours booking requirement">
                            <input type="number" min="1" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.minimumHours} onChange={(e) => setField('minimumHours', e.target.value)} />
                          </Field>
                          <Field label="Maximum hours booking limit">
                            <input type="number" min="1" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.maximumHours} onChange={(e) => setField('maximumHours', e.target.value)} />
                          </Field>
                        </>
                      )}
                    </div>
                  </StrongPanel>
                )}

                {/* Step 4: Availability Schedule */}
                {currentStep === 4 && (
                  <StrongPanel className="p-6 space-y-6 rounded-3xl">
                    <SectionTitle eyebrow="Step 4" title="Scheduling & Calendar" text="Select active days and timings for the service." />
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-3">
                      <Field label="Available From Date">
                        <input type="date" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={form.availableFrom} onChange={(e) => setField('availableFrom', e.target.value)} />
                      </Field>
                      <Field label="Available Until Date">
                        <input type="date" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={form.availableUntil} onChange={(e) => setField('availableUntil', e.target.value)} />
                      </Field>
                      <Field label="Operation Start Time">
                        <input type="time" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={form.availabilityStartTime} onChange={(e) => setField('availabilityStartTime', e.target.value)} />
                      </Field>
                      <Field label="Operation End Time">
                        <input type="time" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={form.availabilityEndTime} onChange={(e) => setField('availabilityEndTime', e.target.value)} />
                      </Field>

                      <div className="md:col-span-2">
                        <Field label="Available Days (comma-separated)" hint="e.g. MONDAY, TUESDAY, WEDNESDAY...">
                          <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.availableDaysOfWeek} onChange={(e) => setField('availableDaysOfWeek', e.target.value)} />
                        </Field>
                      </div>
                      <div className="md:col-span-2">
                        <Field label="Blackout Dates List (comma-separated)" hint="Format: YYYY-MM-DD, e.g. 2026-09-05, 2026-09-10">
                          <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.blackoutDates} onChange={(e) => setField('blackoutDates', e.target.value)} />
                        </Field>
                      </div>
                    </div>
                  </StrongPanel>
                )}

                {/* Step 5: Location Coverage */}
                {currentStep === 5 && (
                  <StrongPanel className="p-6 space-y-6 rounded-3xl animate-fadeIn">
                    <SectionTitle eyebrow="Step 5" title="Geographic Service Area" text="Select coverage filter boundaries and base coordinates." />

                    {/* Active Zones Quick-Selection Chips */}
                    {activeZones.length > 0 && (
                      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          Operations Active Zones (Admin Verified):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {activeZones.map((zone) => (
                            <button
                              key={zone.id}
                              type="button"
                              onClick={() => {
                                setField('locationScope', 'STATE');
                                setField('locationState', zone.state || '');
                                setField('locationCity', zone.city || '');
                                if (zone.latitude && zone.longitude) {
                                  setField('latitude', Number(zone.latitude));
                                  setField('longitude', Number(zone.longitude));
                                }
                                toast.success(`Selected active zone: ${zone.locationName}`);
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-500/20 transition flex items-center gap-1.5"
                            >
                              <MapPin className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>{zone.locationName}</span>
                              <span className="text-[10px] text-muted-foreground">({zone.city || zone.state})</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Real-time Verification Warning / Success Banner */}
                    {serviceZoneCheck && (
                      <div className="animate-fadeIn">
                        {serviceZoneCheck.allowed ? (
                          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>
                              ✓ Service coverage matches active operational zone: <strong>{serviceZoneCheck.matchedLocationName}</strong>
                            </span>
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-amber-500/50 bg-amber-500/15 p-4 space-y-2 text-xs">
                            <div className="flex items-start gap-2.5 text-amber-900 dark:text-amber-200 font-bold text-sm">
                              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                              <span>⚠️ Notice: Selected coverage is outside active operational zones</span>
                            </div>
                            <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed text-xs">
                              FarmEazy operational services are currently limited to admin-configured active zones. Customers outside these zones will be notified that services are not yet available in their area.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 pt-3">
                      <Field label="Coverage Type">
                        <select className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={form.locationScope} onChange={(e) => {
                          const val = e.target.value;
                          setField('locationScope', val);
                          if (val === 'RADIUS_KM') {
                            if (!form.latitude) setField('latitude', 20.5937);
                            if (!form.longitude) setField('longitude', 78.9629);
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
                          <select 
                            className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition cursor-pointer" 
                            value={form.locationState} 
                            onChange={(e) => {
                              const st = e.target.value;
                              setField('locationState', st);
                              setField('locationDistrict', '');
                              setField('locationCity', '');
                            }}
                            required
                          >
                            <option value="">-- Select State --</option>
                            {Object.keys(INDIAN_LOCATIONS).map((st) => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </Field>
                      )}

                      {['DISTRICT', 'CITY', 'RADIUS_KM'].includes(form.locationScope) && (
                        <Field label="District Name">
                          <select 
                            className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition cursor-pointer" 
                            value={form.locationDistrict} 
                            onChange={(e) => {
                              const dist = e.target.value;
                              setField('locationDistrict', dist);
                              setField('locationCity', '');
                            }}
                            disabled={!form.locationState}
                            required
                          >
                            <option value="">-- Select District --</option>
                            {(INDIAN_LOCATIONS[form.locationState]?.districts || []).map((dist) => (
                              <option key={dist} value={dist}>{dist}</option>
                            ))}
                          </select>
                        </Field>
                      )}

                      {['CITY', 'RADIUS_KM'].includes(form.locationScope) && (
                        <Field label="City / Locality">
                          {(() => {
                            const cities = INDIAN_LOCATIONS[form.locationState]?.cities?.[form.locationDistrict] || [];
                            if (cities.length > 0) {
                              return (
                                <select 
                                  className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition cursor-pointer" 
                                  value={form.locationCity} 
                                  onChange={(e) => setField('locationCity', e.target.value)}
                                  disabled={!form.locationDistrict}
                                  required
                                >
                                  <option value="">-- Select City/Village --</option>
                                  {cities.map((city) => (
                                    <option key={city} value={city}>{city}</option>
                                  ))}
                                </select>
                              );
                            }
                            return (
                              <input 
                                className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition text-sm" 
                                value={form.locationCity} 
                                onChange={(e) => setField('locationCity', e.target.value)} 
                                placeholder="Enter City/Village name" 
                                disabled={!form.locationDistrict}
                                required 
                              />
                            );
                          })()}
                        </Field>
                      )}

                      {form.locationScope === 'PINCODE' && (
                        <Field label="Pincode Scope">
                          <input className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.locationPincode} onChange={(e) => setField('locationPincode', e.target.value)} placeholder="e.g. 515401" required />
                        </Field>
                      )}

                      {form.locationScope === 'RADIUS_KM' && (
                        <>
                          <Field label="Service Radius (km)">
                            <input type="number" min="1" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.serviceRadiusKm} onChange={(e) => setField('serviceRadiusKm', e.target.value)} required />
                          </Field>
                          <Field label="Latitude Coordinate">
                            <input type="number" step="any" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.latitude || ''} onChange={(e) => setField('latitude', e.target.value)} placeholder="e.g. 14.68" required />
                          </Field>
                          <Field label="Longitude Coordinate">
                            <input type="number" step="any" className="w-full h-11 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={form.longitude || ''} onChange={(e) => setField('longitude', e.target.value)} placeholder="e.g. 77.60" required />
                          </Field>
                          <div className="flex items-end pb-1 lg:col-span-2">
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
                          <div className="md:col-span-2 lg:col-span-4 space-y-2 pt-2">
                            <span className="text-sm font-semibold text-foreground block">Select Location Base on Map</span>
                            <p className="text-xs text-muted-foreground">Drag the marker to position your base coordinates. A radius circle will overlay your coverage boundary.</p>
                            <div id="posting-map" className="h-72 w-full rounded-2xl border border-border bg-muted/20 relative z-10 overflow-hidden shadow-inner"></div>
                          </div>
                        </>
                      )}
                    </div>
                  </StrongPanel>
                )}

                {/* Step 6: Attachments & Review */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    {/* Media Upload Zone */}
                    <StrongPanel className="p-6 space-y-4 rounded-3xl">
                      <SectionTitle eyebrow="Media & Attachments" title="Upload photos and videos" text="Upload up to 10 files (max 5MB each). Supporting JPEG, PNG, MP4, WebM. Videos must use a browser-compatible codec (H.264/AAC or VP8/VP9) — incompatible videos are rejected immediately." />
                      
                      <div className="border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-2xl p-6 text-center bg-muted/10 cursor-pointer relative">
                        <input type="file" accept="image/*,video/*" multiple onChange={handleAttachmentSelect} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <div className="space-y-2">
                          <span className="text-3xl block">📁</span>
                          <span className="text-sm font-bold block">Drag and drop files here, or click to browse</span>
                          <span className="text-xs text-muted-foreground">Supports images and videos under 5MB</span>
                        </div>
                      </div>

                      {attachmentFiles.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-3">
                          {attachmentFiles.map((file, idx) => {
                            const isImg = file.type.startsWith('image/');
                            return (
                              <div key={idx} className="relative group border border-border/50 rounded-xl overflow-hidden aspect-square bg-muted/40 flex items-center justify-center p-1">
                                {isImg ? (
                                  <img src={URL.createObjectURL(file)} alt="preview" className="object-cover h-full w-full rounded-lg" />
                                ) : (
                                  <span className="text-3xl">🎥</span>
                                )}
                                <button type="button" onClick={() => removeSelectedFile(idx)} className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center transition-opacity hover:bg-rose-600 opacity-100" title="Remove this file">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                                <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded truncate max-w-[90%]">
                                  {file.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {Array.isArray(form.attachmentUrls) && form.attachmentUrls.length > 0 && (
                        <div className="pt-2">
                          <div className="text-xs text-muted-foreground mb-2">Existing attachments ({form.attachmentUrls.length} of 10) — tap ✕ to remove anything added by mistake:</div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {form.attachmentUrls.map((url, idx) => {
                              const isVideo = url.match(/\.(mp4|webm|mov|m4v)$/i);
                              return (
                                <div key={idx} className="relative border border-border/50 rounded-xl overflow-hidden aspect-square bg-muted/40 flex items-center justify-center">
                                  {isVideo ? (
                                    <span className="text-3xl">🎥</span>
                                  ) : (
                                    <img src={url} alt={`attachment ${idx + 1}`} className="object-cover h-full w-full" />
                                  )}
                                  <button type="button" onClick={() => removeExistingServiceAttachment(url)} className="absolute top-1 right-1 h-7 w-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-600 transition-colors" title="Remove existing attachment">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </StrongPanel>

                    {/* Review Details summary */}
                    <StrongPanel className="p-6 space-y-5 rounded-3xl">
                      <h4 className="font-bold text-lg text-foreground border-b pb-2 flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" /> Listing Configuration Summary
                      </h4>
                      <dl className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm leading-relaxed">
                        <div>
                          <dt className="text-muted-foreground font-medium">Category</dt>
                          <dd className="font-bold text-foreground mt-0.5">{form.type}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Service Title</dt>
                          <dd className="font-bold text-foreground mt-0.5">{form.title}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Location Base</dt>
                          <dd className="font-bold text-foreground mt-0.5">{form.location}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Pricing Plan</dt>
                          <dd className="font-bold text-foreground mt-0.5">
                            {form.type === 'MANUAL' ? `${money(form.rate)}/${form.priceUnit}` : `${money(form.machinePrice)}/${form.priceUnit}`}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Operator Details</dt>
                          <dd className="font-bold text-foreground mt-0.5">{form.driverOption}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground font-medium">Available Units</dt>
                          <dd className="font-bold text-foreground mt-0.5">{form.quantityTotal} unit(s)</dd>
                        </div>
                      </dl>
                    </StrongPanel>
                  </div>
                )}

                {/* Navigation Controls */}
                <div className="flex justify-between items-center pt-4">
                  <Button variant="outline" size="lg" onClick={prevStep} disabled={currentStep === 1} className="rounded-xl flex items-center gap-1">
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  
                  {currentStep < 6 ? (
                    <Button size="lg" onClick={nextStep} className="rounded-xl flex items-center gap-1 bg-gradient-to-r from-teal-500 to-primary text-white font-semibold">
                      Continue <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button size="lg" onClick={createListing} disabled={saving} className="rounded-xl flex items-center gap-1 bg-gradient-to-r from-teal-500 to-primary text-white font-semibold">
                      {saving ? (editingId ? 'Updating...' : 'Publishing...') : (editingId ? 'Update Service Listing' : 'Publish Service Listing')}
                    </Button>
                  )}
                </div>

                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

        {/* TAB 3: MY POSTED SERVICES */}
        {!loading && tab === 'posted' && (
          <div className="space-y-5">
            {!eligibility?.eligible ? renderProviderOnboardingBanner() : (
              <div className="space-y-5">
                {providerListings.map((l) => {
                  const isExpanded = selected === l.id;
                  const units = l.unitConfigurations || [];
                  const purposes = l.servicePurposes || [];
                  const attachments = l.attachmentUrls || [];
                  const impls = l.implementsAvailable || [];
                  const priceLabel = String(l.priceUnit || 'HOUR').toLowerCase().replace('per_', '');
                  const isManual = l.type === 'MANUAL';

                  return (
                    <div key={l.id} className="ops-panel border border-border/80 rounded-3xl bg-gradient-to-br from-background via-background to-muted/10 hover:shadow-lg transition-all duration-300 overflow-hidden">
                      {/* Header Row (always visible) */}
                      <div 
                        className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                        onClick={() => setSelected(isExpanded ? null : l.id)}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/30 dark:text-teal-400 px-2 py-0.5 rounded uppercase tracking-wider">{l.type}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${l.isActive === false ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'}`}>
                              {l.isActive === false ? 'Inactive' : 'Active'}
                            </span>
                            {l.driverOption === 'INCLUDED' && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 px-2 py-0.5 rounded">Operator Included</span>}
                            {l.driverOption === 'AVAILABLE' && <span className="text-[10px] font-bold text-violet-600 bg-violet-50 dark:bg-violet-950/20 dark:text-violet-400 px-2 py-0.5 rounded">Operator Optional</span>}
                          </div>
                          <h3 className="text-lg font-bold text-foreground">{l.title}</h3>
                          <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                            <span>📍 {l.location}</span>
                            <span>💰 {money(unitPrice(l))} / {priceLabel}</span>
                            <span>🚜 {l.quantityTotal || 1} unit(s)</span>
                            {l.contactName && <span>👤 {l.contactName}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {l.editAllowed ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={(e) => { e.stopPropagation(); startEdit(l); }} 
                              className="rounded-xl border-primary/50 text-primary hover:bg-primary/5 flex items-center gap-1.5"
                              title="A customer confirmed this service as completed, so you can now edit it"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                          ) : (
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/60 px-2 py-1 rounded-lg flex items-center gap-1" title="Editing unlocks after a customer confirms a completed service on this listing">
                              <Lock className="h-3 w-3" /> Edit locked
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{isExpanded ? 'Hide details' : 'View all details'}</span>
                          <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                      </div>

                      {/* Expanded Detail Panel */}
                      {isExpanded && (
                        <div className="border-t border-border/60 p-5 space-y-5 bg-muted/5 animate-fadeIn">
                          
                          {/* Description */}
                          {l.description && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Description</span>
                              <p className="text-sm text-foreground leading-relaxed">{l.description}</p>
                            </div>
                          )}

                          {/* Per-unit detail viewer with dropdown for multi-unit listings */}
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Unit-wise Details</span>
                            <UnitDetailsPanel 
                              listing={l} 
                              selectedUnit={postedUnitIdx[l.id] ?? 0} 
                              onSelectUnit={(idx) => setPostedUnitIdx((x) => ({ ...x, [l.id]: idx }))} 
                            />
                          </div>

                          {/* Core Pricing & Equipment Grid */}
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Pricing & Equipment</span>
                            <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                              {isManual ? (
                                <>
                                  <div className="bg-background p-3 rounded-xl border border-border/50">
                                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Worker Rate</dt>
                                    <dd className="font-bold text-foreground mt-0.5">{money(l.rate)} / {priceLabel}</dd>
                                  </div>
                                  <div className="bg-background p-3 rounded-xl border border-border/50">
                                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Workers Count</dt>
                                    <dd className="font-bold text-foreground mt-0.5">{l.workersCount || '—'}</dd>
                                  </div>
                                  <div className="bg-background p-3 rounded-xl border border-border/50">
                                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Experience</dt>
                                    <dd className="font-bold text-foreground mt-0.5">{l.experienceYears ? `${l.experienceYears} years` : '—'}</dd>
                                  </div>
                                  <div className="bg-background p-3 rounded-xl border border-border/50">
                                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Tools Included</dt>
                                    <dd className="font-bold text-foreground mt-0.5">{l.toolsIncluded ? '✅ Yes' : '❌ No'}</dd>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="bg-background p-3 rounded-xl border border-border/50">
                                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Machine Price</dt>
                                    <dd className="font-bold text-foreground mt-0.5">{money(l.machinePrice)} / {priceLabel}</dd>
                                  </div>
                                  {l.driverOption === 'AVAILABLE' && (
                                    <div className="bg-background p-3 rounded-xl border border-border/50">
                                      <dt className="text-[10px] text-muted-foreground uppercase font-bold">Extra Driver Rate</dt>
                                      <dd className="font-bold text-foreground mt-0.5">{money(l.driverPrice)} /hr</dd>
                                    </div>
                                  )}
                                  <div className="bg-background p-3 rounded-xl border border-border/50">
                                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Driver/Operator</dt>
                                    <dd className="font-bold text-foreground mt-0.5">{l.driverOption === 'INCLUDED' ? 'Included' : l.driverOption === 'AVAILABLE' ? 'Available (extra)' : 'Not available'}</dd>
                                  </div>
                                  <div className="bg-background p-3 rounded-xl border border-border/50">
                                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Total Units</dt>
                                    <dd className="font-bold text-foreground mt-0.5">{l.quantityTotal || 1} physical unit(s)</dd>
                                  </div>
                                  {l.equipmentModel && (
                                    <div className="bg-background p-3 rounded-xl border border-border/50">
                                      <dt className="text-[10px] text-muted-foreground uppercase font-bold">Equipment Model</dt>
                                      <dd className="font-bold text-foreground mt-0.5">{l.equipmentModel}</dd>
                                    </div>
                                  )}
                                  {l.equipmentPower && (
                                    <div className="bg-background p-3 rounded-xl border border-border/50">
                                      <dt className="text-[10px] text-muted-foreground uppercase font-bold">Power (HP)</dt>
                                      <dd className="font-bold text-foreground mt-0.5">{l.equipmentPower}</dd>
                                    </div>
                                  )}
                                  <div className="bg-background p-3 rounded-xl border border-border/50">
                                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Min Booking Hours</dt>
                                    <dd className="font-bold text-foreground mt-0.5">{l.minimumHours || 1} hrs</dd>
                                  </div>
                                  <div className="bg-background p-3 rounded-xl border border-border/50">
                                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Max Booking Hours</dt>
                                    <dd className="font-bold text-foreground mt-0.5">{l.maximumHours || '—'} hrs</dd>
                                  </div>
                                </>
                              )}
                            </dl>
                          </div>

                          {/* Implements Available */}
                          {impls.length > 0 && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Implements / Attachments</span>
                              <div className="flex flex-wrap gap-2">
                                {impls.map((imp, idx) => (
                                  <span key={idx} className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/20">{imp}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Service Purposes */}
                          {purposes.length > 0 && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Service Purposes</span>
                              <div className="flex flex-wrap gap-2">
                                {purposes.map((p, idx) => (
                                  <span key={idx} className="bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 text-xs font-semibold px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800/30">{p}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Multi-Unit Configuration Table */}
                          {units.length > 0 && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Unit Configurations ({units.length} unit{units.length > 1 ? 's' : ''})</span>
                              <div className="overflow-x-auto rounded-xl border border-border/60">
                                <table className="w-full text-sm">
                                  <thead className="bg-muted/40">
                                    <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wider">
                                      <th className="p-2.5 font-bold">Unit #</th>
                                      <th className="p-2.5 font-bold">Model</th>
                                      <th className="p-2.5 font-bold">Power</th>
                                      <th className="p-2.5 font-bold">Price</th>
                                      <th className="p-2.5 font-bold">Implements</th>
                                      <th className="p-2.5 font-bold">Driver</th>
                                      <th className="p-2.5 font-bold">Driver Rate</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/40">
                                    {units.map((u, idx) => (
                                      <tr key={idx} className="hover:bg-muted/20 transition">
                                        <td className="p-2.5 font-bold text-primary">{u.unitNumber || idx + 1}</td>
                                        <td className="p-2.5 text-foreground">{u.model || '—'}</td>
                                        <td className="p-2.5 text-foreground">{u.power || '—'}</td>
                                        <td className="p-2.5 font-semibold text-foreground">{money(u.machinePrice)}</td>
                                        <td className="p-2.5 text-foreground">{u.implements || '—'}</td>
                                        <td className="p-2.5 text-foreground">{u.driverAvailable ? '✅ Yes' : '❌ No'}</td>
                                        <td className="p-2.5 text-foreground">{u.driverAvailable ? money(u.driverPrice) + '/hr' : '—'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Scheduling & Availability */}
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Schedule & Availability</span>
                            <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                              <div className="bg-background p-3 rounded-xl border border-border/50">
                                <dt className="text-[10px] text-muted-foreground uppercase font-bold">Available From</dt>
                                <dd className="font-bold text-foreground mt-0.5">{l.availableFrom || 'Open'}</dd>
                              </div>
                              <div className="bg-background p-3 rounded-xl border border-border/50">
                                <dt className="text-[10px] text-muted-foreground uppercase font-bold">Available Until</dt>
                                <dd className="font-bold text-foreground mt-0.5">{l.availableUntil || 'Open'}</dd>
                              </div>
                              <div className="bg-background p-3 rounded-xl border border-border/50">
                                <dt className="text-[10px] text-muted-foreground uppercase font-bold">Operating Hours</dt>
                                <dd className="font-bold text-foreground mt-0.5">{l.availabilityStartTime || '—'} to {l.availabilityEndTime || '—'}</dd>
                              </div>
                              <div className="bg-background p-3 rounded-xl border border-border/50">
                                <dt className="text-[10px] text-muted-foreground uppercase font-bold">Available Days</dt>
                                <dd className="font-bold text-foreground mt-0.5 text-[11px]">{l.availableDaysOfWeek || 'All days'}</dd>
                              </div>
                              {l.blackoutDates && (
                                <div className="bg-background p-3 rounded-xl border border-border/50 col-span-2">
                                  <dt className="text-[10px] text-muted-foreground uppercase font-bold">Blackout Dates</dt>
                                  <dd className="font-bold text-foreground mt-0.5 text-[11px]">{l.blackoutDates}</dd>
                                </div>
                              )}
                            </dl>
                          </div>

                          {/* Location Coverage */}
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Location Coverage</span>
                            <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                              <div className="bg-background p-3 rounded-xl border border-border/50">
                                <dt className="text-[10px] text-muted-foreground uppercase font-bold">Coverage Scope</dt>
                                <dd className="font-bold text-foreground mt-0.5">{l.locationScope || 'INDIA'}</dd>
                              </div>
                              {l.locationState && (
                                <div className="bg-background p-3 rounded-xl border border-border/50">
                                  <dt className="text-[10px] text-muted-foreground uppercase font-bold">State</dt>
                                  <dd className="font-bold text-foreground mt-0.5">{l.locationState}</dd>
                                </div>
                              )}
                              {l.locationDistrict && (
                                <div className="bg-background p-3 rounded-xl border border-border/50">
                                  <dt className="text-[10px] text-muted-foreground uppercase font-bold">District</dt>
                                  <dd className="font-bold text-foreground mt-0.5">{l.locationDistrict}</dd>
                                </div>
                              )}
                              {l.locationCity && (
                                <div className="bg-background p-3 rounded-xl border border-border/50">
                                  <dt className="text-[10px] text-muted-foreground uppercase font-bold">City / Village</dt>
                                  <dd className="font-bold text-foreground mt-0.5">{l.locationCity}</dd>
                                </div>
                              )}
                              {l.locationPincode && (
                                <div className="bg-background p-3 rounded-xl border border-border/50">
                                  <dt className="text-[10px] text-muted-foreground uppercase font-bold">Pincode</dt>
                                  <dd className="font-bold text-foreground mt-0.5">{l.locationPincode}</dd>
                                </div>
                              )}
                              {l.locationScope === 'RADIUS_KM' && (
                                <>
                                  <div className="bg-background p-3 rounded-xl border border-border/50">
                                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Service Radius</dt>
                                    <dd className="font-bold text-foreground mt-0.5">{l.serviceRadiusKm || '—'} km</dd>
                                  </div>
                                  <div className="bg-background p-3 rounded-xl border border-border/50">
                                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Base Coordinates</dt>
                                    <dd className="font-bold text-foreground mt-0.5 text-[11px]">{l.latitude?.toFixed(4)}, {l.longitude?.toFixed(4)}</dd>
                                  </div>
                                </>
                              )}
                            </dl>
                          </div>

                          {/* Transport Options */}
                          {l.pickupDropAvailable && (
                            <div>
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Transport Options</span>
                              <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                <div className="bg-background p-3 rounded-xl border border-border/50">
                                  <dt className="text-[10px] text-muted-foreground uppercase font-bold">Pickup Charge</dt>
                                  <dd className="font-bold text-foreground mt-0.5">{money(l.pickupCharge)}</dd>
                                </div>
                                <div className="bg-background p-3 rounded-xl border border-border/50">
                                  <dt className="text-[10px] text-muted-foreground uppercase font-bold">Drop Charge</dt>
                                  <dd className="font-bold text-foreground mt-0.5">{money(l.dropCharge)}</dd>
                                </div>
                                <div className="bg-background p-3 rounded-xl border border-border/50">
                                  <dt className="text-[10px] text-muted-foreground uppercase font-bold">Transport per KM</dt>
                                  <dd className="font-bold text-foreground mt-0.5">{money(l.transportPerKm)}</dd>
                                </div>
                              </dl>
                            </div>
                          )}

                          {/* Contact Details */}
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Contact Details</span>
                            <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                              <div className="bg-background p-3 rounded-xl border border-border/50">
                                <dt className="text-[10px] text-muted-foreground uppercase font-bold">Contact Person</dt>
                                <dd className="font-bold text-foreground mt-0.5">{l.contactName || '—'}</dd>
                              </div>
                              <div className="bg-background p-3 rounded-xl border border-border/50">
                                <dt className="text-[10px] text-muted-foreground uppercase font-bold">Phone</dt>
                                <dd className="font-bold text-foreground mt-0.5">{l.contactPhone || '—'}</dd>
                              </div>
                              {l.contactEmail && (
                                <div className="bg-background p-3 rounded-xl border border-border/50">
                                  <dt className="text-[10px] text-muted-foreground uppercase font-bold">Email</dt>
                                  <dd className="font-bold text-foreground mt-0.5">{l.contactEmail}</dd>
                                </div>
                              )}
                            </dl>
                          </div>

                          {/* Attachment Media Gallery */}
                          <div>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Attachments {attachments.length > 0 ? `(${attachments.length})` : ''}</span>
                            {attachments.length === 0 ? (
                              <div className="flex items-center justify-center gap-2 border border-dashed border-border/70 rounded-xl p-5 text-muted-foreground text-sm">
                                <span className="text-2xl">📷</span> No image or video attached to this service
                              </div>
                            ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                {attachments.map((url, idx) => {
                                  const isVideo = url.match(/\.(mp4|webm|mov)$/i);
                                  return (
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-xl overflow-hidden border border-border/50 bg-muted/20 hover:ring-2 hover:ring-primary transition group">
                                      {isVideo ? (
                                        <div className="flex items-center justify-center h-full text-2xl bg-muted/30">🎥</div>
                                      ) : (
                                        <img src={url} alt={`Attachment ${idx + 1}`} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                                      )}
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          {/* Metadata Footer */}
                          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] text-muted-foreground pt-2 border-t border-border/40">
                            <span>Listing ID: #{l.id}</span>
                            {l.createdAt && <span>Created: {new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                            {l.updatedAt && <span>Updated: {new Date(l.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!providerListings.length && (
                  <GlassPanel className="p-8 text-center text-muted-foreground">
                    You have not posted any service listings yet. Go to <button onClick={() => setTab('post')} className="text-primary font-bold hover:underline">Post Service</button> to create your first listing.
                  </GlassPanel>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MY BOOKINGS (Buyer view - active requests) */}
        {!loading && tab === 'bookings' && (
          <div className="space-y-4">
            {activeBookings.map((b) => (
              <div key={b.id} className="ops-panel p-6 border border-border/80 rounded-2xl hover:shadow-lg transition bg-gradient-to-r from-background to-muted/5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded">BOOKING #{b.id}</span>
                      <span className="text-xs text-teal-500 font-bold uppercase">{b.serviceType}</span>
                    </div>
                    <h3 className="font-bold text-lg text-foreground">{b.serviceTitle}</h3>
                    <div className="text-sm text-muted-foreground mt-2 flex flex-wrap gap-4 leading-none">
                      <span className="flex items-center gap-1"><CalendarDays className="h-4 w-4 text-primary" /> {b.serviceDate}</span>
                      <span className="flex items-center gap-1"><Clock3 className="h-4 w-4 text-primary" /> {b.startTime} - {b.endTime} ({b.hours} hrs)</span>
                      <span>Farm: {b.farmName || 'Not associated'}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-lg font-bold text-foreground">{money(b.finalTotalAmount ?? b.totalAmount)}</div>
                    <div className={`text-sm ${statusTone(b.status)}`}>{b.status}</div>
                    
                    {['APPROVED', 'CONFIRMED', 'IN_PROGRESS'].includes(String(b.status || '').toUpperCase()) && (
                      <div className="mt-3">
                        <Button size="sm" onClick={() => confirmCompletedByCustomer(b)} disabled={saving} className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" /> Mark as completed
                        </Button>
                        <p className="text-[10px] text-muted-foreground mt-1">Confirm the service was done. This unlocks provider editing on the listing.</p>
                      </div>
                    )}
                    
                    {b.paymentAllowed && b.paymentStatus !== 'SUCCESS' && (
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <Button size="sm" onClick={() => payCoins(b)} className="rounded-xl flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold">
                          <Coins className="h-4 w-4" /> Pay with Coins
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => confirmDirect(b)} className="rounded-xl border-primary/50 text-primary hover:bg-primary/5">
                          Paid Directly
                        </Button>
                        <Button size="sm" onClick={() => payServiceOnline(b)} className="rounded-xl bg-gradient-to-r from-teal-500 to-primary text-white font-semibold">
                          Pay Online
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!activeBookings.length && (
              <GlassPanel className="p-8 text-center text-muted-foreground">
                You do not have any active service bookings.
              </GlassPanel>
            )}
          </div>
        )}

        {/* TAB 5: SERVICE REQUESTS (Provider view - active queues) */}
        {!loading && tab === 'requests' && (
          <div className="space-y-4">
            {!eligibility?.eligible ? renderProviderOnboardingBanner() : (
              <div className="space-y-4">
                {activeRequests.map((b) => (
                  <div key={b.id} className="ops-panel p-6 border border-border/80 rounded-2xl hover:shadow-lg transition bg-gradient-to-r from-background to-muted/5">
                    <div className="flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded">REQUEST #{b.id}</span>
                          <span className="text-xs text-teal-500 font-bold uppercase">{b.serviceType}</span>
                        </div>
                        <h3 className="font-bold text-lg mt-1 text-foreground">{b.serviceTitle}</h3>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          Customer: <span className="font-semibold text-foreground">{b.userName || 'Buyer'}</span> · Date: {b.serviceDate} · Time: {b.startTime} - {b.endTime} · Amount: {money(b.finalTotalAmount ?? b.totalAmount)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 items-center">
                        <span className={`text-sm ${statusTone(b.status)} mr-3`}>{b.status}</span>
                        {b.status === 'PENDING' && (
                          <>
                            <Button size="sm" onClick={() => providerAction(b.id, 'approve')} disabled={saving} className="rounded-xl bg-gradient-to-r from-teal-500 to-primary text-white font-semibold">Accept</Button>
                            <Button size="sm" variant="outline" onClick={() => providerAction(b.id, 'decline')} disabled={saving} className="rounded-xl hover:bg-rose-50 hover:text-rose-600 transition">Decline</Button>
                          </>
                        )}
                        {['APPROVED', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status) && (
                          <Button size="sm" onClick={() => providerAction(b.id, 'complete')} disabled={saving} className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Complete job
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Price adjustment pane for completed but unpaid jobs */}
                    {b.status === 'COMPLETED' && b.paymentStatus !== 'SUCCESS' && (b.priceAdjustmentCount || 0) < 3 && (
                      <div className="mt-4 pt-4 border-t border-border/50 grid md:grid-cols-[180px_1fr_auto] gap-3 bg-muted/10 p-4 rounded-xl items-center">
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">Adjust final amount</label>
                          <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="Final amount" 
                            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" 
                            value={adjustments[b.id]?.amount || ''} 
                            onChange={(e) => setAdjustments((x) => ({ ...x, [b.id]: { ...(x[b.id] || {}), amount: e.target.value } }))} 
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted-foreground block mb-1">Reason for adjustment</label>
                          <input 
                            placeholder="Provide adjustment reason (extra hours, etc.)" 
                            className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" 
                            value={adjustments[b.id]?.reason || ''} 
                            onChange={(e) => setAdjustments((x) => ({ ...x, [b.id]: { ...(x[b.id] || {}), reason: e.target.value } }))} 
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => updatePrice(b.id)} 
                          disabled={saving}
                          className="h-10 rounded-xl mt-4 sm:mt-0 font-semibold border-primary/50 text-primary hover:bg-primary/5 transition"
                        >
                          Update price ({b.priceAdjustmentCount || 0}/3)
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {!activeRequests.length && (
                  <GlassPanel className="p-8 text-center text-muted-foreground">
                    No active incoming service requests in queue.
                  </GlassPanel>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SERVICE HISTORY (Buyer view - completed/cancelled) */}
        {!loading && tab === 'history' && (
          <div className="space-y-4">
            <GlassPanel className="p-5">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <Field label="Filter Status">
                  <select 
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm w-full focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    {['PENDING', 'APPROVED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'DECLINED', 'CANCELLED', 'EXPIRED'].map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label="Filter Farm">
                  <select 
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm w-full focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" 
                    value={historyFarmId} 
                    onChange={(e) => { setHistoryFarmId(e.target.value); setHistoryCropId(''); }}
                  >
                    <option value="">All farms</option>
                    {selectedFarms.map((f) => <option key={f.id} value={f.id}>{f.farmName || f.name}</option>)}
                  </select>
                </Field>
                <Field label="Filter Crop">
                  <select 
                    className="h-10 rounded-xl border border-input bg-background px-3 text-sm w-full focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" 
                    value={historyCropId} 
                    onChange={(e) => setHistoryCropId(e.target.value)}
                  >
                    <option value="">All crops</option>
                    {(historyFarmId ? visibleCrops.filter((c) => String(c.farmId ?? c.farm?.id ?? '') === String(historyFarmId)) : crops).map((c) => <option key={c.id} value={c.id}>{c.cropName || c.name}</option>)}
                  </select>
                </Field>
                <div className="text-sm text-muted-foreground lg:text-right border-l pl-4 border-border/80">
                  <div>Found {filteredHistory.length} completed booking(s)</div>
                  <div className="font-bold text-foreground text-lg mt-1">{money(historyTotal)} total spent</div>
                </div>
              </div>
            </GlassPanel>

            {filteredHistory.map((b) => (
              <div key={b.id} className="ops-panel p-5 border border-border/80 rounded-2xl hover:shadow-lg transition bg-gradient-to-r from-background to-muted/5">
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground font-semibold">BOOKING #{b.id} · {b.serviceType}</div>
                    <h3 className="font-bold text-lg text-foreground">{b.serviceTitle}</h3>
                    <div className="text-sm text-muted-foreground mt-2 flex flex-wrap gap-4">
                      <span>📅 {b.serviceDate}</span>
                      <span>🏡 Farm: {b.farmName || '—'}</span>
                      <span>🌱 Crop: {b.cropName || '—'}</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1 min-w-[150px]">
                    <div className="font-bold text-lg text-foreground">{money(b.finalTotalAmount ?? b.totalAmount)}</div>
                    <div className={`text-sm ${statusTone(b.status)}`}>{b.status}</div>
                    <div className="text-xs text-muted-foreground">Payment: <span className="font-bold text-foreground">{b.paymentStatus}</span></div>
                    
                    {/* Coupon Apply Component */}
                    {b.status === 'COMPLETED' && b.paymentStatus !== 'SUCCESS' && !b.couponCode && (
                      <div className="mt-2 flex gap-1 justify-end items-center">
                        <input 
                          value={serviceCoupons[b.id] || ''} 
                          onChange={(e) => setServiceCoupons((x) => ({ ...x, [b.id]: e.target.value.toUpperCase() }))} 
                          placeholder="Coupon" 
                          className="h-8 w-24 rounded-lg border border-input bg-background px-2 text-xs" 
                          maxLength={64} 
                        />
                        <Button size="sm" variant="outline" onClick={() => applyServiceCoupon(b)} disabled={couponApplying[b.id]} className="h-8 rounded-lg text-xs">
                          Apply
                        </Button>
                      </div>
                    )}
                    {b.couponDiscount > 0 && (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                        Coupon discount: -{money(b.couponDiscount)}
                      </div>
                    )}
                    {b.status === 'COMPLETED' && b.paymentStatus !== 'SUCCESS' && (
                      <Button size="sm" className="mt-2 rounded-xl bg-gradient-to-r from-teal-500 to-primary text-white font-semibold" onClick={() => payServiceOnline(b)}>
                        Pay online
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!filteredHistory.length && (
              <GlassPanel className="p-8 text-center text-muted-foreground">
                No historical records found matching filter options.
              </GlassPanel>
            )}
          </div>
        )}

        {/* TAB 7: PROVIDER HISTORY (Completed/Cancelled requests) */}
        {!loading && tab === 'provider-history' && (
          <div className="space-y-4">
            {!eligibility?.eligible ? renderProviderOnboardingBanner() : (
              <div className="space-y-4">
                {historyRequests.map((b) => (
                  <div key={b.id} className="ops-panel p-5 border border-border/80 rounded-2xl bg-gradient-to-r from-background to-muted/5">
                    <div className="flex flex-col md:flex-row md:justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground font-semibold">REQUEST #{b.id} · {b.serviceType}</div>
                        <h3 className="font-bold text-lg text-foreground">{b.serviceTitle}</h3>
                        <div className="text-sm text-muted-foreground mt-2 flex flex-wrap gap-4">
                          <span>📅 {b.serviceDate}</span>
                          <span>👤 Customer: {b.userName || 'Buyer'}</span>
                          <span>🏡 Customer Farm: {b.farmName || '—'}</span>
                        </div>
                      </div>
                      <div className="text-right space-y-1 min-w-[150px]">
                        <div className="font-bold text-lg text-foreground">{money(b.finalTotalAmount ?? b.totalAmount)}</div>
                        <div className={`text-sm ${statusTone(b.status)}`}>{b.status}</div>
                        <div className="text-xs text-muted-foreground">Payment: <span className="font-bold text-foreground">{b.paymentStatus}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
                {!historyRequests.length && (
                  <GlassPanel className="p-8 text-center text-muted-foreground">
                    No completed or cancelled service requests in history.
                  </GlassPanel>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Detail & Booking Modal dialog */}
        {selected && tab === 'discover' && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-4 overflow-y-auto" onClick={() => setSelected(null)}>
            <div className="max-w-3xl w-full mx-auto my-8 ops-panel bg-background border border-border/80 rounded-3xl p-6 shadow-2xl animate-scaleUp" onClick={(e) => e.stopPropagation()}>
              
              <div className="flex justify-between gap-4 border-b pb-4">
                <div>
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{selected.type}</span>
                  <h2 className="text-2xl font-bold mt-2 text-foreground">{selected.title}</h2>
                </div>
                <Button variant="ghost" onClick={() => setSelected(null)} className="h-8 w-8 rounded-full p-0">
                  <XCircle className="h-6 w-6 text-muted-foreground hover:text-foreground" />
                </Button>
              </div>

              {/* Service media gallery */}
              {(() => {
                const media = Array.isArray(selected.attachmentUrls) ? selected.attachmentUrls : [];
                if (!media.length) {
                  return (
                    <div className="mt-5 flex items-center justify-center gap-2 border border-dashed border-border/70 rounded-2xl p-6 text-muted-foreground text-sm">
                      <span className="text-2xl">📷</span> No image or video attached to this service
                    </div>
                  );
                }
                const activeUrl = media[Math.min(serviceMediaIdx, media.length - 1)];
                const activeIsVideo = activeUrl && activeUrl.match(/\.(mp4|webm|mov|m4v)$/i);
                return (
                  <div className="space-y-3 mt-5">
                    <div className="relative bg-muted/30 rounded-2xl border border-border/60 overflow-hidden h-72 md:h-80">
                      {activeIsVideo && serviceMediaError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-black text-center px-4">
                          <span className="text-3xl">🎥</span>
                          <span className="text-sm text-amber-300">This video uses a codec your browser can't play.</span>
                          <span className="text-xs text-white/70">Please ask the provider to re-upload it as MP4 (H.264/AAC) or WebM.</span>
                        </div>
                      ) : activeIsVideo ? (
                        <video src={activeUrl} controls autoPlay muted={serviceMediaMuted} playsInline preload="metadata" className="w-full h-full object-contain bg-black" onError={() => setServiceMediaError(true)} />
                      ) : (
                        <img src={activeUrl} alt={selected.title} className="w-full h-full object-cover" />
                      )}
                      {activeIsVideo && !serviceMediaError && (
                        <button
                          type="button"
                          onClick={(e) => {
                            const next = !serviceMediaMuted;
                            setServiceMediaMuted(next);
                            const v = e.currentTarget.parentElement?.querySelector('video');
                            if (v) {
                              v.muted = next;
                              if (v.paused) v.play().catch(() => {});
                            }
                          }}
                          className="absolute bottom-2 left-2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
                          title={serviceMediaMuted ? 'Unmute (sound on)' : 'Mute (sound off)'}
                          aria-label={serviceMediaMuted ? 'Unmute' : 'Mute'}
                        >
                          {serviceMediaMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                      )}
                      {media.length > 1 && (
                        <>
                          <button type="button" onClick={() => { setServiceMediaIdx((i) => (i + media.length - 1) % media.length); setServiceMediaError(false); }} className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition" aria-label="Previous media">‹</button>
                          <button type="button" onClick={() => { setServiceMediaIdx((i) => (i + 1) % media.length); setServiceMediaError(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition" aria-label="Next media">›</button>
                          <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full">{Math.min(serviceMediaIdx, media.length - 1) + 1} / {media.length}</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {media.slice(0, 8).map((url, i) => {
                        const isVideo = url.match(/\.(mp4|webm|mov|m4v)$/i);
                        return (
                          <button key={i} type="button" onClick={() => { setServiceMediaIdx(i); setServiceMediaError(false); }} className={`h-16 w-16 shrink-0 rounded-xl border-2 overflow-hidden bg-muted/30 transition ${i === Math.min(serviceMediaIdx, media.length - 1) ? 'border-primary' : 'border-border hover:border-primary/50'}`} title={isVideo ? 'Video' : 'Photo'}>
                            {isVideo ? <div className="relative w-full h-full bg-black/80 flex items-center justify-center text-white text-lg">▶</div> : <img src={url} alt={`${selected.title} ${i + 1}`} className="w-full h-full object-cover" />}
                          </button>
                        );
                      })}
                      {media.length > 8 && <span className="shrink-0 h-16 w-16 rounded-xl border-2 border-border bg-muted/30 flex items-center justify-center text-xs font-bold text-muted-foreground">+{media.length - 8}</span>}
                    </div>
                  </div>
                );
              })()}

              {/* Pricing breakdown summary */}
              <div className="grid md:grid-cols-2 gap-4 mt-5 text-sm">
                <div className="ops-panel p-4 border border-border/80 rounded-2xl bg-muted/10">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">Pricing rate</span>
                  <div className="text-xl font-bold text-foreground mt-1">
                    {money(unitPrice(selected))} 
                    <span className="text-xs text-muted-foreground font-normal"> / {priceUnitLabel(selected.priceUnit)}</span>
                  </div>
                </div>
                <div className="ops-panel p-4 border border-border/80 rounded-2xl bg-muted/10">
                  <span className="text-xs text-muted-foreground font-semibold uppercase">Listing Capacity</span>
                  <div className="text-xl font-bold text-foreground mt-1">{selected.quantityTotal || 1} physical unit(s)</div>
                </div>
              </div>

              {/* Full service details - all units viewable with dropdown */}
              <div className="ops-panel p-4 border border-border/80 rounded-2xl bg-muted/5 mt-5 space-y-4">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Service Details</span>
                  {selected.description && <p className="text-sm text-foreground leading-relaxed mb-3">{selected.description}</p>}
                  <UnitDetailsPanel listing={selected} selectedUnit={detailUnitIdx} onSelectUnit={setDetailUnitIdx} />
                </div>
                {(Array.isArray(selected.servicePurposes) && selected.servicePurposes.length > 0) && (
                  <div>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1.5">Service Purposes</span>
                    <div className="flex flex-wrap gap-2">
                      {selected.servicePurposes.map((p, idx) => (
                        <span key={idx} className="bg-teal-50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-400 text-xs font-semibold px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800/30">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                <dl className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-background p-3 rounded-xl border border-border/50">
                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Available</dt>
                    <dd className="font-bold text-foreground mt-0.5">{selected.availableFrom || 'Open'} → {selected.availableUntil || 'Open'}</dd>
                  </div>
                  <div className="bg-background p-3 rounded-xl border border-border/50">
                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Hours</dt>
                    <dd className="font-bold text-foreground mt-0.5">{selected.availabilityStartTime || '—'} to {selected.availabilityEndTime || '—'}</dd>
                  </div>
                  <div className="bg-background p-3 rounded-xl border border-border/50">
                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Days</dt>
                    <dd className="font-bold text-foreground mt-0.5 text-[11px]">{selected.availableDaysOfWeek || 'All days'}</dd>
                  </div>
                  <div className="bg-background p-3 rounded-xl border border-border/50">
                    <dt className="text-[10px] text-muted-foreground uppercase font-bold">Coverage</dt>
                    <dd className="font-bold text-foreground mt-0.5">{selected.locationScope || 'INDIA'}</dd>
                  </div>
                  {selected.minimumHours != null && (
                    <div className="bg-background p-3 rounded-xl border border-border/50">
                      <dt className="text-[10px] text-muted-foreground uppercase font-bold">Min / Max Hours</dt>
                      <dd className="font-bold text-foreground mt-0.5">{selected.minimumHours || 1} / {selected.maximumHours || '—'}</dd>
                    </div>
                  )}
                  {selected.pickupDropAvailable && (
                    <div className="bg-background p-3 rounded-xl border border-border/50">
                      <dt className="text-[10px] text-muted-foreground uppercase font-bold">Transport</dt>
                      <dd className="font-bold text-foreground mt-0.5">Pickup {money(selected.pickupCharge)} · Drop {money(selected.dropCharge)} · {money(selected.transportPerKm)}/km</dd>
                    </div>
                  )}
                </dl>
              </div>

              <form onSubmit={submitBooking} className="grid md:grid-cols-2 gap-4 mt-6">
                <Field label="Service Date">
                  <input type="date" min={new Date().toISOString().slice(0, 10)} className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={booking.serviceDate} onChange={(e) => setBookingField('serviceDate', e.target.value)} required />
                </Field>
                <Field label="Farm Selection (optional)">
                  <select className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={booking.farmId} onChange={(e) => { setBookingField('farmId', e.target.value); setBookingField('cropId', ''); }}>
                    <option value="">No farm association</option>
                    {selectedFarms.map((f) => <option key={f.id} value={f.id}>{f.farmName || f.name}</option>)}
                  </select>
                </Field>
                <Field label="Crop Selection (optional)">
                  <select className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={booking.cropId} onChange={(e) => setBookingField('cropId', e.target.value)}>
                    <option value="">No crop association</option>
                    {visibleCrops.map((c) => <option key={c.id} value={c.id}>{c.cropName || c.name}</option>)}
                  </select>
                </Field>
                <Field label="Service Delivery Location">
                  <input className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={booking.location} onChange={(e) => setBookingField('location', e.target.value)} required />
                </Field>
                <Field label="Start hour time">
                  <input type="time" className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={booking.startTime} onChange={(e) => setBookingField('startTime', e.target.value)} />
                </Field>
                <Field label="End hour time">
                  <input type="time" className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={booking.endTime} onChange={(e) => setBookingField('endTime', e.target.value)} />
                </Field>
                <Field label="Total Hours booking duration">
                  <input type="number" min="1" className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={booking.hours} onChange={(e) => setBookingField('hours', e.target.value)} required />
                </Field>
                <Field label={selected.type === 'MANUAL' ? 'Total workers count requested' : 'Physical units quantity needed'}>
                  <input 
                    type="number" 
                    min="1" 
                    max={selected.quantityTotal || 1} 
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" 
                    value={booking.requestedQuantity} 
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '' || !Number.isFinite(Number(raw)) || Number(raw) < 1) {
                        setBookingField('requestedQuantity', '');
                        return;
                      }
                      const n = Math.min(Number(raw), Number(selected.quantityTotal || 1));
                      setBooking((b) => {
                        const capacity = Number(selected.quantityTotal || 1);
                        const existing = (b.selectedUnitNumbers || []).filter((x) => x >= 1 && x <= capacity);
                        const next = [...existing];
                        for (let unit = 1; unit <= capacity && next.length < n; unit += 1) {
                          if (!next.includes(unit)) next.push(unit);
                        }
                        return { ...b, requestedQuantity: n, selectedUnitNumbers: next.slice(0, n) };
                      });
                    }}
                    onBlur={() => {
                      if (booking.requestedQuantity === '' || Number(booking.requestedQuantity) < 1) {
                        setBooking((b) => ({ ...b, requestedQuantity: 1, selectedUnitNumbers: [1] }));
                      }
                    }} 
                  />
                </Field>

                {selected.type === 'MANUAL' && (
                  <Field label="People">
                    <input type="number" min="1" className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={booking.peopleCount} onChange={(e) => setBookingField('peopleCount', e.target.value)} />
                  </Field>
                )}

                {/* Individual Multi-unit Selection */}
                {selected.type !== 'MANUAL' && Number(selected.quantityTotal || 1) > 1 && Array.isArray(selected.unitConfigurations) && selected.unitConfigurations.length >= Number(selected.quantityTotal || 1) && (
                  <div className="md:col-span-2 bg-muted/20 p-4 border border-border/80 rounded-2xl space-y-3">
                    <div>
                      <h5 className="font-bold text-sm text-foreground">Select Specific Service Units</h5>
                      <p className="text-xs text-muted-foreground mt-0.5">Select the exact tractor/excavator machine you want to book from the units list.</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1">
                      {selected.unitConfigurations.map((u, i) => {
                        const number = i + 1;
                        const checked = (booking.selectedUnitNumbers || []).includes(number);
                        const limitReached = (booking.selectedUnitNumbers || []).length >= Number(booking.requestedQuantity || 1);
                        return (
                          <label key={number} className={`rounded-xl border p-3 cursor-pointer transition select-none flex items-start gap-3 ${checked ? 'border-primary bg-primary/5' : 'border-border bg-background'}`}>
                            <input 
                              type="checkbox" 
                              checked={checked} 
                              disabled={!checked && limitReached} 
                              onChange={() => setBooking((b) => {
                                const current = b.selectedUnitNumbers || [];
                                const next = checked ? current.filter((x) => x !== number) : [...current, number];
                                return { ...b, selectedUnitNumbers: next };
                              })}
                              className="mt-1 h-4 w-4 rounded accent-teal-600 cursor-pointer"
                            />
                            <div className="min-w-0 text-xs">
                              <div className="font-bold text-foreground">Unit {number}</div>
                              <div className="text-muted-foreground mt-0.5">{u.model || selected.equipmentModel || 'Equipment'} · {u.power || selected.equipmentPower || 'Power unspecified'}</div>
                              <div className="mt-1 text-foreground">Machine: <span className="font-semibold">{money(u.machinePrice ?? selected.machinePrice)}</span> {selected.priceUnit ? `/ ${String(selected.priceUnit).toLowerCase().replace('per_', '')}` : ''}</div>
                              <div className="text-muted-foreground">Driver: {u.driverAvailable ? money(u.driverPrice ?? selected.driverPrice) : 'Not available'}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-bold">{(booking.selectedUnitNumbers || []).length} of {Number(booking.requestedQuantity || 1)} selected</div>
                  </div>
                )}

                {['PER_ACRE', 'PER_HECTARE'].includes(selected.priceUnit) && (
                  <Field label="Total Area (Acres/Hectares Pricing)">
                    <input type="number" min="0" step="0.01" className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={booking.areaQuantity} onChange={(e) => setBookingField('areaQuantity', e.target.value)} placeholder="Only for Acre/Hectare pricing" required />
                  </Field>
                )}

                {selected.hasDriver && (
                  <Field label="Operator/Driver extra requirement">
                    <select className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={booking.includeDriver ? 'yes' : 'no'} onChange={(e) => setBookingField('includeDriver', e.target.value === 'yes')}>
                      <option value="no">No driver/operator needed</option>
                      <option value="yes">Yes, include driver/operator</option>
                    </select>
                  </Field>
                )}

                {selected.pickupDropAvailable && (
                  <>
                    <Field label="Request transport pickup">
                      <select className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={booking.includePickup ? 'yes' : 'no'} onChange={(e) => setBookingField('includePickup', e.target.value === 'yes')}>
                        <option value="no">No</option>
                        <option value="yes">Yes, include pickup ({money(selected.pickupCharge)})</option>
                      </select>
                    </Field>

                    <Field label="Request transport dropoff">
                      <select className="w-full h-10 rounded-xl border border-input bg-background px-3 focus:ring-primary focus:ring-2 focus:border-transparent outline-none transition" value={booking.includeDrop ? 'yes' : 'no'} onChange={(e) => setBookingField('includeDrop', e.target.value === 'yes')}>
                        <option value="no">No</option>
                        <option value="yes">Yes, include dropoff ({money(selected.dropCharge)})</option>
                      </select>
                    </Field>
                  </>
                )}

                <div className="md:col-span-2">
                  <Field label="Booking remarks / instructions / notes">
                    <textarea className="w-full min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition" value={booking.notes} onChange={(e) => setBookingField('notes', e.target.value)} placeholder="Provide special instructions to the provider..." />
                  </Field>
                </div>

                <div className="md:col-span-2 flex justify-end gap-2 border-t pt-4">
                  <Button type="button" variant="outline" onClick={() => setSelected(null)} className="rounded-xl">Cancel</Button>
                  <Button type="submit" disabled={saving} className="rounded-xl bg-gradient-to-r from-teal-500 to-primary text-white font-semibold">
                    Submit booking request
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppPage>
  );
}
