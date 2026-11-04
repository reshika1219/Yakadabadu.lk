// MVP shortcut: one-click logins for the seeded demo accounts (hide with VITE_DEMO_LOGIN=false)
export const SHOW_DEMO = import.meta.env.VITE_DEMO_LOGIN !== 'false';
export const DEMO_PASSWORD = 'Demo@1234';

export const DEMO_ACCOUNTS = [
  { key: 'customer', label: 'Customer', hint: 'Book, track, sell', kind: 'customer', email: 'customer@demo.lk' },
  { key: 'driver', label: 'Driver', hint: 'Route & pickups', kind: 'staff', email: 'driver@demo.lk' },
  { key: 'admin', label: 'Admin', hint: 'Run the platform', kind: 'staff', email: 'admin@demo.lk' },
];
