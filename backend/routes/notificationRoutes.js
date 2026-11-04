import express from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/authMiddleware.js';
import { wrap } from '../utils/http.js';

const router = express.Router();
router.use(protect);

router.get('/', wrap(async (req, res) => {
  const items = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(100);
  res.json({ items, unread: items.filter((n) => !n.read).length });
}));
router.put('/read-all', wrap(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
}));
router.put('/:id/read', wrap(async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, recipient: req.user._id }, { read: true });
  res.json({ ok: true });
}));

export default router;
