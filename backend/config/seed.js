import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import Driver from '../models/Driver.js';
import User from '../models/User.js';
import Pickup from '../models/Pickup.js';
import Listing from '../models/Listing.js';
import Transaction from '../models/Transaction.js';
import Notification from '../models/Notification.js';
import Attendance from '../models/Attendance.js';
import Leave from '../models/Leave.js';
import Rate from '../models/Rate.js';
import { ensureRates, MATERIALS, SCALE_KG, COMMISSION, RECYCLER_MARGIN } from '../utils/pricing.js';

export const DEMO_PASSWORD = 'Demo@1234';
// Bump to rebuild the embedded demo database with fresh sample data
const SEED_VERSION = 4;

// Small deterministic RNG so every fresh database looks the same
const rng = (seed) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const DAY = 864e5;
const at = (daysAgo, hour = 10) => { const d = new Date(Date.now() - daysAgo * DAY); d.setHours(hour, 0, 0, 0); return d; };
const slotHour = { morning: 9, afternoon: 14, evening: 17 };

const ADDRESSES = [
  '12 Galle Road, Colombo 03', '45 Temple Road, Nugegoda', '8 Lake Drive, Rajagiriya', '22 High Level Road, Maharagama',
  '5 Station Road, Dehiwala', '17 Parliament Road, Battaramulla', '90 Kandy Road, Kelaniya', '31 Baseline Road, Colombo 09',
  '14 Lake Road, Boralesgamuwa', '60 Galle Road, Mount Lavinia',
];
const FEEDBACK = [
  'Very punctual and polite. Thank you!', 'Quick and professional, weighed everything in front of me.', 'Great service, will book again.',
  'Driver was a little late but friendly.', 'Smooth pickup, fair price.', 'Helpful with the heavy items.', 'Easy booking, easy pickup.',
];

