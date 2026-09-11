import { useState, useEffect } from 'react';
import { 
  Bell, Mail, MailOpen, Bookmark, BookmarkCheck, RefreshCw, 
  ExternalLink, Trash2, Settings2, CheckCircle2, AlertTriangle, 
  ShoppingCart, Package, Coins, Ticket, Droplets, MessageSquare, Landmark, X
} from 'lucide-react';
import AppPage from '../components/layout/AppPage';
import { PageScaffold } from '../components/app/PageScaffold';
import { KpiSection } from '../components/app/KpiSection';
import { KpiCard } from '../components/ui/kpi-card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { EmptyState } from '../components/ui/empty-state';
import { PageSkeleton } from '../components/ui/Skeleton';
import { InfoPanel } from '../components/platform/InfoPanel';
import { FePanel } from '../components/platform/FeOpsPrimitives';
import NotificationService from '../services/NotificationService';
import { toast } from 'sonner';

const SAVED_KEY = 'farmeazy_saved_notifications';

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'saved', label: 'Saved' },
];

const CATEGORY_CHIPS = [
  { value: 'ALL_CATEGORIES', label: 'All Categories', icon: Bell },
  { value: 'PRODUCT', label: 'Marketplace', icon: ShoppingCart },
  { value: 'ORDER', label: 'Orders', icon: Package },
  { value: 'COIN', label: 'Coins & Rewards', icon: Coins },
  { value: 'COUPON', label: 'Coupons & Deals', icon: Ticket },
  { value: 'IRRIGATION', label: 'Irrigation & Farms', icon: Droplets },
  { value: 'SUPPORT', label: 'Support & Chat', icon: MessageSquare },
  { value: 'BANK', label: 'Bank & Payouts', icon: Landmark },
];

const TYPE_ACCENT = {
  ORDER: 'border-l-blue-500',
  PAYMENT: 'border-l-emerald-500',
  FARM: 'border-l-amber-500',
  IRRIGATION: 'border-l-cyan-500',
  PRODUCT: 'border-l-violet-500',
  SERVICE: 'border-l-teal-500',
  COIN: 'border-l-amber-400',
  COUPON: 'border-l-pink-500',
  SUPPORT: 'border-l-indigo-500',
  BANK: 'border-l-emerald-600',
  ACCOUNT: 'border-l-slate-400',
  SYSTEM: 'border-l-orange-500',
  PROMO: 'border-l-pink-500',
};

const PRIORITY_VARIANT = {
  URGENT: 'destructive',
  HIGH: 'warning',
  NORMAL: 'muted',
  LOW: 'outline',
};

