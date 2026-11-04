import express from 'express';
import Pickup from '../models/Pickup.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { wrap, must } from '../utils/http.js';

const router = express.Router();
router.use(protect, adminOnly);

router.get('/', wrap(async (_req, res) => {
  const pickups = await Pickup.find({ 'rating.stars': { $gt: 0 } })
    .populate('driver', 'firstName lastName').populate('user', 'name')
    .sort({ 'rating.at': -1 }).limit(200);
  res.json(pickups);
}));

router.put('/:id/flag', wrap(async (req, res) => {
  const pickup = must(await Pickup.findById(req.params.id), 404, 'Review not found');
  pickup.rating.flagged = !!req.body.flagged;
  await pickup.save();
  res.json(pickup);
}));

export default router;
