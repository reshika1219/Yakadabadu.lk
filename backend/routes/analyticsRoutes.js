import express from 'express';
import Pickup from '../models/Pickup.js';
import User from '../models/User.js';
import Driver from '../models/Driver.js';
import Listing from '../models/Listing.js';
import Leave from '../models/Leave.js';
import { protect, adminOnly, staffOnly, customerOnly } from '../middleware/authMiddleware.js';
import { MATERIALS } from '../utils/pricing.js';
import { wrap } from '../utils/http.js';

const router = express.Router();
router.use(protect);

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const lastDays = (n) => Array.from({ length: n }, (_, i) => dayKey(Date.now() - (n - 1 - i) * 864e5));
const monthsBack = (n) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - (n - 1 - i)); return d.toISOString().slice(0, 7); });
// Rough figures for the impact panel; shown to users as estimates
const CO2_PER_KG = 1.5;
const KG_CO2_PER_TREE = 21;

router.get('/admin', adminOnly, wrap(async (_req, res) => {
  const pickups = await Pickup.find().populate('driver', 'firstName lastName').sort({ updatedAt: -1 });
  const count = (s) => pickups.filter((p) => p.status === s).length;
  const rated = pickups.filter((p) => p.rating?.stars);
  const days = lastDays(14);
  const perDay = Object.fromEntries(days.map((d) => [d, { date: d, booked: 0, completed: 0 }]));
  pickups.forEach((p) => {
    const d = dayKey(p.scheduledTime);
    if (perDay[d]) { perDay[d].booked += 1; if (p.status === 'completed') perDay[d].completed += 1; }
  });
  const kg = {}; const areas = {};
  pickups.filter((p) => p.status === 'completed').forEach((p) => {
    kg[p.pickupType] = (kg[p.pickupType] || 0) + (p.weight || 0);
    const area = p.address.split(',').pop().trim();
    areas[area] = (areas[area] || 0) + (p.weight || 0);
  });
  res.json({
    kpis: {
      pickups: pickups.length, pending: count('pending'), active: count('assigned') + count('on-the-way'),
      completed: count('completed'), cancelled: count('cancelled'),
      kg: Math.round(pickups.reduce((s, p) => s + (p.weight || 0), 0)),
      customers: await User.countDocuments(), drivers: await Driver.countDocuments({ role: 'driver' }),
      driversAvailable: await Driver.countDocuments({ role: 'driver', status: 'available' }),
      listingsLive: await Listing.countDocuments({ status: 'approved' }), listingsPending: await Listing.countDocuments({ status: 'pending' }),
      leavesPending: await Leave.countDocuments({ status: 'pending' }),
      avgRating: rated.length ? Math.round((rated.reduce((s, p) => s + p.rating.stars, 0) / rated.length) * 10) / 10 : null,
      flaggedReviews: rated.filter((p) => p.rating.flagged).length,
    },
    perDay: Object.values(perDay),
    kgByMaterial: Object.entries(kg).map(([m, v]) => ({ material: m, label: MATERIALS[m]?.label || m, kg: Math.round(v) })).sort((a, b) => b.kg - a.kg),
    areas: Object.entries(areas).map(([area, v]) => ({ area, kg: Math.round(v) })).sort((a, b) => b.kg - a.kg).slice(0, 6),
    unassigned: pickups.filter((p) => p.status === 'pending').slice(0, 5),
    recent: pickups.slice(0, 8),
  });
}));

router.get('/customer', customerOnly, wrap(async (req, res) => {
  const pickups = await Pickup.find({ user: req.user._id }).sort({ scheduledTime: -1 });
  const done = pickups.filter((p) => p.status === 'completed');
  const kg = done.reduce((s, p) => s + (p.weight || 0), 0);
  const months = Object.fromEntries(monthsBack(6).map((m) => [m, { month: m, kg: 0, count: 0 }]));
  done.forEach((p) => { const m = months[dayKey(p.completedAt || p.scheduledTime).slice(0, 7)]; if (m) { m.kg += p.weight || 0; m.count += 1; } });
  const byMaterial = {};
  done.forEach((p) => { byMaterial[p.pickupType] = (byMaterial[p.pickupType] || 0) + (p.weight || 0); });
  const now = new Date();
  const upcoming = pickups.filter((p) => ['pending', 'assigned', 'on-the-way'].includes(p.status)).sort((a, b) => a.scheduledTime - b.scheduledTime);
  res.json({
    totals: {
      pickups: pickups.length, completed: done.length, upcoming: upcoming.length,
      kg: Math.round(kg * 10) / 10, earned: done.reduce((s, p) => s + (p.amount || 0), 0),
      co2: Math.round(kg * CO2_PER_KG), trees: Math.round((kg * CO2_PER_KG) / KG_CO2_PER_TREE * 10) / 10,
      toRate: done.filter((p) => !p.rating?.stars).length,
    },
    months: Object.values(months).map((m) => ({ ...m, kg: Math.round(m.kg * 10) / 10 })),
    byMaterial: Object.entries(byMaterial).map(([m, v]) => ({ material: m, label: MATERIALS[m]?.label || m, kg: Math.round(v * 10) / 10 })),
    next: upcoming.find((p) => p.scheduledTime >= new Date(now.setHours(0, 0, 0, 0))) || upcoming[0] || null,
    note: 'Impact figures are estimates (about 1.5 kg CO2 saved per kg recycled).',
  });
}));

router.get('/driver', staffOnly, wrap(async (req, res) => {
  const mine = await Pickup.find({ driver: req.user._id });
  const done = mine.filter((p) => p.status === 'completed');
  const rated = done.filter((p) => p.rating?.stars);
  const days = lastDays(7);
  const perDay = Object.fromEntries(days.map((d) => [d, { date: d, completed: 0, kg: 0 }]));
  done.forEach((p) => { const d = perDay[dayKey(p.completedAt || p.scheduledTime)]; if (d) { d.completed += 1; d.kg += p.weight || 0; } });
  const today = dayKey(new Date());
  res.json({
    totals: {
      completed: done.length, kg: Math.round(done.reduce((s, p) => s + (p.weight || 0), 0)),
      cancelled: mine.filter((p) => p.status === 'cancelled').length,
      rating: rated.length ? Math.round((rated.reduce((s, p) => s + p.rating.stars, 0) / rated.length) * 10) / 10 : null,
      reviews: rated.length,
      today: mine.filter((p) => ['assigned', 'on-the-way'].includes(p.status) && dayKey(p.scheduledTime) === today).length,
      active: mine.filter((p) => ['assigned', 'on-the-way'].includes(p.status)).length,
      completionRate: mine.length ? Math.round((done.length / Math.max(1, done.length + mine.filter((p) => p.status === 'cancelled').length)) * 100) : 100,
    },
    perDay: Object.values(perDay).map((d) => ({ ...d, kg: Math.round(d.kg) })),
    recentReviews: rated.sort((a, b) => b.rating.at - a.rating.at).slice(0, 5).map((p) => ({ stars: p.rating.stars, feedback: p.rating.feedback, at: p.rating.at, material: p.pickupType })),
  });
}));

export default router;
