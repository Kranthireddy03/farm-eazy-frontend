import React, { useEffect, useState } from 'react';
import { getAdminUsers, assignRoleByEmail, manageUserRoleById, getRolesById, getRolesByEmail } from '../../services/AdminUserService';
import { useAuth } from '../../hooks/useAuth';

export default function RoleManagement() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [roleInput, setRoleInput] = useState('ADMIN');
  // Role lookup state
  const [lookupId, setLookupId] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupRoles, setLookupRoles] = useState([]);
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    getAdminUsers()
      .then(data => setUsers(data || []))
      .catch(() => setError('Failed to fetch users'))
      .finally(() => setLoading(false));
  }, [isAdmin]);

  const handleAssign = async (email) => {
    setLoading(true);
    try {
      await assignRoleByEmail(email, roleInput);
      // refresh list
      const updated = await getAdminUsers();
      setUsers(updated || []);
    } catch (e) {
      setError('Failed to assign role');
    } finally { setLoading(false); }
  };

  const handleRoleLookupById = async () => {
    setLookupError('');
    try {
      const roles = await getRolesById(lookupId);
      setLookupRoles(roles);
    } catch (e) {
      setLookupRoles([]);
      setLookupError('User not found or error');
    }
  };

  const handleRoleLookupByEmail = async () => {
    setLookupError('');
    try {
      const roles = await getRolesByEmail(lookupEmail);
      setLookupRoles(roles);
    } catch (e) {
      setLookupRoles([]);
      setLookupError('User not found or error');
    }
  };

  const handleRemove = async (userId, role) => {
    setLoading(true);
    try {
      await manageUserRoleById(userId, role, false);
      const updated = await getAdminUsers();
      setUsers(updated || []);
    } catch (e) {
      setError('Failed to remove role');
    } finally { setLoading(false); }
  };

  if (!isAdmin) return <div className="text-center p-8 text-red-600">Access denied</div>;
  if (loading) return <div className="p-8 text-center">Loading users...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Role Management</h2>
        <div className="flex items-center gap-2">
          <select value={roleInput} onChange={e => setRoleInput(e.target.value)} className="select select-sm">
            <option value="ADMIN">ADMIN</option>
            <option value="SUPERADMIN">SUPERADMIN</option>
            <option value="USER">USER</option>
          </select>
          <div className="text-sm text-muted">Assign selected role by email</div>
        </div>
      </div>

      {/* Role Lookup Panel */}
      <div className="mb-6 p-4 bg-gray-100 rounded shadow">
        <h3 className="text-lg font-semibold mb-2">Role Lookup</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="User ID"
            value={lookupId}
            onChange={e => setLookupId(e.target.value)}
            className="input input-sm"
          />
          <button className="btn btn-sm btn-info" onClick={handleRoleLookupById}>Lookup by ID</button>
          <input
            type="text"
            placeholder="Email"
            value={lookupEmail}
            onChange={e => setLookupEmail(e.target.value)}
            className="input input-sm"
          />
          <button className="btn btn-sm btn-info" onClick={handleRoleLookupByEmail}>Lookup by Email</button>
        </div>
        {lookupError && <div className="text-red-600 mb-2">{lookupError}</div>}
        {lookupRoles.length > 0 && (
          <div className="text-green-700">Roles: {lookupRoles.join(', ')}</div>
        )}
      </div>

      {error && <div className="mb-4 text-red-600">{error}</div>}

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, idx) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-3">{idx+1}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.username}</td>
                <td className="px-4 py-3">{u.phone || '-'}
                </td>
                <td className="px-4 py-3">{u.active ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <button className="btn btn-sm btn-primary mr-2" onClick={() => handleAssign(u.email)}>Assign {roleInput}</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => handleRemove(u.id, 'ADMIN')}>Remove ADMIN</button>
                  <button className="btn btn-sm btn-ghost ml-2" onClick={() => handleRemove(u.id, 'SUPERADMIN')}>Remove SUPERADMIN</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
