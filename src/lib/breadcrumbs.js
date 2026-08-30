const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  farms: 'Farms',
  crops: 'Crops',
  irrigation: 'Irrigation',
  'irrigation-services': 'Services',
  'irrigation-schedules': 'Schedules',
  buying: 'Marketplace',
  selling: 'Selling',
  cart: 'Cart',
  checkout: 'Checkout',
  orders: 'Orders',
  profile: 'Profile',
  settings: 'Settings',
  support: 'Support',
  activities: 'Activities',
  notifications: 'Notifications',
  'vendor-dashboard': 'Vendor',
  'service-requests': 'Service requests',
  'change-password': 'Security',
  'user-preferences': 'Preferences',
  'address-book': 'Addresses',
  blog: 'Blog',
  about: 'About',
  contact: 'Contact',
  faq: 'FAQ',
};

export function getBreadcrumbs(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  const items = [{ label: 'Home', href: '/' }];

  let path = '';
  segments.forEach((segment, index) => {
    path += `/${segment}`;
    const label =
      ROUTE_LABELS[segment] ||
      (segment.match(/^\d+$/) ? 'Details' : segment.replace(/-/g, ' '));
    items.push({
      label: label.charAt(0).toUpperCase() + label.slice(1),
      href: index === segments.length - 1 ? undefined : path,
    });
  });

  return items;
}
