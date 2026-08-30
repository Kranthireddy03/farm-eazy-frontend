// useAuth.js
import { useState, useEffect } from 'react';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Read user info from localStorage keys used by the app
    try {
      const email = localStorage.getItem('farmEazy_email');
      const id = localStorage.getItem('farmEazy_userId');
      const username = localStorage.getItem('farmEazy_username');
      let roles = [];
      const rolesRaw = localStorage.getItem('farmEazy_roles') || localStorage.getItem('farmEazy_roles');
      if (rolesRaw) {
        try { roles = JSON.parse(rolesRaw); } catch { roles = [rolesRaw]; }
      }
      const userData = {
        id: id || null,
        email: email || null,
        username: username || null,
        roles: roles || [],
      };
      setUser(userData);
      setIsAdmin(Array.isArray(roles) && (roles.includes('ADMIN') || roles.includes('SUPERADMIN')));
    } catch (err) {
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  return { user, isAdmin };
}
