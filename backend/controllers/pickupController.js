import Pickup from '../models/Pickup.js';
import Driver from '../models/Driver.js';
import Transaction from '../models/Transaction.js';
import { getOptimizedRoute } from '../utils/googleMaps.js';
import { getRateMap, estimateAmount, SCALE_KG, MATERIALS, RECYCLER_MARGIN } from '../utils/pricing.js';
import { notify } from '../utils/notify.js';
import { HttpError, must } from '../utils/http.js';

const populate = (q) => q.populate('driver', 'firstName lastName phone vehicleNumber vehicleCategory').populate('user', 'name phone email');

const stamp = (pickup, status, by, note) => {
  pickup.status = status;
  pickup.timeline.push({ status, by, note });
};

const displayName = (u) => u.name || `${u.firstName} ${u.lastName}`;

// Load a pickup and make sure the caller may touch it
const loadFor = async (req, { ownerOnly = false } = {}) => {
  const pickup = must(await Pickup.findById(req.params.id), 404, 'Pickup not found');
  const isOwner = req.role === 'user' && pickup.user.toString() === req.user._id.toString();
  const isAssigned = req.role === 'driver' && pickup.driver?.toString() === req.user._id.toString();
  if (req.role === 'user' && !isOwner) throw new HttpError(403, 'This is not your pickup');
  if (ownerOnly && !isOwner) throw new HttpError(403, 'Only the customer can do this');
  if (req.role === 'driver' && !isAssigned) throw new HttpError(403, 'This pickup is not assigned to you');
  return pickup;
};

export const optimizeRoute = async (req, res) => {
  const { origin, destination, waypoints } = req.body;
  try {
    const optimizedRoute = await getOptimizedRoute(origin, destination, waypoints);
    res.status(200).json({ optimizedRoute });
  } catch (err) {
    throw new HttpError(502, 'Failed to optimise route: ' + err.message);
  }
};

// Customers book for themselves; staff may pass a user id
export const schedulePickup = async (req, res) => {
  const { address, pickupType, itemType, scale, scheduledTime, timeSlot, instructions, customerName, contactNumber, returnOption } = req.body;
  const material = pickupType || itemType;
  if (!address || !material || !scheduledTime) throw new HttpError(400, 'Material, address and date are required');
  if (!MATERIALS[material]) throw new HttpError(400, 'Unknown material');
  const when = new Date(scheduledTime);
  if (Number.isNaN(when.getTime())) throw new HttpError(400, 'Invalid date');

  const rates = await getRateMap();
  const estimatedWeight = SCALE_KG[scale] || undefined;
  const user = req.role === 'user' ? req.user._id : req.body.user;

  const pickup = new Pickup({
    user, address, pickupType: material, itemType: material, scale, scheduledTime: when,
    timeSlot: timeSlot || 'morning', instructions, customerName, contactNumber, returnOption,
    estimatedWeight, estimatedAmount: estimateAmount(rates, material, estimatedWeight),
  });
  stamp(pickup, 'pending', customerName || req.user.name, 'Pickup requested');
  await pickup.save();

  notify(user, { type: 'pickup', title: 'Pickup requested', body: `${MATERIALS[material].label} pickup at ${address}`, link: `/app/pickups/${pickup._id}` });
  res.status(201).json(pickup);
};

// Customer's own history
export const myPickups = async (req, res) => {
  const pickups = await populate(Pickup.find({ user: req.user._id }).sort({ scheduledTime: -1 }));
  res.json(pickups);
};

// Driver assignments: ?scope=active (default) | history | all
export const driverPickups = async (req, res) => {
  const scope = req.query.scope || 'active';
  const statuses = { active: ['assigned', 'on-the-way'], history: ['completed', 'cancelled'] }[scope];
  const filter = { driver: req.user._id, ...(statuses && { status: { $in: statuses } }) };
  const pickups = await populate(Pickup.find(filter).sort({ scheduledTime: scope === 'history' ? -1 : 1 }));
  res.json(pickups);
};