function readSavedLocal() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function defaultLinkFor(notification) {
  const type = String(notification?.type || '').toUpperCase();
  switch (type) {
    case 'PRODUCT': return '/products';
    case 'SERVICE': return '/services';
    case 'ORDER':
    case 'PAYMENT': return '/products/orders';
    case 'COIN': return '/coins';
    case 'COUPON': return '/products';
    case 'FARM': return '/farms';
    case 'IRRIGATION': return '/irrigation';
    case 'SUPPORT': return '/support';
    case 'BANK': return '/user/bank-details';
    default: return '/notifications';
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [notifications, setNotifications] = useState([]);
  const [savedNotifications, setSavedNotifications] = useState(readSavedLocal);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(searchParams.get('tab') || 'all');
  const [categoryFilter, setCategoryFilter] = useState('ALL_CATEGORIES');
  
  // Preference modal state
  const [prefModalOpen, setPrefModalOpen] = useState(searchParams.get('prefs') === 'true');
  const [preferences, setPreferences] = useState(null);
  const [prefLoading, setPrefLoading] = useState(false);
  const [prefSaving, setPrefSaving] = useState(false);

  useEffect(() => {
    if (searchParams.get('tab')) {
      setTab(searchParams.get('tab'));
    }
    if (searchParams.get('prefs') === 'true') {
      setPrefModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchNotifications();
    loadPreferences();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [allData, savedData] = await Promise.all([
        NotificationService.getAll(),
        NotificationService.getSaved(),
      ]);
      setNotifications(allData || []);
      if (Array.isArray(savedData) && savedData.length > 0) {
        setSavedNotifications(savedData);
        localStorage.setItem(SAVED_KEY, JSON.stringify(savedData));
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    setPrefLoading(true);
    try {
      const data = await NotificationService.getPreferences();
      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    } finally {
      setPrefLoading(false);
    }
  };

  const handleTogglePref = (key) => {
    if (!preferences) return;
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
      categories: prev.categories?.map((cat) =>
        cat.key === key ? { ...cat, enabled: !cat.enabled } : cat
      ),
    }));
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;
    setPrefSaving(true);
    try {
      const updated = await NotificationService.updatePreferences(preferences);
      setPreferences(updated);
      toast.success('In-app notification preferences saved successfully!');
      setPrefModalOpen(false);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setPrefSaving(false);
    }
  };

  const handleSave = async (notification) => {
    try {
      const savedDto = await NotificationService.saveNotification(notification.id);
      const updatedSaved = [savedDto || { ...notification, isSaved: true, savedAt: new Date().toISOString() }, ...savedNotifications.filter(n => n.id !== notification.id)];
      setSavedNotifications(updatedSaved);
      localStorage.setItem(SAVED_KEY, JSON.stringify(updatedSaved));
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isSaved: true } : n)));
      toast.success('Notification saved permanently');
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (error) {
      console.error('Failed to save notification:', error);
      // Fallback local save
      const snapshot = { ...notification, isSaved: true, savedAt: new Date().toISOString() };
      const next = [snapshot, ...savedNotifications.filter(n => n.id !== notification.id)];
      setSavedNotifications(next);
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      toast.success('Notification saved locally');
    }
  };

  const handleRemoveSaved = async (id) => {
    try {
      await NotificationService.unsaveNotification(id);
    } catch (e) {
      // Local fallback
    }
    const next = savedNotifications.filter((n) => String(n.id) !== String(id));
    setSavedNotifications(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isSaved: false } : n)));
    toast.success('Removed from saved');
    window.dispatchEvent(new Event('notifications-changed'));
  };

  const handleMarkRead = async (id) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkUnread = async (id) => {
    try {
      await NotificationService.markAsUnread(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)));
      window.dispatchEvent(new Event('notifications-changed'));
      toast.info('Marked as unread');
    } catch (error) {
      console.error('Failed to mark as unread:', error);
    }
  };

  const handleDismiss = async (id) => {
    try {
      await NotificationService.dismiss(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setSavedNotifications((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new Event('notifications-changed'));
      toast.success('Notification dismissed');
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('notifications-changed'));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleOpen = async (notification) => {
    try {
      if (!notification.isRead) {
        await NotificationService.markAsRead(notification.id);
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
        window.dispatchEvent(new Event('notifications-changed'));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
    const targetUrl = notification.actionUrl || defaultLinkFor(notification);
    navigate(targetUrl);
  };

  const savedIds = new Set(savedNotifications.map((n) => String(n.id)));
  const showSavedTab = tab === 'saved';

  const baseList = showSavedTab
    ? savedNotifications
    : notifications.filter((n) => {
        if (tab === 'unread') return !n.isRead;
        return true;
      });

  const filteredNotifications = baseList.filter((n) => {
    if (categoryFilter === 'ALL_CATEGORIES') return true;
    const type = String(n.type || '').toUpperCase();
    if (categoryFilter === 'PRODUCT' && (type === 'PRODUCT' || type === 'SERVICE')) return true;
    if (categoryFilter === 'ORDER' && (type === 'ORDER' || type === 'PAYMENT')) return true;
    if (categoryFilter === 'COIN' && type === 'COIN') return true;
    if (categoryFilter === 'COUPON' && (type === 'COUPON' || type === 'PROMO')) return true;
    if (categoryFilter === 'IRRIGATION' && (type === 'IRRIGATION' || type === 'FARM')) return true;
    if (categoryFilter === 'SUPPORT' && type === 'SUPPORT') return true;
    if (categoryFilter === 'BANK' && (type === 'BANK' || type === 'PAYMENT')) return true;
    return type === categoryFilter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppPage
      title="In-App Notifications"
      description="Location-based marketplace updates, orders, coin bonuses, coupon deals, irrigation, and support alerts."
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setPrefModalOpen(true)} 
            className="gap-2 border-primary/40 hover:border-primary text-primary"
          >
            <Settings2 className="h-4 w-4" />
            Preferences
          </Button>
          <Button variant="outline" size="sm" onClick={fetchNotifications} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </div>
      }
    >
      <KpiSection>
        <KpiCard title="Total Alerts" value={notifications.length} hint="Session & active alerts" icon={Bell} />
        <KpiCard title="Unread" value={unreadCount} hint="Requires your attention" icon={Mail} />
        <KpiCard title="Saved" value={savedNotifications.length} hint="Saved permanently" icon={Bookmark} />
      </KpiSection>

      <PageScaffold
        aside={
          <div className="space-y-4">
            <InfoPanel
              title="Notification Controls"
              description="Customize what you receive & how items persist."
            >
              <div className="text-xs text-muted-foreground mt-2 space-y-2.5">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">📍</span>
                  <span><b>Location Alerts:</b> You get instant alerts whenever new crops, products, or services are listed in your pincode or area with a direct clickable link.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">🔖</span>
                  <span><b>Save Alerts:</b> Tap <b>Save</b> on any notification to keep it permanently across sessions in the <b>Saved</b> tab.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary font-bold">⚙️</span>
                  <span><b>Granular Toggles:</b> Tap <b>Preferences</b> above to customize which events trigger in-app notifications (Marketplace, Coins, Coupons, Irrigation, etc.).</span>
                </div>
              </div>
            </InfoPanel>

            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Notification Settings</span>
                <Button size="sm" variant="ghost" onClick={() => setPrefModalOpen(true)} className="text-xs text-primary p-0 h-auto">
                  Configure →
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Choose the exact types of alerts you want to receive in-app with granular checkboxes.
              </p>
            </div>
          </div>
        }
      >
        {/* Main Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-border">
          <div className="flex gap-2">
            {FILTER_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                className={cn('ops-chip font-medium', tab === t.value && 'ops-chip-active')}
                onClick={() => setTab(t.value)}
              >
                {t.label}
                {t.value === 'unread' && unreadCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-primary text-white text-[10px] rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
                {t.value === 'saved' && savedNotifications.length > 0 && (
                  <span className="ml-1.5 text-[10px] font-bold opacity-80">
                    ({savedNotifications.length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_CHIPS.map((chip) => {
              const IconComp = chip.icon;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setCategoryFilter(chip.value)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-lg transition flex items-center gap-1.5 border',
                    categoryFilter === chip.value
                      ? 'bg-primary/15 border-primary text-primary font-semibold shadow-sm'
                      : 'border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                  )}
                >
                  <IconComp className="h-3 w-3" />
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading && !showSavedTab ? (
          <PageSkeleton variant="cards" />
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={showSavedTab ? Bookmark : Bell}
            title={showSavedTab ? 'No saved notifications' : 'No notifications found'}
            description={
              showSavedTab
                ? 'Save important notifications from the list above — they remain permanently stored here.'
                : tab === 'unread'
                  ? 'You have no unread notifications right now.'
                  : categoryFilter !== 'ALL_CATEGORIES'
                    ? `No notifications found under "${CATEGORY_CHIPS.find(c => c.value === categoryFilter)?.label}".`
                    : 'You are all caught up! New alerts and local listings will appear here.'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const isSaved = savedIds.has(String(notification.id)) || notification.isSaved;
              return (
                <FePanel
                  key={notification.id}
                  interactive
                  className={`p-4 border-l-4 ${TYPE_ACCENT[notification.type] || 'border-l-border'} ${
                    !notification.isRead ? 'ring-1 ring-primary/30 bg-primary/[0.02]' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl shrink-0 select-none" aria-hidden="true">
                      {NotificationService.getTypeIcon(notification.type)}
                    </span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`font-semibold ${!notification.isRead ? 'text-foreground font-bold' : 'text-foreground/90'}`}>
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
                        )}
                        {notification.priority && (
                          <Badge variant={PRIORITY_VARIANT[notification.priority] || 'muted'}>
                            {notification.priority}
                          </Badge>
                        )}
                        {notification.contextType && (
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider py-0">
                            {notification.contextType}
                          </Badge>
                        )}
                        {isSaved && (
                          <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-[10px]">
                            <BookmarkCheck className="h-3 w-3" /> Saved
                          </Badge>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>{notification.timeAgo || 'Just now'}</span>
                        <span>•</span>
                        <span className="capitalize">{String(notification.type || '').toLowerCase()}</span>
                        {notification.savedAt && (
                          <>
                            <span>•</span>
                            <span>Saved {new Date(notification.savedAt).toLocaleDateString('en-IN')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      <Button 
                        size="sm" 
                        onClick={() => handleOpen(notification)} 
                        className="gap-1.5 text-xs font-semibold shadow-sm"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </Button>

                      <div className="flex items-center gap-1">
                        {isSaved ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveSaved(notification.id)}
                            className="h-8 px-2 text-xs text-emerald-600 hover:text-red-500"
                            title="Remove from saved"
                          >
                            <BookmarkCheck className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSave(notification)}
                            className="h-8 px-2 text-xs hover:text-emerald-600"
                            title="Save notification"
                          >
                            <Bookmark className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {notification.isRead ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkUnread(notification.id)}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                            title="Mark as unread"
                          >
                            <MailOpen className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkRead(notification.id)}
                            className="h-8 px-2 text-xs text-primary hover:bg-primary/10"
                            title="Mark as read"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismiss(notification.id)}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-red-500"
                          title="Dismiss"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </FePanel>
              );
            })}
          </div>
        )}
      </PageScaffold>

      {/* In-App Notification Preferences Modal */}
      {prefModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border bg-muted/40 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <Settings2 className="h-5 w-5 text-primary" />
                <div>
                  <h3 className="font-bold text-lg text-foreground">In-App Notification Preferences</h3>
                  <p className="text-xs text-muted-foreground">Select the events and activities you want to be notified about.</p>
                </div>
              </div>
              <button
                onClick={() => setPrefModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Check or uncheck the boxes below to control which in-app notifications you receive. Every change can be modified at any time.
              </p>

              {prefLoading || !preferences ? (
                <div className="py-12 text-center text-muted-foreground">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2"></div>
                  <p className="text-xs">Loading preferences…</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {preferences.categories?.map((cat) => (
                    <div
                      key={cat.key}
                      onClick={() => handleTogglePref(cat.key)}
                      className={cn(
                        'p-4 rounded-xl border transition cursor-pointer flex items-start gap-3.5 select-none',
                        cat.enabled
                          ? 'border-primary/40 bg-primary/[0.03] hover:border-primary'
                          : 'border-border bg-muted/20 opacity-70 hover:opacity-100'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={cat.enabled}
                        onChange={() => handleTogglePref(cat.key)}
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cat.icon}</span>
                          <span className="font-semibold text-sm text-foreground">{cat.title}</span>
                          {cat.enabled && (
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/30 py-0">Active</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {cat.description}
                        </p>
                        <div className="mt-2 p-2 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground">
                          <span className="font-medium text-foreground/80">{cat.eventsCovered}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border bg-muted/40 flex items-center justify-end gap-3 sticky bottom-0 z-10">
              <Button variant="outline" onClick={() => setPrefModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePreferences} disabled={prefSaving} className="gap-2">
                {prefSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Save Preferences
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppPage>
  );
}
