import {
  LuLayoutDashboard, LuCalendarPlus, LuClipboardList, LuStore, LuTag, LuWallet, LuBell, LuUser, LuCircleHelp,
  LuTruck, LuCalendarCheck, LuGauge, LuUsers, LuMap, LuChartColumn, LuStar, LuHandCoins, LuPackage, LuHouse,
} from 'react-icons/lu';

// One navigation model per role: grouped for the sidebar, with the key items repeated as mobile tabs
export const NAV = {
  user: {
    label: 'Customer',
    base: '/app',
    quick: { to: '/app/schedule', label: 'Book pickup', icon: LuCalendarPlus },
    groups: [
      { title: 'Overview', items: [
        { to: '/app', label: 'Dashboard', icon: LuLayoutDashboard, end: true, keywords: 'home impact summary' },
      ] },
      { title: 'Pickups', items: [
        { to: '/app/schedule', label: 'Book a pickup', icon: LuCalendarPlus, keywords: 'schedule new collect scrap' },
        { to: '/app/pickups', label: 'My pickups', icon: LuClipboardList, keywords: 'history track status invoice rate' },
      ] },
      { title: 'Marketplace', items: [
        { to: '/app/marketplace', label: 'Browse items', icon: LuStore, keywords: 'buy shop second hand' },
        { to: '/app/market', label: 'My listings & orders', icon: LuPackage, keywords: 'sell offers purchases' },
      ] },
      { title: 'Money', items: [
        { to: '/app/earnings', label: 'Earnings', icon: LuWallet, keywords: 'payments transactions income' },
        { to: '/app/prices', label: 'Price guide', icon: LuTag, keywords: 'rates estimate calculator value' },
      ] },
      { title: 'Account', items: [
        { to: '/app/notifications', label: 'Notifications', icon: LuBell, keywords: 'alerts messages' },
        { to: '/app/profile', label: 'Profile & settings', icon: LuUser, keywords: 'account password address' },
        { to: '/app/help', label: 'Help & FAQ', icon: LuCircleHelp, keywords: 'support contact questions' },
      ] },
    ],
    tabs: ['/app', '/app/pickups', '/app/schedule', '/app/marketplace', '/app/profile'],
  },
  driver: {
    label: 'Driver',
    base: '/driver',
    quick: { to: '/driver/pickups', label: 'My route', icon: LuTruck },
    groups: [
      { title: 'Work', items: [
        { to: '/driver', label: 'Today', icon: LuLayoutDashboard, end: true, keywords: 'dashboard map route start' },
        { to: '/driver/pickups', label: 'My pickups', icon: LuClipboardList, keywords: 'assignments history complete cancel' },
      ] },
      { title: 'Me', items: [
        { to: '/driver/availability', label: 'Availability & leave', icon: LuCalendarCheck, keywords: 'attendance check in out time off' },
        { to: '/driver/performance', label: 'Performance', icon: LuGauge, keywords: 'ratings reviews stats' },
        { to: '/driver/prices', label: 'Price guide', icon: LuTag, keywords: 'rates per kg' },
      ] },
      { title: 'Account', items: [
        { to: '/driver/notifications', label: 'Notifications', icon: LuBell, keywords: 'alerts' },
        { to: '/driver/profile', label: 'Profile', icon: LuUser, keywords: 'account vehicle password' },
        { to: '/driver/help', label: 'Help', icon: LuCircleHelp, keywords: 'support' },
      ] },
    ],
    tabs: ['/driver', '/driver/pickups', '/driver/availability', '/driver/performance', '/driver/profile'],
  },
  admin: {
    label: 'Admin',
    base: '/admin',
    quick: { to: '/admin/pickups?status=pending', label: 'Assign pickups', icon: LuClipboardList },
    groups: [
      { title: 'Overview', items: [
        { to: '/admin', label: 'Dashboard', icon: LuLayoutDashboard, end: true, keywords: 'home kpi analytics' },
      ] },
      { title: 'Operations', items: [
        { to: '/admin/pickups', label: 'Pickups', icon: LuClipboardList, keywords: 'assign dispatch status manage' },
        { to: '/admin/dispatch', label: 'Dispatch map', icon: LuMap, keywords: 'route optimise drivers locations' },
        { to: '/admin/staff', label: 'Staff & drivers', icon: LuTruck, keywords: 'employees attendance leave performance' },
        { to: '/admin/customers', label: 'Customers', icon: LuUsers, keywords: 'users accounts' },
      ] },
      { title: 'Commerce', items: [
        { to: '/admin/marketplace', label: 'Marketplace', icon: LuStore, keywords: 'listings moderate approve' },
        { to: '/admin/finance', label: 'Finance', icon: LuChartColumn, keywords: 'revenue transactions reports export' },
        { to: '/admin/pricing', label: 'Pricing', icon: LuHandCoins, keywords: 'rates per kg materials' },
      ] },
      { title: 'Quality', items: [
        { to: '/admin/reviews', label: 'Reviews', icon: LuStar, keywords: 'ratings feedback flag' },
      ] },
      { title: 'Account', items: [
        { to: '/admin/notifications', label: 'Notifications', icon: LuBell, keywords: 'alerts' },
        { to: '/admin/profile', label: 'Profile', icon: LuUser, keywords: 'account password' },
      ] },
    ],
    tabs: ['/admin', '/admin/pickups', '/admin/staff', '/admin/finance', '/admin/marketplace'],
  },
};

export const flatNav = (role) => NAV[role].groups.flatMap((g) => g.items.map((i) => ({ ...i, group: g.title })));

export const PUBLIC_LINKS = [
  { to: '/#how', label: 'How it works' },
  { to: '/prices', label: 'Prices' },
  { to: '/marketplace', label: 'Marketplace' },
  { to: '/about', label: 'About' },
  { to: '/help', label: 'Help' },
];

export { LuHouse };
