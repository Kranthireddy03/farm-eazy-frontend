/** Shared navigation & command palette definitions — single source of truth. */

export const PUBLIC_NAV = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/coverage', label: 'Coverage' },
  { to: '/public-services', label: 'Platform' },
  { to: '/blog', label: 'Blog' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

export const APP_NAV = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/farms', label: 'Farms', icon: '🌾' },
  { to: '/crops', label: 'Crops', icon: '🌱' },
  { to: '/irrigation', label: 'Irrigation', icon: '💧' },
  { to: '/services', label: 'Services', icon: '🛠️' },
  { to: '/products', label: 'Products', icon: '🛒' },
  { to: '/support', label: 'Support', icon: '💬' },
  { to: '/vendor-dashboard', label: 'Vendor', icon: '🏪', authOnly: true },
];

export function buildCommandItems({ navigate, isAuthenticated, isAdmin, openSupportPortal }) {
  const nav = isAuthenticated ? APP_NAV : PUBLIC_NAV;
  const pages = nav.map((item) => ({
    id: `nav-${item.to}`,
    label: item.label,
    group: 'Navigate',
    icon: item.icon || '🧭',
    action: () => navigate(item.to),
  }));

  const actions = [
    {
      id: 'cmd-search',
      label: 'Global search',
      group: 'Actions',
      icon: '🔍',
      hint: 'Filter pages & actions',
      action: () => {},
    },
    {
      id: 'theme-toggle',
      label: 'Toggle light / dark theme',
      group: 'Actions',
      icon: '🌙',
      action: () => window.dispatchEvent(new CustomEvent('farmeazy:toggle-theme')),
    },
  ];

  if (isAuthenticated) {
    actions.push(
      { id: 'cart', label: 'Open cart', group: 'Actions', icon: '🛒', action: () => navigate('/cart') },
      { id: 'wishlist', label: 'Saved products', group: 'Actions', icon: '❤️', action: () => navigate('/wishlist') },
      { id: 'orders', label: 'Orders', group: 'Actions', icon: '📦', action: () => navigate('/orders') },
      { id: 'settings', label: 'Settings', group: 'Actions', icon: '⚙️', action: () => navigate('/settings') },
      { id: 'notifications', label: 'Notifications', group: 'Actions', icon: '🔔', action: () => navigate('/notifications') },
      { id: 'activities', label: 'Activity timeline', group: 'Actions', icon: '📋', action: () => navigate('/activities') },
    );
    if (isAdmin?.()) {
      actions.push(
        { id: 'admin-notifications', label: 'Admin notifications', group: 'Admin', icon: '📢', action: () => navigate('/admin/notifications') },
        { id: 'admin-blog', label: 'Blog management', group: 'Admin', icon: '📝', action: () => navigate('/admin/blog-posts') },
      );
      if (openSupportPortal) {
        actions.push({
          id: 'access-control',
          label: 'Access control (portal)',
          group: 'Admin',
          icon: '🛡️',
          action: () => openSupportPortal('/access-control', 'admin'),
        });
      }
    }
  } else {
    actions.push(
      { id: 'login', label: 'Sign in', group: 'Account', icon: '🔑', action: () => navigate('/login') },
      { id: 'register', label: 'Create account', group: 'Account', icon: '✨', action: () => navigate('/register') },
    );
  }

  return [...pages, ...actions];
}
