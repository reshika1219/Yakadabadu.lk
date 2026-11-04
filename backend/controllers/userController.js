import User from '../models/User.js';
import Pickup from '../models/Pickup.js';
import Listing from '../models/Listing.js';
import Driver from '../models/Driver.js';
import { signToken } from '../middleware/authMiddleware.js';
import { notifyMany } from '../utils/notify.js';
import { HttpError, must } from '../utils/http.js';

const session = (user) => ({ _id: user._id, name: user.name, email: user.email, role: 'user', token: signToken(user._id, 30) });

export const registerUser = async (req, res) => {
  const { name, email, password, address, phone, type } = req.body;
  if (!name || !email || !password || !address || !phone) throw new HttpError(400, 'Please fill in every field');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  if (await User.findOne({ email: email.toLowerCase() })) throw new HttpError(400, 'An account with that email already exists');
  const user = await User.create({ name, email: email.toLowerCase(), password, address, phone, type });
  const admins = await Driver.find({ role: 'admin' }).select('_id');
  notifyMany(admins.map((a) => a._id), { type: 'info', title: 'New customer', body: `${user.name} just joined`, link: '/admin/customers' });
  res.status(201).json(session(user));
};

export const authUser = async (req, res) => {
  const user = await User.findOne({ email: (req.body.email || '').toLowerCase().trim() });
  if (!user || !(await user.matchPassword(req.body.password || ''))) throw new HttpError(401, 'Invalid email or password');
  if (user.suspended) throw new HttpError(403, 'This account has been suspended');
  res.json(session(user));
};

export const getMe = async (req, res) => res.json(req.user);

export const updateMe = async (req, res) => {
  const { name, phone, address, type, preferences } = req.body;
  const user = await User.findById(req.user._id);
  Object.assign(user, { ...(name && { name }), ...(phone && { phone }), ...(address && { address }), ...(type && { type }) });
  if (preferences) user.preferences = { ...user.preferences?.toObject?.(), ...preferences };
  await user.save();
  res.json(user);
};

export const changePassword = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(req.body.currentPassword || ''))) throw new HttpError(400, 'Current password is incorrect');
  if (!req.body.newPassword || req.body.newPassword.length < 8) throw new HttpError(400, 'New password must be at least 8 characters');
  user.password = req.body.newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
};

// Admin: customers with activity counts
export const listUsers = async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  const pickupStats = await Pickup.aggregate([{ $group: { _id: '$user', pickups: { $sum: 1 }, kg: { $sum: { $ifNull: ['$weight', 0] } }, last: { $max: '$scheduledTime' } } }]);
  const listingStats = await Listing.aggregate([{ $group: { _id: '$seller', listings: { $sum: 1 } } }]);
  const p = Object.fromEntries(pickupStats.map((s) => [s._id.toString(), s]));
  const l = Object.fromEntries(listingStats.map((s) => [s._id.toString(), s]));
  res.json(users.map((u) => ({ ...u.toJSON(), pickups: p[u._id]?.pickups || 0, kg: p[u._id]?.kg || 0, lastPickup: p[u._id]?.last, listings: l[u._id]?.listings || 0 })));
};

export const setSuspended = async (req, res) => {
  const user = must(await User.findById(req.params.id), 404, 'Customer not found');
  user.suspended = !!req.body.suspended;
  await user.save();
  res.json(user);
};
