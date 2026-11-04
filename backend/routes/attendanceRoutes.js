import express from 'express';
import Attendance from '../models/Attendance.js';
import { protect, staffOnly, adminOnly } from '../middleware/authMiddleware.js';
import { wrap, HttpError } from '../utils/http.js';

const router = express.Router();
router.use(protect, staffOnly);

const today = () => new Date().toISOString().slice(0, 10);

router.get('/me', wrap(async (req, res) => {
  const records = await Attendance.find({ driver: req.user._id }).sort({ date: -1 }).limit(60);
  res.json({ today: records.find((r) => r.date === today()) || null, records });
}));

router.post('/check-in', wrap(async (req, res) => {
  const existing = await Attendance.findOne({ driver: req.user._id, date: today() });
  if (existing) throw new HttpError(400, 'You have already checked in today');
  res.status(201).json(await Attendance.create({ driver: req.user._id, date: today(), checkIn: new Date() }));
}));

router.post('/check-out', wrap(async (req, res) => {
  const record = await Attendance.findOne({ driver: req.user._id, date: today() });
  if (!record) throw new HttpError(400, 'Check in first');
  if (record.checkOut) throw new HttpError(400, 'You have already checked out today');
  record.checkOut = new Date();
  await record.save();
  res.json(record);
}));

router.get('/', adminOnly, wrap(async (req, res) => {
  const filter = req.query.date ? { date: req.query.date } : {};
  res.json(await Attendance.find(filter).populate('driver', 'firstName lastName').sort({ date: -1 }).limit(300));
}));

export default router;