export const seedDemoData = async () => {
  const meta = mongoose.connection.db.collection('meta');
  const current = await meta.findOne({ _id: 'seed' });
  const hasData = (await User.countDocuments()) + (await Driver.countDocuments()) > 0;
  if (current?.version === SEED_VERSION && hasData) return;
  if (hasData && process.env.KEEP_DATA === 'true') return;
  if (hasData) {
    console.log('Refreshing embedded demo data (seed version changed)...');
    await mongoose.connection.dropDatabase();
  }

  const rand = rng(42);
  const choice = (arr) => arr[Math.floor(rand() * arr.length)];
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ----- Rates (with a little price history so trends show) -----
  await ensureRates();
  const trend = { metal: [108, 112, 118], plastic: [58, 56, 55], paper: [28, 29, 30], glass: [12, 12, 12], ewaste: [140, 150, 160], wood: [20, 19, 18] };
  for (const r of await Rate.find()) {
    const h = trend[r.material];
    if (h) { r.history = h.map((price, i) => ({ price, at: at(60 - i * 20) })); r.pricePerKg = MATERIALS[r.material].base; r.history.push({ price: r.pricePerKg }); await r.save(); }
  }
  const price = Object.fromEntries((await Rate.find()).map((r) => [r.material, r.pricePerKg]));

  // ----- Staff -----
  const staffBase = { password: hash, nationality: 'Sri Lankan', employeeType: 'Permanent', employeeStatus: 'Active' };
  const admin = await Driver.create({ ...staffBase, firstName: 'Amara', lastName: 'Jayasuriya', email: 'admin@demo.lk', phone: '0711000000', role: 'admin', employeeId: 'EMP-000', nic: '198511200001', birthday: new Date('1985-04-20'), joinedDate: new Date('2022-01-10') });
  const drivers = await Driver.create([
    { ...staffBase, firstName: 'Nimal', lastName: 'Perera', email: 'driver@demo.lk', phone: '0772200100', employeeId: 'EMP-001', nic: '199210200123', birthday: new Date('1992-04-12'), joinedDate: new Date('2023-01-15'), vehicleCategory: 'Lorry', vehicleNumber: 'LK-4521' },
    { ...staffBase, firstName: 'Sunil', lastName: 'Fernando', email: 'sunil@demo.lk', phone: '0772200200', employeeId: 'EMP-002', nic: '198807140456', birthday: new Date('1988-07-14'), joinedDate: new Date('2023-06-01'), vehicleCategory: 'Mini truck', vehicleNumber: 'LK-7788', employeeType: 'Contract' },
    { ...staffBase, firstName: 'Ayesha', lastName: 'Rahman', email: 'ayesha@demo.lk', phone: '0772200300', employeeId: 'EMP-003', nic: '199506300789', birthday: new Date('1995-06-30'), joinedDate: new Date('2024-02-12'), vehicleCategory: 'Van', vehicleNumber: 'LK-3310' },
  ]);
  const [nimal, sunil, ayesha] = drivers;

  // ----- Customers -----
  const custBase = { password: DEMO_PASSWORD, // hashed by the User model
    preferences: { materials: [], timeSlot: '' } };
  const customers = await User.create([
    { ...custBase, name: 'Kamani Silva', email: 'customer@demo.lk', phone: '0771234567', address: '12 Galle Road, Colombo 03', preferences: { materials: ['metal', 'plastic'], timeSlot: 'morning', notifyEmail: true } },
    { ...custBase, name: 'Ruwan Wickramasinghe', email: 'ruwan@demo.lk', phone: '0779876543', address: '45 Temple Road, Nugegoda' },
    { ...custBase, name: 'Dilini Perera', email: 'dilini@demo.lk', phone: '0714455667', address: '8 Lake Drive, Rajagiriya' },
    { ...custBase, name: 'Gunawardena Metals', email: 'metals@demo.lk', phone: '0112345678', address: '31 Baseline Road, Colombo 09', type: 'industrial' },
    { ...custBase, name: 'Nadeesha Fonseka', email: 'nadeesha@demo.lk', phone: '0765566778', address: '5 Station Road, Dehiwala' },
  ]);
  const [kamani] = customers;

  // ----- Pickups: ~45 days of history -----
  const pickups = [];
  const transactions = [];
  const mkTimeline = (status, when, who, driverName, extra = {}) => {
    const t = [{ status: 'pending', at: new Date(when - 3 * DAY), by: who, note: 'Pickup requested' }];
    if (status === 'cancelled' && !extra.driver) { t.push({ status: 'cancelled', at: new Date(when - DAY), by: who, note: extra.reason }); return t; }
    if (['assigned', 'on-the-way', 'completed', 'cancelled'].includes(status)) t.push({ status: 'assigned', at: new Date(when - 2 * DAY), by: 'Amara Jayasuriya', note: `Assigned to ${driverName}` });
    if (['on-the-way', 'completed'].includes(status)) t.push({ status: 'on-the-way', at: new Date(+when - 3600e3), by: driverName, note: 'Driver is on the way' });
    if (status === 'completed') t.push({ status: 'completed', at: new Date(+when + 1800e3), by: driverName, note: `${extra.weight} kg collected` });
    if (status === 'cancelled' && extra.driver) t.push({ status: 'cancelled', at: new Date(+when), by: driverName, note: extra.reason });
    return t;
  };

  for (let i = 0; i < 58; i += 1) {
    const daysAgo = 2 + Math.floor((i / 58) * 44);
    const customer = i % 3 === 0 ? kamani : choice(customers);
    const driver = choice(drivers);
    const material = choice(['metal', 'metal', 'plastic', 'paper', 'glass', 'ewaste', 'wood', 'plastic']);
    const slot = choice(['morning', 'afternoon', 'evening']);
    const when = at(daysAgo, slotHour[slot]);
    const cancelled = rand() < 0.08;
    const weight = Math.round((3 + rand() * (customer.type === 'industrial' ? 80 : 30)) * 10) / 10;
    const returnOption = rand() < 0.8 ? 'cash' : choice(['broom', 'basin', 'nothing']);
    const amount = returnOption === 'cash' ? Math.round(weight * price[material] * (0.92 + rand() * 0.16)) : 0;
    const scale = weight < 5 ? 'small' : weight < 10 ? 'medium' : weight < 20 ? 'large' : 'extra-large';
    const doc = {
      user: customer._id, driver: driver._id, address: customer.address, pickupType: material, itemType: material, scale, scheduledTime: when, timeSlot: slot,
      customerName: customer.name, contactNumber: customer.phone, returnOption, estimatedWeight: SCALE_KG[scale],
      estimatedAmount: Math.round(SCALE_KG[scale] * price[material]),
      instructions: rand() < 0.4 ? choice(['Gate code 2210', 'Please call on arrival', 'Items are in the garage', 'Ring the bell twice']) : undefined,
    };
    if (cancelled) {
      const reason = choice(['Customer not at home', 'Items were not ready', 'Vehicle breakdown']);
      Object.assign(doc, { status: 'cancelled', cancelReason: reason, cancelledBy: 'driver', timeline: mkTimeline('cancelled', when, customer.name, driver.name, { driver: true, reason }) });
    } else {
      Object.assign(doc, { status: 'completed', weight, amount, completedAt: new Date(+when + 1800e3), timeline: mkTimeline('completed', when, customer.name, driver.name, { weight }) });
      if (rand() < 0.72) {
        const stars = rand() < 0.65 ? 5 : rand() < 0.7 ? 4 : rand() < 0.6 ? 3 : 2;
        doc.rating = { stars, feedback: stars >= 4 ? choice(FEEDBACK) : choice(['Arrived later than planned.', 'Price was lower than I expected.']), at: new Date(+when + 3 * 3600e3), flagged: false };
      }
    }
    pickups.push(doc);
  }
  const lowRated = pickups.find((p) => p.rating?.stars === 2);
  if (lowRated) lowRated.rating.flagged = true; // gives the admin review queue something to moderate

  // Today and upcoming
  const mk = (customer, driver, material, status, dayOffset, slot, scale, extra = {}) => {
    const when = at(-dayOffset, slotHour[slot]);
    return {
      user: customer._id, driver: driver?._id, address: extra.address || customer.address, pickupType: material, itemType: material, scale, scheduledTime: when, timeSlot: slot,
      customerName: customer.name, contactNumber: customer.phone, returnOption: 'cash', estimatedWeight: SCALE_KG[scale], estimatedAmount: Math.round(SCALE_KG[scale] * price[material]),
      status, instructions: extra.instructions, timeline: mkTimeline(status, when, customer.name, driver?.name || ''),
    };
  };
  pickups.push(
    mk(kamani, nimal, 'metal', 'on-the-way', 0, 'morning', 'medium', { instructions: 'Items are in the garage' }),
    mk(customers[1], nimal, 'plastic', 'assigned', 0, 'afternoon', 'small'),
    mk(customers[3], nimal, 'metal', 'assigned', 0, 'evening', 'extra-large', { instructions: 'Use the rear loading gate' }),
    mk(customers[2], sunil, 'wood', 'assigned', 1, 'morning', 'large'),
    mk(kamani, ayesha, 'paper', 'assigned', 2, 'afternoon', 'medium'),
    mk(customers[4], null, 'glass', 'pending', 2, 'morning', 'small', { address: '60 Galle Road, Mount Lavinia' }),
    mk(customers[2], null, 'ewaste', 'pending', 3, 'afternoon', 'medium', { address: '17 Parliament Road, Battaramulla' }),
    mk(kamani, null, 'plastic', 'pending', 4, 'morning', 'large'),
  );
  const savedPickups = await Pickup.insertMany(pickups);

  for (const p of savedPickups.filter((x) => x.status === 'completed')) {
    const d = drivers.find((x) => x._id.equals(p.driver));
    const c = customers.find((x) => x._id.equals(p.user));
    transactions.push({
      ref: `TX-${p._id.toString().slice(-6).toUpperCase()}`, type: 'pickup-payout', amount: p.amount, material: p.pickupType, pickup: p._id,
      recyclerValue: Math.round(p.weight * price[p.pickupType] * (1 + RECYCLER_MARGIN)), from: { id: d._id, name: d.name }, to: { id: c._id, name: c.name },
      note: `${p.weight} kg ${p.pickupType}`, date: p.completedAt,
    });
  }

  // ----- Marketplace -----
  const L = (seller, title, category, condition, listPrice, daysAgo, status, description, city, extra = {}) =>
    ({ seller: seller._id, sellerName: seller.name, title, category, condition, price: listPrice, status, description, city, createdAt: at(daysAgo), ...extra });
  const offer = (c, amount, message, status = 'pending') => ({ buyer: c._id, buyerName: c.name, amount, message, status });
  const listings = await Listing.insertMany([
    L(kamani, 'Solid teak study desk', 'furniture', 'good', 18500, 12, 'approved', 'Sturdy teak desk with two drawers. Minor surface scratches, no structural damage. Collection from Colombo 03.', 'Colombo 03', { views: 64, offers: [offer(customers[1], 15000, 'Can you do 15k? I can collect this weekend.'), offer(customers[2], 16500, 'Interested, is the desk still available?')] }),
    L(kamani, 'Samsung 32" LED TV (working)', 'electronics', 'good', 22000, 8, 'approved', 'Full HD, remote included. Works perfectly, replaced for a larger screen.', 'Colombo 03', { views: 91 }),
    L(kamani, 'Set of 4 steel pipe sections', 'metal-parts', 'fair', 6500, 3, 'pending', 'Galvanised steel pipes, 2 m each. Good for DIY frames or fencing.', 'Colombo 03'),
    L(customers[1], 'Front-load washing machine', 'appliances', 'for-parts', 9000, 15, 'approved', 'Motor works, drum bearing is worn. Sold for parts or repair.', 'Nugegoda', { views: 38 }),
    L(customers[2], 'Wooden bookshelf, 5 tiers', 'furniture', 'like-new', 12000, 10, 'approved', 'Barely used, assembled once. Matte walnut finish.', 'Rajagiriya', { views: 55, offers: [offer(kamani, 10000, 'Would you take Rs. 10,000?')] }),
    L(customers[3], 'Aluminium roofing sheets (bundle of 20)', 'building', 'good', 48000, 6, 'approved', 'Surplus from a finished project. 8 ft sheets, unused.', 'Colombo 09', { views: 29 }),
    L(customers[3], 'Industrial bench grinder', 'tools', 'good', 14500, 5, 'approved', 'Works well. Includes a spare wheel.', 'Colombo 09', { views: 17 }),
    L(customers[4], 'Mountain bike, 21-speed', 'other', 'fair', 16000, 4, 'pending', 'Needs new brake pads. Frame is in great shape.', 'Dehiwala'),
    L(customers[2], 'Office chair with lumbar support', 'furniture', 'good', 7500, 20, 'sold', 'Adjustable height and tilt.', 'Rajagiriya', { views: 47, buyer: kamani._id, buyerName: kamani.name, soldPrice: 7000, soldAt: at(14) }),
    L(customers[1], 'Old CRT television', 'electronics', 'for-parts', 2000, 9, 'rejected', 'CRT televisions are not accepted on the marketplace.', 'Nugegoda', { adminNote: 'We do not list CRT televisions. Offer it as an e-waste pickup instead.' }),
  ]);
  const chair = listings.find((l) => l.status === 'sold');
  transactions.push({ ref: 'TX-CHAIR1', type: 'resale', amount: 7000, commission: Math.round(7000 * COMMISSION), from: { id: kamani._id, name: kamani.name }, to: { id: chair.seller, name: chair.sellerName }, listing: chair._id, note: chair.title, date: at(14) });
  await Transaction.insertMany(transactions);

  // ----- Attendance and leave -----
  const records = [];
  for (let d = 0; d < 12; d += 1) {
    const day = new Date(Date.now() - d * DAY);
    if ([0, 6].includes(day.getDay())) continue;
    const date = day.toISOString().slice(0, 10);
    for (const driver of drivers) {
      if (driver === ayesha && d === 3) continue; // a day off
      const ci = new Date(day); ci.setHours(7, 40 + Math.floor(rand() * 40), 0, 0);
      const co = new Date(day); co.setHours(16, 30 + Math.floor(rand() * 60), 0, 0);
      records.push({ driver: driver._id, date, checkIn: ci, ...(d > 0 && { checkOut: co }) });
    }
  }
  await Attendance.insertMany(records);
  await Leave.insertMany([
    { driver: sunil._id, from: at(-6), to: at(-8), reason: 'Family function in Kandy', status: 'pending' },
    { driver: ayesha._id, from: at(3), to: at(3), reason: 'Medical appointment', status: 'approved', decisionNote: 'Approved. Feel better soon.', decidedBy: admin.name },
  ]);

  // ----- Notifications -----
  const n = (recipient, type, title, body, link, hoursAgo, read = false) => ({ recipient, type, title, body, link, read, createdAt: new Date(Date.now() - hoursAgo * 3600e3) });
  const todayPickup = savedPickups.find((p) => p.status === 'on-the-way');
  await Notification.insertMany([
    n(kamani._id, 'pickup', 'Driver is on the way', 'Nimal Perera is heading to 12 Galle Road, Colombo 03.', `/app/pickups/${todayPickup._id}`, 0.5),
    n(kamani._id, 'market', 'New offer received', 'Ruwan Wickramasinghe offered Rs. 15,000 for Solid teak study desk.', '/app/market', 5),
    n(kamani._id, 'market', 'Your listing is under review', 'Set of 4 steel pipe sections', '/app/market', 20, true),
    n(kamani._id, 'info', 'Metal prices are up', 'Metal is now Rs. 120 per kg, up from Rs. 118.', '/prices', 48, true),
    n(nimal._id, 'pickup', 'New pickup assigned', '17 Parliament Road, Battaramulla', '/driver/pickups', 3),
    n(nimal._id, 'pickup', 'New 5-star rating', 'Very punctual and polite. Thank you!', '/driver/performance', 30, true),
    n(admin._id, 'leave', 'Leave request', 'Sunil Fernando requested leave', '/admin/staff', 2),
    n(admin._id, 'market', 'New listing awaiting review', 'Set of 4 steel pipe sections', '/admin/marketplace', 4),
    n(admin._id, 'info', 'New customer', 'Nadeesha Fonseka just joined', '/admin/customers', 26, true),
  ]);

  await meta.updateOne({ _id: 'seed' }, { $set: { version: SEED_VERSION } }, { upsert: true });
  console.log(`Seeded demo data. Staff: admin@demo.lk, driver@demo.lk | Customer: customer@demo.lk (password ${DEMO_PASSWORD})`);
};
