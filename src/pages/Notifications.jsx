import { useState, useEffect } from 'react';
import { Bell, Mail, MailOpen, RefreshCw } from 'lucide-react';
import AppPage from '../components/layout/AppPage';
import { PageScaffold } from '../components/app/PageScaffold';
import { KpiSection } from '../components/app/KpiSection';
import { KpiCard } from '../components/ui/kpi-card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { EmptyState } from '../components/ui/empty-state';
import { PageSkeleton } from '../components/ui/Skeleton';
import { InfoPanel } from '../components/platform/InfoPanel';
import { FePanel } from '../components/platform/FeOpsPrimitives';
import NotificationService from '../services/NotificationService';

const FILTER_CHIPS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

const TYPE_ACCENT = {
  ORDER: 'border-l-blue-500',
  PAYMENT: 'border-l-primary',
  FARM: 'border-l-amber-500',
  IRRIGATION: 'border-l-cyan-500',
  PRODUCT: 'border-l-violet-500',
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

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);

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

  const handleView = async (notification) => {
    try {
      if (!notification.isRead) {
        await NotificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
        );
      }
      window.dispatchEvent(new Event('notifications-changed'));
      setSelectedNotification(notification);
    } catch (error) {
      console.error('Failed to open notification:', error);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
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
        <KpiCard title="Total" value={notifications.length} hint="All notifications" icon={Bell} />
        <KpiCard title="Unread" value={unreadCount} hint="Needs attention" icon={Mail} />
        <KpiCard title="Read" value={readCount} hint="Archived in feed" icon={MailOpen} />
      </KpiSection>

      <PageScaffold
        aside={
          <InfoPanel
            title="Alert preferences"
            description="Tune how you receive order and farm updates."
          >
            <p className="text-sm text-muted-foreground mt-2">
              Visit communication preferences to control SMS, email, and in-app channels for each category.
            </p>
            <Link
              to="/communication-preferences"
              className="mt-4 inline-flex h-8 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent"
            >
              Open preferences
            </Link>
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
            </button>
          ))}
        </div>

        {loading ? (
          <PageSkeleton variant="cards" />
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description={
              filter === 'all'
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
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />
                      )}
                      <Badge variant={PRIORITY_VARIANT[notification.priority] || 'muted'}>
                        {notification.priority}
                      </Badge>
                      {notification.isBroadcast && (
                        <Badge variant="outline">Broadcast</Badge>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>{notification.timeAgo}</span>
                      <span>•</span>
                      <span>{notification.type}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {!notification.isRead && (
                      <Button size="sm" variant="secondary" onClick={() => handleMarkRead(notification.id)}>
                        Mark read
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleView(notification)}>
                      View
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDismiss(notification.id)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </FePanel>
            ))}
          </div>
        )}
      </PageScaffold>

      {selectedNotification && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
        >
          <FePanel className="w-full max-w-xl p-0 overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Notification details</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedNotification(null)}>
                Close
              </Button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold">{selectedNotification.title}</span>
                <Badge variant={PRIORITY_VARIANT[selectedNotification.priority] || 'muted'}>
                  {selectedNotification.priority}
                </Badge>
                <Badge variant="outline">{selectedNotification.type}</Badge>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {selectedNotification.message}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Received: {selectedNotification.timeAgo || 'just now'}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-end">
              <Button onClick={() => setSelectedNotification(null)}>OK</Button>
            </div>
          </FePanel>
        </div>
      )}
    </AppPage>
  );
}
