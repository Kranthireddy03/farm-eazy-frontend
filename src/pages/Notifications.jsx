import { useState, useEffect } from 'react';
import { Bell, Mail, MailOpen, Bookmark, BookmarkCheck, RefreshCw, ExternalLink, Trash2 } from 'lucide-react';
import AppPage from '../components/layout/AppPage';
import { PageScaffold } from '../components/app/PageScaffold';
import { KpiSection } from '../components/app/KpiSection';
import { KpiCard } from '../components/ui/kpi-card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { EmptyState } from '../components/ui/empty-state';
import { PageSkeleton } from '../components/ui/Skeleton';
import { InfoPanel } from '../components/platform/InfoPanel';
import { FePanel } from '../components/platform/FeOpsPrimitives';
import NotificationService from '../services/NotificationService';
import { toast } from 'sonner';

const SAVED_KEY = 'farmeazy_saved_notifications';

const FILTER_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
  { value: 'saved', label: 'Saved' },
];

const TYPE_ACCENT = {
  ORDER: 'border-l-blue-500',
  PAYMENT: 'border-l-primary',
  FARM: 'border-l-amber-500',
  IRRIGATION: 'border-l-cyan-500',
  PRODUCT: 'border-l-violet-500',
  SERVICE: 'border-l-teal-500',
  ACCOUNT: 'border-l-border',
  SYSTEM: 'border-l-orange-500',
  PROMO: 'border-l-pink-500',
};

const PRIORITY_VARIANT = {
  URGENT: 'destructive',
  HIGH: 'warning',
  NORMAL: 'muted',
  LOW: 'outline',
};

function readSaved() {
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
    case 'ORDER':
    case 'PAYMENT': return '/products/orders';
    case 'FARM': return '/farms';
    case 'IRRIGATION': return '/irrigation';
    case 'SERVICE': return '/services';
    case 'SUPPORT': return '/support';
    default: return '/notifications';
  }
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [savedNotifications, setSavedNotifications] = useState(readSaved);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await NotificationService.getAll();
      setNotifications(data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const persistSaved = (next) => {
    setSavedNotifications(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  const handleSave = (notification) => {
    const exists = savedNotifications.some((n) => String(n.id) === String(notification.id));
    if (exists) {
      toast.info('Already saved');
      return;
    }
    const snapshot = { ...notification, savedAt: new Date().toISOString() };
    persistSaved([snapshot, ...savedNotifications]);
    toast.success('Notification saved permanently');
  };

  const handleRemoveSaved = (id) => {
    persistSaved(savedNotifications.filter((n) => String(n.id) !== String(id)));
    toast.success('Removed from saved');
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

  const handleDismiss = async (id) => {
    try {
      await NotificationService.dismiss(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new Event('notifications-changed'));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('notifications-changed'));
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
    navigate(notification.actionUrl || defaultLinkFor(notification));
  };

  const savedIds = new Set(savedNotifications.map((n) => String(n.id)));
  const showSavedTab = filter === 'saved';
  const filteredNotifications = showSavedTab
    ? savedNotifications
    : notifications.filter((n) => {
        if (filter === 'unread') return !n.isRead;
        if (filter === 'read') return n.isRead;
        return true;
      });

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const readCount = notifications.filter((n) => n.isRead).length;

  return (
    <AppPage
      title="Notifications"
      description="Orders, bookings, farm alerts, and account updates in one place."
      actions={
        <>
          <Button variant="outline" size="sm" onClick={fetchNotifications} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </>
      }
    >
      <KpiSection>
        <KpiCard title="Total" value={notifications.length} hint="Session notifications" icon={Bell} />
        <KpiCard title="Unread" value={unreadCount} hint="Needs attention" icon={Mail} />
        <KpiCard title="Saved" value={savedNotifications.length} hint="Saved permanently" icon={Bookmark} />
      </KpiSection>

      <PageScaffold
        aside={
          <InfoPanel
            title="Notification policy"
            description="How your notifications are kept."
          >
            <p className="text-sm text-muted-foreground mt-2 space-y-2">
              <span className="block">• Notifications in this session are cleared from the header bell once you view them.</span>
              <span className="block">• Everything is flushed out on logout — only items you tap <b>Save</b> stay.</span>
              <span className="block">• Saved notifications are kept in the <b>Saved</b> tab until you delete them.</span>
              <span className="block">• Tap <b>Open</b> on any notification to go straight to the linked product, service, order, or ticket.</span>
            </p>
          </InfoPanel>
        }
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              className={cn('ops-chip', filter === chip.value && 'ops-chip-active')}
              onClick={() => setFilter(chip.value)}
            >
              {chip.label}
              {chip.value === 'saved' && savedNotifications.length > 0 && (
                <span className="ml-1 text-[10px] font-bold">({savedNotifications.length})</span>
              )}
            </button>
          ))}
        </div>

        {loading && !showSavedTab ? (
          <PageSkeleton variant="cards" />
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={showSavedTab ? Bookmark : Bell}
            title={showSavedTab ? 'No saved notifications' : 'No notifications'}
            description={
              showSavedTab
                ? 'Save important notifications from the list above — they stay here until you delete them.'
                : filter === 'all'
                  ? 'You are all caught up. New alerts will appear here.'
                  : 'No notifications match this filter.'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <FePanel
                key={notification.id}
                interactive
                className={`p-4 border-l-4 ${TYPE_ACCENT[notification.type] || 'border-l-border'} ${
                  !notification.isRead ? 'ring-1 ring-primary/20' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl shrink-0" aria-hidden="true">
                    {NotificationService.getTypeIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">{notification.title}</span>
                      {!notification.isRead && !showSavedTab && (
                        <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
                      )}
                      {notification.priority && (
                        <Badge variant={PRIORITY_VARIANT[notification.priority] || 'muted'}>
                          {notification.priority}
                        </Badge>
                      )}
                      {notification.isBroadcast && (
                        <Badge variant="outline">Broadcast</Badge>
                      )}
                      {showSavedTab && (
                        <Badge variant="outline" className="gap-1">
                          <BookmarkCheck className="h-3 w-3" /> Saved
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>{notification.timeAgo}</span>
                      <span>•</span>
                      <span>{notification.type}</span>
                      {showSavedTab && notification.savedAt && (
                        <>
                          <span>•</span>
                          <span>Saved {new Date(notification.savedAt).toLocaleString('en-IN')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button size="sm" onClick={() => handleOpen(notification)} className="gap-1">
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </Button>
                    {showSavedTab ? (
                      <Button size="sm" variant="destructive" onClick={() => handleRemoveSaved(notification.id)} className="gap-1">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    ) : (
                      <>
                        {!savedIds.has(String(notification.id)) && (
                          <Button size="sm" variant="outline" onClick={() => handleSave(notification)} className="gap-1">
                            <Bookmark className="h-3.5 w-3.5" /> Save
                          </Button>
                        )}
                        {!notification.isRead && (
                          <Button size="sm" variant="secondary" onClick={() => handleMarkRead(notification.id)}>
                            Mark read
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDismiss(notification.id)}>
                          Dismiss
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </FePanel>
            ))}
          </div>
        )}
      </PageScaffold>
    </AppPage>
  );
}
