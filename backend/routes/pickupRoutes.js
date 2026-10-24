import express from 'express';
import {
  schedulePickup,
  assignPickup,
  updatePickupStatus,
  listPickups,
  optimizeRoute,
  confirmPickup,
  cancelPickup,
} from '../controllers/pickupController.js';
import { protect, driverOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes
router.post('/add', protect, schedulePickup);
router.post('/assign', protect, driverOnly, assignPickup);
router.post('/update-status', protect, driverOnly, updatePickupStatus);
router.get('/me', protect, driverOnly, listPickups);  // Driver-specific pickups
router.post('/optimize-route', protect, driverOnly, optimizeRoute);

router.put('/:id/confirm', protect, driverOnly, confirmPickup);
router.put('/:id/cancel', protect, driverOnly, cancelPickup);

router.get('/', protect, driverOnly, listPickups);

export default router;