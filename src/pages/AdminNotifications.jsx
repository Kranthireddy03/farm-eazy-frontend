import { useState, useEffect, useMemo } from 'react';
import { Bell, History, Send, Users } from 'lucide-react';
import AdminNotificationService from '../services/AdminNotificationService';
import AppPage from '../components/layout/AppPage';
import { PageScaffold } from '../components/app/PageScaffold';
import { KpiSection } from '../components/app/KpiSection';
import { KpiCard } from '../components/ui/kpi-card';
import { DetailPanel } from '../components/platform/DetailPanel';
import { InfoPanel } from '../components/platform/InfoPanel';
import { FePanel } from '../components/platform/FeOpsPrimitives';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/ui/empty-state';
import { PageSkeleton } from '../components/ui/Skeleton';
import { DataTable } from '../components/ui/data-table';
import { cn } from '../lib/utils';

const TAB_CHIPS = [
  { value: 'send', label: 'Send', icon: Send },
  { value: 'history', label: 'History', icon: History },
  { value: 'users', label: 'Users', icon: Users },
];

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Admin dashboard for sending and managing notifications.
 */
export default function AdminNotifications() {
  const [activeTab, setActiveTab] = useState('send');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'SYSTEM',
    priority: 'NORMAL',
    actionUrl: '',
    expiresInDays: 30,
    isBroadcast: true,
    targetUserId: '',
  });

  const [broadcasts, setBroadcasts] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalBroadcasts: 0 });

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') fetchBroadcasts();
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const data = await AdminNotificationService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const data = await AdminNotificationService.getBroadcasts();
      setBroadcasts(data || []);
    } catch (error) {
      console.error('Failed to fetch broadcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await AdminNotificationService.getUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (formData.isBroadcast) {
        await AdminNotificationService.broadcast(formData);
        setMessage({ type: 'success', text: 'Broadcast notification sent to all users.' });
      } else {
        if (!formData.targetUserId) {
          setMessage({ type: 'error', text: 'Please select a target user.' });
          return;
        }
        await AdminNotificationService.sendToUser(formData.targetUserId, formData);
        setMessage({ type: 'success', text: `Notification sent to user ${formData.targetUserId}.` });
      }

      setFormData((prev) => ({ ...prev, title: '', message: '', actionUrl: '' }));
      fetchStats();
    } catch (error) {
      console.error('Failed to send notification:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to send notification',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBroadcast = async (id) => {
    if (!window.confirm('Delete this broadcast notification?')) return;
    try {
      await AdminNotificationService.deleteNotification(id);
      setBroadcasts((prev) => prev.filter((b) => b.id !== id));
      fetchStats();
    } catch (error) {
      console.error('Failed to delete broadcast:', error);
    }
  };

  const getTypeIcon = (type) => {
    return AdminNotificationService.notificationTypes.find((t) => t.value === type)?.icon || '🔔';
  };

  const typeCount = AdminNotificationService.notificationTypes.length;

  const userColumns = useMemo(
    () => [
      { accessorKey: 'id', header: 'ID' },
      { accessorKey: 'username', header: 'Username' },
      { accessorKey: 'email', header: 'Email' },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => row.original.phone || '—',
      },
      {
        accessorKey: 'active',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.active ? 'success' : 'destructive'}>
            {row.original.active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        id: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setFormData((prev) => ({ ...prev, isBroadcast: false, targetUserId: row.original.id }));
              setActiveTab('send');
            }}
          >
            Notify
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <AppPage
      title="Notification center"
      description="Send broadcast or targeted alerts to FarmEazy users."
    >
      <div className="space-y-6">
        <KpiSection columns={3}>
          <KpiCard title="Total users" value={stats.totalUsers} hint="Reachable accounts" icon={Users} />
          <KpiCard title="Broadcasts sent" value={stats.totalBroadcasts} hint="All-time" icon={Bell} />
          <KpiCard title="Notification types" value={typeCount} hint="Categories available" />
        </KpiSection>

        <div className="flex flex-wrap gap-2">
          {TAB_CHIPS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value)}
              className={cn('ops-chip gap-1.5', activeTab === tab.value && 'ops-chip-active')}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {message && (
          <InfoPanel
            variant={message.type === 'success' ? 'success' : 'destructive'}
            title={message.type === 'success' ? 'Success' : 'Could not send'}
            description={message.text}
          />
        )}

        {activeTab === 'send' && (
          <PageScaffold
            main={
              <DetailPanel title="Send notification" description="Broadcast to everyone or target one user.">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="isBroadcast"
                        checked={formData.isBroadcast}
                        onChange={() => setFormData((prev) => ({ ...prev, isBroadcast: true }))}
                        className="h-4 w-4 text-primary"
                      />
                      Broadcast to all users
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="isBroadcast"
                        checked={!formData.isBroadcast}
                        onChange={() => setFormData((prev) => ({ ...prev, isBroadcast: false }))}
                        className="h-4 w-4 text-primary"
                      />
                      Send to specific user
                    </label>
                  </div>

                  {!formData.isBroadcast && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Target user</label>
                      <select
                        name="targetUserId"
                        value={formData.targetUserId}
                        onChange={handleInputChange}
                        className={selectClass}
                      >
                        <option value="">Select a user…</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.username} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Title *</label>
                    <Input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      maxLength={100}
                      placeholder="Notification title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      maxLength={500}
                      rows={4}
                      placeholder="Notification message"
                      className={cn(selectClass, 'min-h-[100px] py-2 resize-none')}
                    />
                    <div className="text-xs mt-1 text-muted-foreground">{formData.message.length}/500</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select name="type" value={formData.type} onChange={handleInputChange} className={selectClass}>
                        {AdminNotificationService.notificationTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Priority</label>
                      <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleInputChange}
                        className={selectClass}
                      >
                        {AdminNotificationService.priorityOptions.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Action URL (optional)</label>
                    <Input
                      type="text"
                      name="actionUrl"
                      value={formData.actionUrl}
                      onChange={handleInputChange}
                      placeholder="/dashboard or https://example.com"
                    />
                  </div>

                  {formData.isBroadcast && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Expires in (days)</label>
                      <Input
                        type="number"
                        name="expiresInDays"
                        value={formData.expiresInDays}
                        onChange={handleInputChange}
                        min={1}
                        max={365}
                        className="w-32"
                      />
                    </div>
                  )}

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Sending…' : formData.isBroadcast ? 'Send broadcast' : 'Send to user'}
                  </Button>
                </form>
              </DetailPanel>
            }
            aside={
              <InfoPanel
                title="Delivery tips"
                description="Keep titles under 60 characters. Use action URLs for deep links into orders, farms, or settings."
              />
            }
          />
        )}

        {activeTab === 'history' && (
          <DetailPanel title="Broadcast history" description="Previously sent broadcast notifications.">
            {loading ? (
              <PageSkeleton variant="cards" className="mt-4" />
            ) : broadcasts.length === 0 ? (
              <EmptyState icon={History} title="No broadcasts yet" description="Sent broadcasts will appear here." />
            ) : (
              <div className="space-y-3">
                {broadcasts.map((broadcast) => (
                  <FePanel key={broadcast.id} className="flex items-start gap-4 p-4">
                    <span className="text-2xl shrink-0">{getTypeIcon(broadcast.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground">{broadcast.title}</div>
                      <div className="text-sm mt-1 text-muted-foreground">{broadcast.message}</div>
                      <div className="text-xs mt-2 text-muted-foreground">{broadcast.timeAgo}</div>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteBroadcast(broadcast.id)}
                    >
                      Delete
                    </Button>
                  </FePanel>
                ))}
              </div>
            )}
          </DetailPanel>
        )}

        {activeTab === 'users' && (
          <DetailPanel title="User directory" description="Select a user to send a targeted notification.">
            {loading ? (
              <PageSkeleton variant="table" />
            ) : (
              <DataTable
                columns={userColumns}
                data={users}
                emptyTitle="No users found"
                searchPlaceholder="Search users…"
              />
            )}
          </DetailPanel>
        )}
      </div>
    </AppPage>
  );
}
