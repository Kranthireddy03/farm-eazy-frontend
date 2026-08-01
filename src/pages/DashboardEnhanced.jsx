import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, ShoppingCart, Droplets, LifeBuoy, Wrench, Pencil, Trash2, Plus, CloudSun, Bell, TrendingUp } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useCoin } from '../context/CoinContext';
import { useLocationContext } from '../context/LocationContext';
import apiClient from '../services/apiClient';
import AppPage from '../components/layout/AppPage';
import { KpiCard } from '../components/ui/kpi-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FilterBar } from '../components/ui/filter-bar';
import ActivityTimeline from '../components/ui/ActivityTimeline';
import { PageSkeleton } from '../components/ui/Skeleton';
import { ActivityAreaChart, OrdersBarChart, groupActivitiesByDay } from '../components/charts/dashboard-charts';

function DashboardEnhanced() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { coins } = useCoin();
  const { selectedLocationLabel, hasSelectedLocation } = useLocationContext();

  const [serviceFilter, setServiceFilter] = useState('');
  const [serviceSort, setServiceSort] = useState('name');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [stats, setStats] = useState({
    totalFarms: 0,
    totalCrops: 0,
    totalIrrigations: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalServices: 0,
    activeAlerts: 0,
  });

  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedActivityType, setSelectedActivityType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceListings, setServiceListings] = useState([]);

  const activityTypes = [
    { value: 'ALL', label: 'All activities' },
    { value: 'REGISTERED', label: 'Account' },
    { value: 'ORDER_PLACED', label: 'Orders' },
    { value: 'ADDED_PRODUCT', label: 'Products' },
    { value: 'FARM_ADDED', label: 'Farms' },
    { value: 'CROP_ADDED', label: 'Crops' },
    { value: 'COINS_EARNED', label: 'Coins' },
  ];

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    filterActivities();
  }, [activities, selectedActivityType, searchTerm]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [farmsRes, cropsRes, irrigationRes, productsRes, servicesRes, ordersRes] =
        await Promise.allSettled([
          apiClient.get('/farms'),
          apiClient.get('/crops'),
          apiClient.get('/irrigation'),
          apiClient.get('/products'),
          apiClient.get('/services/listings'),
          apiClient.get('/orders').catch(() => ({ data: { totalOrders: 0 } })),
        ]);

      const activitiesRes = await apiClient.get('/activities');
      setActivities(Array.isArray(activitiesRes.data) ? activitiesRes.data : []);

      const newStats = { ...stats };

      if (farmsRes.status === 'fulfilled') {
        newStats.totalFarms = Array.isArray(farmsRes.value.data) ? farmsRes.value.data.length : 0;
      }
      if (cropsRes.status === 'fulfilled') {
        newStats.totalCrops = Array.isArray(cropsRes.value.data) ? cropsRes.value.data.length : 0;
      }
      if (irrigationRes.status === 'fulfilled') {
        newStats.totalIrrigations = Array.isArray(irrigationRes.value.data) ? irrigationRes.value.data.length : 0;
      }
      if (productsRes.status === 'fulfilled') {
        newStats.totalProducts = Array.isArray(productsRes.value.data) ? productsRes.value.data.length : 0;
      }
      if (servicesRes.status === 'fulfilled') {
        const servicesData = servicesRes.value.data;
        let user = null;
        try {
          user = JSON.parse(localStorage.getItem('user'));
        } catch {
          /* ignore */
        }
        let allServices = [];
        if (servicesData.content && Array.isArray(servicesData.content)) {
          allServices = servicesData.content;
        } else if (Array.isArray(servicesData)) {
          allServices = servicesData;
        }
        let filtered = allServices;
        if (user && user.id) {
          filtered = allServices.filter((s) => s.userId === user.id);
        }
        setServiceListings(filtered);
        newStats.totalServices = filtered.length;
        if (!allServices.length) {
          setServiceListings([]);
          newStats.totalServices = 0;
        }
      }
      if (ordersRes.status === 'fulfilled') {
        newStats.totalOrders = Array.isArray(ordersRes.value.data) ? ordersRes.value.data.length : 0;
      }

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const editService = (id) => {
    navigate(`/services/edit/${id}`);
  };

  const deleteService = async (id) => {
    try {
      await apiClient.delete(`/services/${id}`);
      setServiceListings((prev) => prev.filter((s) => s.id !== id));
      showToast('Service deleted successfully', 'success');
      setDeleteConfirmId(null);
    } catch {
      showToast('Failed to delete service', 'error');
      setDeleteConfirmId(null);
    }
  };

  const filterActivities = () => {
    let filtered = activities;

    if (selectedActivityType !== 'ALL') {
      filtered = filtered.filter((activity) => activity.activityType === selectedActivityType);
    }

    if (searchTerm) {
      filtered = filtered.filter((activity) =>
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredActivities(filtered);
  };

  const filteredServices = serviceListings
    .filter(
      (service) =>
        !serviceFilter ||
        (service.name && service.name.toLowerCase().includes(serviceFilter.toLowerCase())) ||
        (service.description &&
          service.description.toLowerCase().includes(serviceFilter.toLowerCase())),
    )
    .sort((a, b) => {
      if (serviceSort === 'name') return (a.name || '').localeCompare(b.name || '');
      if (serviceSort === 'price') return (a.price || 0) - (b.price || 0);
      if (serviceSort === 'status') return (a.status || '').localeCompare(b.status || '');
      return 0;
    });

  if (loading) {
    return (
      <AppPage title="Dashboard" description="Loading your operational overview…">
        <PageSkeleton />
      </AppPage>
    );
  }

  const activityChartData = groupActivitiesByDay(activities);
  const ordersChartData = [
    { label: 'Farms', value: stats.totalFarms },
    { label: 'Products', value: stats.totalProducts },
    { label: 'Orders', value: stats.totalOrders },
    { label: 'Services', value: stats.totalServices },
  ];

  return (
    <AppPage
      title="Operations dashboard"
      description="Analytics, activity, and marketplace signals for your selected service location."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={() => navigate('/notifications')}>
            <Bell className="h-4 w-4" />
            Notifications
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/activities')}>
            Activity log
          </Button>
        </>
      }
    >

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard title="Active farms" value={stats.totalFarms} hint="Registered locations" icon={Sprout} />
        <KpiCard title="Growing crops" value={stats.totalCrops} hint="Across all farms" icon={Sprout} />
        <KpiCard title="Listed products" value={stats.totalProducts} hint="Marketplace" icon={ShoppingCart} />
        <KpiCard title="Orders" value={stats.totalOrders} hint="Purchase history" icon={TrendingUp} />
        <KpiCard title="Coins" value={coins?.totalCoins || 0} hint="Rewards balance" icon={ShoppingCart} />
        <KpiCard title="Irrigation" value={stats.totalIrrigations} hint="Active schedules" icon={Droplets} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 grid gap-4">
          <ActivityAreaChart data={activityChartData} description="Events recorded in the last 7 days" />
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CloudSun className="h-4 w-4 text-muted-foreground" />
              Location context
            </CardTitle>
            <CardDescription>Weather and service area for marketplace data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Service location</p>
              <p className="font-medium text-foreground mt-1">
                {hasSelectedLocation ? selectedLocationLabel : 'No location selected'}
              </p>
            </div>
            <p className="text-muted-foreground">
              Marketplace listings and delivery eligibility are scoped to your active location. Update it from the location bar above.
            </p>
          </CardContent>
        </Card>
      </div>

      <OrdersBarChart data={ordersChartData} title="Portfolio snapshot" description="Counts across core modules" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            My service listings
          </CardTitle>
          <CardDescription>Manage services you offer in your area.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FilterBar
            value={serviceFilter}
            onChange={setServiceFilter}
            placeholder="Search services…"
          />

          {filteredServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No service listings yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {filteredServices.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{service.name}</p>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{service.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1 text-sm">
                      {service.price && <span className="text-primary">₹{service.price}</span>}
                      {service.status && (
                        <span className="text-muted-foreground">Status: {service.status}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" size="sm" onClick={() => editService(service.id)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmId(service.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activity feed</CardTitle>
          <CardDescription>Track actions and interactions in your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Activity type</label>
              <select
                value={selectedActivityType}
                onChange={(e) => setSelectedActivityType(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {activityTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Search</label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search description"
              />
            </div>
            <div className="flex items-end">
              <span className="inline-flex h-9 items-center rounded-md bg-muted px-3 text-sm font-medium text-muted-foreground">
                {filteredActivities.length} result{filteredActivities.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            <ActivityTimeline
              activities={filteredActivities}
              emptyMessage="No activities match your filters yet."
            />
          </div>

          {activities.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border pt-4 text-center">
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {activities.filter((a) => a.activityType.includes('FARM')).length}
                </p>
                <p className="text-xs text-muted-foreground">Farm actions</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {activities.filter((a) => a.activityType.includes('CROP')).length}
                </p>
                <p className="text-xs text-muted-foreground">Crop actions</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {activities.filter((a) => a.activityType.includes('ORDER')).length}
                </p>
                <p className="text-xs text-muted-foreground">Order actions</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {activities.filter((a) => a.activityType.includes('COIN')).length}
                </p>
                <p className="text-xs text-muted-foreground">Coin actions</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => navigate('/farms')}
          className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
        >
          <Sprout className="h-5 w-5 text-primary mb-2" />
          <p className="font-medium text-foreground">Add farm</p>
          <p className="text-sm text-muted-foreground">Create a new farm</p>
        </button>
        <button
          type="button"
          onClick={() => navigate('/crops')}
          className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
        >
          <Plus className="h-5 w-5 text-primary mb-2" />
          <p className="font-medium text-foreground">Plant crop</p>
          <p className="text-sm text-muted-foreground">Add new crop</p>
        </button>
        <button
          type="button"
          onClick={() => navigate('/buying')}
          className="rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
        >
          <ShoppingCart className="h-5 w-5 text-primary mb-2" />
          <p className="font-medium text-foreground">Shop</p>
          <p className="text-sm text-muted-foreground">Browse marketplace</p>
        </button>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirmId(null)} />
          <Card className="relative z-10 w-full max-w-sm">
            <CardHeader>
              <CardTitle>Confirm delete</CardTitle>
              <CardDescription>Are you sure you want to delete this service?</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteService(deleteConfirmId)}>Delete</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </AppPage>
  );
}

export default DashboardEnhanced;