// Staff list. Admin sees everything (with filters); drivers are routed to their own list
export const listPickups = async (req, res) => {
  if (req.originalUrl.includes('/me')) return driverPickups(req, res);
  const { status, driver, q, from, to } = req.query;
  const filter = {};
  if (req.role === 'driver') filter.driver = req.user._id;
  else if (driver) filter.driver = driver === 'none' ? { $exists: false } : driver;
  if (status) filter.status = { $in: status.split(',') };
  if (q) filter.$or = [{ address: new RegExp(q, 'i') }, { customerName: new RegExp(q, 'i') }];
  if (from || to) filter.scheduledTime = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(to) }) };
  res.json(await populate(Pickup.find(filter).sort({ scheduledTime: -1 }).limit(500)));
};

export const getPickup = async (req, res) => {
  const pickup = await loadFor(req);
  await pickup.populate([{ path: 'driver', select: 'firstName lastName phone vehicleNumber vehicleCategory' }, { path: 'user', select: 'name phone email' }]);
  res.json(pickup);
};

export const assignPickup = async (req, res) => {
  const { pickupId, driverId } = req.body;
  const pickup = must(await Pickup.findById(pickupId), 404, 'Pickup not found');
  const driver = must(await Driver.findOne({ _id: driverId, role: 'driver' }), 404, 'Driver not found');
  if (['completed', 'cancelled'].includes(pickup.status)) throw new HttpError(400, `A ${pickup.status} pickup cannot be reassigned`);
  if (driver.status === 'unavailable' || driver.employeeStatus !== 'Active') throw new HttpError(400, `${driver.name} is not available for assignments`);

  pickup.driver = driver._id;
  stamp(pickup, 'assigned', req.user.name, `Assigned to ${driver.name}`);
  await pickup.save();

  notify(pickup.user, { type: 'pickup', title: 'Driver assigned', body: `${driver.name} will collect your ${MATERIALS[pickup.pickupType]?.label.toLowerCase()}.`, link: `/app/pickups/${pickup._id}` });
  notify(driver._id, { type: 'pickup', title: 'New pickup assigned', body: pickup.address, link: '/driver/pickups' });
  res.json(await populate(Pickup.findById(pickup._id)));
};

// Admin override
export const updatePickupStatus = async (req, res) => {
  const { pickupId, status, note } = req.body;
  const pickup = must(await Pickup.findById(pickupId), 404, 'Pickup not found');
  stamp(pickup, status, req.user.name, note);
  await pickup.save();
  res.json(pickup);
};

// Driver: assigned -> on-the-way
export const startPickup = async (req, res) => {
  const pickup = await loadFor(req);
  if (pickup.status !== 'assigned') throw new HttpError(400, 'Only assigned pickups can be started');
  stamp(pickup, 'on-the-way', req.user.name, 'Driver is on the way');
  await pickup.save();
  await Driver.findByIdAndUpdate(req.user._id, { status: 'on-route' });
  notify(pickup.user, { type: 'pickup', title: 'Driver is on the way', body: `${displayName(req.user)} is heading to ${pickup.address}.`, link: `/app/pickups/${pickup._id}` });
  res.json(pickup);
};

// Driver: complete with weight. The amount defaults to weight x current rate.
export const confirmPickup = async (req, res) => {
  const pickup = await loadFor(req);
  if (!['assigned', 'on-the-way'].includes(pickup.status)) throw new HttpError(400, 'This pickup is already closed');
  const weight = Number(req.body.weight);
  if (!(weight > 0)) throw new HttpError(400, 'Enter a weight above 0');

  const rates = await getRateMap();
  const amount = req.body.amount === '' || req.body.amount == null ? estimateAmount(rates, pickup.pickupType, weight) : Number(req.body.amount);
  if (!(amount >= 0)) throw new HttpError(400, 'Enter a valid amount');

  pickup.weight = weight;
  pickup.amount = amount;
  pickup.completedAt = new Date();
  stamp(pickup, 'completed', req.user.name, `${weight} kg collected`);
  await pickup.save();
  await Driver.findByIdAndUpdate(req.user._id, { status: 'available' });

  const customer = await pickup.populate('user', 'name');
  await Transaction.create({
    ref: `TX-${Date.now().toString(36).toUpperCase()}`,
    type: 'pickup-payout', amount, pickup: pickup._id, material: pickup.pickupType,
    recyclerValue: Math.round(estimateAmount(rates, pickup.pickupType, weight) * (1 + RECYCLER_MARGIN)),
    from: { id: req.user._id, name: displayName(req.user) },
    to: { id: pickup.user._id, name: customer.user.name },
    note: `${weight} kg ${pickup.pickupType}`,
  });
  notify(pickup.user._id, { type: 'pickup', title: 'Pickup completed', body: `${weight} kg collected. Rate your experience.`, link: `/app/pickups/${pickup._id}` });
  res.json(await populate(Pickup.findById(pickup._id)));
};

