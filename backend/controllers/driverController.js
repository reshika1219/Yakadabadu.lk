import bcrypt from 'bcryptjs';
import Driver from '../models/Driver.js';
import Pickup from '../models/Pickup.js';
import { signToken } from '../middleware/authMiddleware.js';
import { HttpError, must } from '../utils/http.js';

const STAFF_FIELDS = ['firstName', 'middleName', 'lastName', 'phone', 'birthday', 'nationality', 'employeeType', 'employeeStatus', 'nic', 'vehicleCategory', 'vehicleNumber', 'role', 'status', 'joinedDate'];
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));

// Staff login (drivers and admins)
export const loginDriver = async (req, res) => {
  const { email, password } = req.body;
  const driver = await Driver.findOne({ email: (email || '').toLowerCase().trim() });
  if (!driver || !(await bcrypt.compare(password || '', driver.password))) throw new HttpError(401, 'Invalid email or password');
  if (driver.employeeStatus === 'Inactive') throw new HttpError(403, 'This staff account is inactive');
  res.json({
    token: signToken(driver._id),
    role: driver.role,
    driver: { id: driver._id, name: driver.name, email: driver.email, role: driver.role },
  });
};

// Admin adds staff
export const createStaff = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password || password.length < 8) throw new HttpError(400, 'Email and a password of at least 8 characters are required');
  if (await Driver.findOne({ email: email.toLowerCase() })) throw new HttpError(400, 'A staff member with that email already exists');
  const driver = await Driver.create({ ...pick(req.body, STAFF_FIELDS), email: email.toLowerCase(), password: await bcrypt.hash(password, 10) });
  res.status(201).json(driver);
};

// Staff list with performance stats (admin)
export const getDrivers = async (_req, res) => {
  const drivers = await Driver.find().sort({ role: 1, firstName: 1 });
  const stats = await Pickup.aggregate([
    { $match: { driver: { $ne: null } } },
    { $group: {
      _id: '$driver',
      assigned: { $sum: { $cond: [{ $in: ['$status', ['assigned', 'on-the-way']] }, 1, 0] } },
      completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
      kg: { $sum: { $ifNull: ['$weight', 0] } },
      rating: { $avg: '$rating.stars' },
      reviews: { $sum: { $cond: [{ $gt: ['$rating.stars', 0] }, 1, 0] } },
    } },
  ]);
  const byId = Object.fromEntries(stats.map((s) => [s._id.toString(), s]));
  res.json(drivers.map((d) => {
    const s = byId[d._id.toString()] || {};
    return { ...d.toJSON(), stats: { assigned: s.assigned || 0, completed: s.completed || 0, cancelled: s.cancelled || 0, kg: s.kg || 0, rating: s.rating ? Math.round(s.rating * 10) / 10 : null, reviews: s.reviews || 0 } };
  }));
};

export const getCurrentDriver = async (req, res) => {
  res.json({ ...req.user.toJSON(), fullName: req.user.name });
};

export const getDriverById = async (req, res) => {
  res.json(must(await Driver.findById(req.params.id), 404, 'Staff member not found'));
};

// Admin edits staff (whitelisted fields only)
export const updateDriver = async (req, res) => {
  const driver = must(await Driver.findById(req.params.id), 404, 'Staff member not found');
  if (req.params.id === req.user._id.toString() && req.body.role && req.body.role !== 'admin') throw new HttpError(400, 'You cannot remove your own admin access');
  Object.assign(driver, pick(req.body, STAFF_FIELDS));
  if (req.body.password) {
    if (req.body.password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
    driver.password = await bcrypt.hash(req.body.password, 10);
  }
  await driver.save();
  res.json(driver);
};

export const deleteDriver = async (req, res) => {
  if (req.params.id === req.user._id.toString()) throw new HttpError(400, 'You cannot delete your own account');
  const driver = must(await Driver.findByIdAndDelete(req.params.id), 404, 'Staff member not found');
  await Pickup.updateMany({ driver: driver._id, status: { $in: ['assigned', 'on-the-way'] } }, { $set: { status: 'pending' }, $unset: { driver: '' } });
  res.json({ message: 'Staff member removed; their open pickups are back in the queue' });
};

// Self-service
export const updateMe = async (req, res) => {
  const allowed = pick(req.body, ['phone', 'vehicleCategory', 'vehicleNumber', 'status', 'profilePicture']);
  if (allowed.status && !['available', 'unavailable'].includes(allowed.status)) throw new HttpError(400, 'Status must be available or unavailable');
  res.json(await Driver.findByIdAndUpdate(req.user._id, allowed, { new: true }));
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const driver = await Driver.findById(req.user._id);
  if (!(await bcrypt.compare(currentPassword || '', driver.password))) throw new HttpError(400, 'Current password is incorrect');
  if (!newPassword || newPassword.length < 8) throw new HttpError(400, 'New password must be at least 8 characters');
  driver.password = await bcrypt.hash(newPassword, 10);
  await driver.save();
  res.json({ message: 'Password updated' });
};

export const updateDriverLocation = async (req, res) => {
  const { lat, lng } = req.body;
  res.json(await Driver.findByIdAndUpdate(req.user._id, { currentLocation: { lat, lng } }, { new: true }));
};

export const uploadProfilePicture = async (req, res) => {
  res.json(await Driver.findByIdAndUpdate(req.user._id, { profilePicture: req.body.profilePicture }, { new: true }));
};
