import React, { useState, useEffect } from 'react';
import AdminNotificationService from '../services/AdminNotificationService';
import { useTheme } from '../context/ThemeContext';
// ...existing code...

/**
 * ADMIN NOTIFICATIONS PAGE
 * 
 * Admin dashboard for sending and managing notifications.
 * Features:
 * - Send broadcast notifications to all users
 * - Send targeted notifications to specific users
 * - View sent broadcast history
 */
export default function AdminNotifications() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('send'); // send, history, users
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Send form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'SYSTEM',
    priority: 'NORMAL',
    actionUrl: '',
    expiresInDays: 30,
    isBroadcast: true,
    targetUserId: ''
  });

  // Data state  
  const [broadcasts, setBroadcasts] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalBroadcasts: 0 });

  useEffect(() => {
    fetchStats();
    if (activeTab === 'history') fetchBroadcasts();
    if (activeTab === 'users') fetchUsers();
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (formData.isBroadcast) {
        await AdminNotificationService.broadcast(formData);
        setMessage({ type: 'success', text: 'Broadcast notification sent to all users!' });
      } else {
        if (!formData.targetUserId) {
          setMessage({ type: 'error', text: 'Please select a target user' });
          return;
        }
        await AdminNotificationService.sendToUser(formData.targetUserId, formData);
        setMessage({ type: 'success', text: `Notification sent to user ${formData.targetUserId}!` });
      }
      
      // Reset form
      setFormData(prev => ({ ...prev, title: '', message: '', actionUrl: '' }));
      fetchStats();
    } catch (error) {
      console.error('Failed to send notification:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to send notification' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBroadcast = async (id) => {
    if (!window.confirm('Delete this broadcast notification?')) return;
    try {
      await AdminNotificationService.deleteNotification(id);
      setBroadcasts(prev => prev.filter(b => b.id !== id));
      fetchStats();
    } catch (error) {
      console.error('Failed to delete broadcast:', error);
    }
  };

  const getTypeIcon = (type) => {
    return AdminNotificationService.notificationTypes.find(t => t.value === type)?.icon || '🔔';
  };

  const surfaceClass = isDark
    ? 'bg-muted border-border'
    : 'bg-background border-border shadow-sm';

  const fieldClass = isDark
    ? 'w-full bg-muted border border-border text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 placeholder:text-muted-foreground'
    : 'w-full bg-background border border-border text-foreground rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 placeholder:text-muted-foreground';

  const labelClass = isDark ? 'block text-muted-foreground mb-1 text-sm font-medium' : 'block text-foreground mb-1 text-sm font-medium';

  const mutedTextClass = isDark ? 'text-muted-foreground' : 'text-muted-foreground';

  return (
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
            ⚡ Admin - Notification Center
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4">
            <div className="text-4xl font-bold text-white">{stats.totalUsers}</div>
            <div className="text-blue-200 text-sm">Total Users</div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4">
            <div className="text-4xl font-bold text-white">{stats.totalBroadcasts}</div>
            <div className="text-purple-200 text-sm">Broadcasts Sent</div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-4">
            <div className="text-4xl font-bold text-white">8</div>
            <div className="text-green-200 text-sm">Notification Types</div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex gap-2 mb-6 border-b pb-2 ${isDark ? 'border-border' : 'border-border'}`}>
          {['send', 'history', 'users'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white' 
                  : (isDark ? 'bg-muted text-muted-foreground hover:bg-muted' : 'bg-muted text-foreground hover:bg-muted')
              }`}
            >
              {tab === 'send' && '📤 Send'}
              {tab === 'history' && '📜 History'}
              {tab === 'users' && '👥 Users'}
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success'
              ? (isDark ? 'bg-green-900/50 border border-green-500 text-green-200' : 'bg-green-50 border border-green-300 text-green-800')
              : (isDark ? 'bg-red-900/50 border border-red-500 text-red-200' : 'bg-red-50 border border-red-300 text-red-800')
          }`}>
            {message.text}
          </div>
        )}

        {/* Send Tab */}
        {activeTab === 'send' && (
          <div className={`rounded-xl p-6 border ${surfaceClass}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-foreground'}`}>📤 Send Notification</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Broadcast Toggle */}
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isBroadcast"
                    checked={formData.isBroadcast}
                    onChange={() => setFormData(prev => ({ ...prev, isBroadcast: true }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className={isDark ? 'text-foreground' : 'text-foreground'}>📢 Broadcast to All Users</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="isBroadcast"
                    checked={!formData.isBroadcast}
                    onChange={() => setFormData(prev => ({ ...prev, isBroadcast: false }))}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className={isDark ? 'text-foreground' : 'text-foreground'}>👤 Send to Specific User</span>
                </label>
              </div>

              {/* Target User (if not broadcast) */}
              {!formData.isBroadcast && (
                <div>
                  <label className={labelClass}>Target User</label>
                  <select
                    name="targetUserId"
                    value={formData.targetUserId}
                    onChange={handleInputChange}
                    className={fieldClass}
                  >
                    <option value="">Select a user...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title */}
              <div>
                <label className={labelClass}>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={100}
                  placeholder="Notification title"
                  className={fieldClass}
                />
              </div>

              {/* Message */}
              <div>
                <label className={labelClass}>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  maxLength={500}
                  rows={4}
                  placeholder="Notification message"
                  className={fieldClass}
                />
                <div className={`text-xs mt-1 ${mutedTextClass}`}>{formData.message.length}/500</div>
              </div>

              {/* Type and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className={fieldClass}
                  >
                    {AdminNotificationService.notificationTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Priority</label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className={fieldClass}
                  >
                    {AdminNotificationService.priorityOptions.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action URL */}
              <div>
                <label className={labelClass}>Action URL (optional)</label>
                <input
                  type="text"
                  name="actionUrl"
                  value={formData.actionUrl}
                  onChange={handleInputChange}
                  placeholder="/dashboard or https://example.com"
                  className={fieldClass}
                />
              </div>

              {/* Expires In Days */}
              {formData.isBroadcast && (
                <div>
                  <label className={labelClass}>Expires in (days)</label>
                  <input
                    type="number"
                    name="expiresInDays"
                    value={formData.expiresInDays}
                    onChange={handleInputChange}
                    min={1}
                    max={365}
                    className={`${fieldClass} w-32`}
                  />
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    {formData.isBroadcast ? '📢 Send Broadcast' : '👤 Send to User'}
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className={`rounded-xl p-6 border ${surfaceClass}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-foreground'}`}>📜 Broadcast History</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-border border-t-blue-500 rounded-full"></div>
              </div>
            ) : broadcasts.length === 0 ? (
              <div className={`text-center py-12 ${mutedTextClass}`}>
                <span className="text-4xl block mb-2">📭</span>
                No broadcasts sent yet
              </div>
            ) : (
              <div className="space-y-3">
                {broadcasts.map(broadcast => (
                  <div 
                    key={broadcast.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${isDark ? 'bg-muted/50 border-border' : 'bg-muted/30 border-border'}`}
                  >
                    <span className="text-2xl">{getTypeIcon(broadcast.type)}</span>
                    <div className="flex-1">
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-foreground'}`}>{broadcast.title}</div>
                      <div className={`text-sm mt-1 ${mutedTextClass}`}>{broadcast.message}</div>
                      <div className={`text-xs mt-2 ${isDark ? 'text-muted-foreground' : 'text-muted-foreground'}`}>{broadcast.timeAgo}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteBroadcast(broadcast.id)}
                      className="px-3 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className={`rounded-xl p-6 border ${surfaceClass}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-foreground'}`}>👥 User List</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-border border-t-blue-500 rounded-full"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-left border-b ${isDark ? 'text-muted-foreground border-border' : 'text-muted-foreground border-border'}`}>
                      <th className="pb-3">ID</th>
                      <th className="pb-3">Username</th>
                      <th className="pb-3">Email</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className={`border-b ${isDark ? 'border-border/50' : 'border-border'} ${isDark ? 'hover:bg-muted/20' : 'hover:bg-muted/30'} transition-colors`}>
                        <td className={`py-3 ${mutedTextClass}`}>{user.id}</td>
                        <td className={`py-3 font-medium ${isDark ? 'text-white' : 'text-foreground'}`}>{user.username}</td>
                        <td className={`py-3 ${mutedTextClass}`}>{user.email}</td>
                        <td className={`py-3 ${mutedTextClass}`}>{user.phone || '-'}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.active
                              ? (isDark ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700')
                              : (isDark ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700')
                          }`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => {
                              setFormData(prev => ({ ...prev, isBroadcast: false, targetUserId: user.id }));
                              setActiveTab('send');
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors text-sm"
                          >
                            Send Notification
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
  );
}