// Role-aware cancel: customers (before it starts), drivers (missed pickup, reason required), admins (any)
export const cancelPickup = async (req, res) => {
  const pickup = await loadFor(req);
  if (['completed', 'cancelled'].includes(pickup.status)) throw new HttpError(400, 'This pickup is already closed');
  const reason = (req.body.reason || '').trim();
  if (req.role === 'driver' && !reason) throw new HttpError(400, 'A reason is required');
  if (req.role === 'user' && pickup.status === 'on-the-way') throw new HttpError(400, 'The driver is already on the way. Please contact them instead.');

  pickup.cancelReason = reason;
  pickup.cancelledBy = req.role;
  stamp(pickup, 'cancelled', displayName(req.user), reason || 'Cancelled');
  await pickup.save();

  if (req.role !== 'user') notify(pickup.user, { type: 'pickup', title: 'Pickup cancelled', body: reason || 'Your pickup was cancelled.', link: `/app/pickups/${pickup._id}` });
  if (req.role !== 'driver' && pickup.driver) notify(pickup.driver, { type: 'pickup', title: 'Pickup cancelled', body: pickup.address, link: '/driver/pickups' });
  if (pickup.driver) await Driver.findByIdAndUpdate(pickup.driver, { status: 'available' });
  res.json(pickup);
};

export const reschedulePickup = async (req, res) => {
  const pickup = await loadFor(req, { ownerOnly: true });
  if (!['pending', 'assigned'].includes(pickup.status)) throw new HttpError(400, 'Only upcoming pickups can be rescheduled');
  const when = new Date(req.body.scheduledTime);
  if (Number.isNaN(when.getTime()) || when < new Date(Date.now() - 864e5)) throw new HttpError(400, 'Choose a future date');
  pickup.scheduledTime = when;
  if (req.body.timeSlot) pickup.timeSlot = req.body.timeSlot;
  pickup.timeline.push({ status: pickup.status, by: req.user.name, note: `Rescheduled to ${when.toDateString()}` });
  await pickup.save();
  if (pickup.driver) notify(pickup.driver, { type: 'pickup', title: 'Pickup rescheduled', body: `${pickup.address} moved to ${when.toDateString()}`, link: '/driver/pickups' });
  res.json(pickup);
};

export const ratePickup = async (req, res) => {
  const pickup = await loadFor(req, { ownerOnly: true });
  if (pickup.status !== 'completed') throw new HttpError(400, 'You can rate a pickup once it is completed');
  const stars = Number(req.body.stars);
  if (!(stars >= 1 && stars <= 5)) throw new HttpError(400, 'Rating must be 1 to 5 stars');
  pickup.rating = { stars, feedback: (req.body.feedback || '').trim(), at: new Date(), flagged: false };
  await pickup.save();
  if (pickup.driver) notify(pickup.driver, { type: 'pickup', title: `New ${stars}-star rating`, body: pickup.rating.feedback || 'A customer rated your pickup.', link: '/driver/performance' });
  res.json(pickup);
};

export const getInvoice = async (req, res) => {
  const pickup = await loadFor(req);
  if (pickup.status !== 'completed') throw new HttpError(400, 'Invoices are available for completed pickups');
  await pickup.populate([{ path: 'driver', select: 'firstName lastName' }, { path: 'user', select: 'name email phone address' }]);
  const rates = await getRateMap();
  res.json({
    invoiceNo: `INV-${pickup.completedAt.toISOString().slice(0, 7).replace('-', '')}-${pickup._id.toString().slice(-5).toUpperCase()}`,
    date: pickup.completedAt,
    customer: pickup.user,
    driver: pickup.driver?.name,
    address: pickup.address,
    material: MATERIALS[pickup.pickupType]?.label || pickup.pickupType,
    weight: pickup.weight,
    ratePerKg: rates[pickup.pickupType],
    returnOption: pickup.returnOption,
    amount: pickup.amount,
  });
};
