import React, { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

function AdminSupportDashboard() {
  const { hasRole, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Role-based check: allow SUPERADMIN (fallback to localStorage roles)
    const allowed = hasRole ? hasRole('SUPERADMIN') : (JSON.parse(localStorage.getItem('farmEazy_roles') || '[]').includes('SUPERADMIN'));
    if (!allowed) {
      setError('Access Denied: Admins only');
      setLoading(false);
      return;
    }

    // Clear previous errors and show loading while fetching
    setError('');
    setLoading(true);

    // Correct admin API path
    apiClient.get('/admin/tickets')
      .then(res => {
        // API may return { tickets: [...], total } or directly an array
        const payload = res.data || {};
        setTickets(payload.tickets || payload);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load support tickets');
        setLoading(false);
      });
  }, [user]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;

  return (
    <div className="admin-support-dashboard">
      <h2>Admin Support Dashboard</h2>
      <ul>
        {tickets.map(ticket => (
          <li key={ticket.displayId}>
            <b>{ticket.displayId}</b> - {ticket.subject} - {ticket.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminSupportDashboard;
