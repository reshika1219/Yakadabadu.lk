import express from 'express';
import Leave from '../models/Leave.js';
import Driver from '../models/Driver.js';
import { protect, staffOnly, adminOnly } from '../middleware/authMiddleware.js';
import { wrap, HttpError, must } from '../utils/http.js';
import { notify, notifyMany } from '../utils/notify.js';

const router = express.Router();
router.use(protect, staffOnly);

router.get('/me', wrap(async (req, res) => {
  res.json(await Leave.find({ driver: req.user._id }).sort({ createdAt: -1 }));
}));

router.post('/', wrap(async (req, res) => {
  const { from, to, reason } = req.body;
  const start = new Date(from), end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) throw new HttpError(400, 'Choose valid dates');
  if (end < start) throw new HttpError(400, 'The end date is before the start date');
  if (!reason?.trim()) throw new HttpError(400, 'Please give a reason');
  const leave = await Leave.create({ driver: req.user._id, from: start, to: end, reason: reason.trim() });
  const admins = await Driver.find({ role: 'admin' }).select('_id');
  notifyMany(admins.map((a) => a._id), { type: 'leave', title: 'Leave request', body: `${req.user.name}: ${start.toDateString()} to ${end.toDateString()}`, link: '/admin/staff' });
  res.status(201).json(leave);
}));

router.delete('/:id', wrap(async (req, res) => {
  const leave = must(await Leave.findOne({ _id: req.params.id, driver: req.user._id }), 404, 'Request not found');
  if (leave.status !== 'pending') throw new HttpError(400, 'Only pending requests can be withdrawn');
  await leave.deleteOne();
  res.json({ message: 'Request withdrawn' });
}));

router.get('/', adminOnly, wrap(async (_req, res) => {
  res.json(await Leave.find().populate('driver', 'firstName lastName').sort({ createdAt: -1 }).limit(200));
}));

router.put('/:id', adminOnly, wrap(async (req, res) => {
  const { status, note } = req.body;
  if (!['approved', 'rejected'].includes(status)) throw new HttpError(400, 'Status must be approved or rejected');
  const leave = must(await Leave.findById(req.params.id), 404, 'Request not found');
  leave.status = status;
  leave.decisionNote = note;
  leave.decidedBy = req.user.name;
  await leave.save();
  notify(leave.driver, { type: 'leave', title: `Leave ${status}`, body: note || `${leave.from.toDateString()} to ${leave.to.toDateString()}`, link: '/driver/availability' });
  res.json(leave);
}));

export default router;
