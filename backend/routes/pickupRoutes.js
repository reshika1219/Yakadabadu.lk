import express from 'express';
import * as c from '../controllers/pickupController.js';
import { protect, staffOnly, adminOnly } from '../middleware/authMiddleware.js';
import { wrap } from '../utils/http.js';

const router = express.Router();
router.use(protect);

router.post('/add', wrap(c.schedulePickup));
router.get('/mine', wrap(c.myPickups));
router.get('/me', staffOnly, wrap(c.driverPickups));
router.get('/', staffOnly, wrap(c.listPickups));
router.post('/assign', adminOnly, wrap(c.assignPickup));
router.post('/update-status', adminOnly, wrap(c.updatePickupStatus));
router.post('/optimize-route', staffOnly, wrap(c.optimizeRoute));

router.get('/:id', wrap(c.getPickup));
router.get('/:id/invoice', wrap(c.getInvoice));
router.put('/:id/start', staffOnly, wrap(c.startPickup));
router.put('/:id/confirm', staffOnly, wrap(c.confirmPickup));
router.put('/:id/cancel', wrap(c.cancelPickup));
router.put('/:id/reschedule', wrap(c.reschedulePickup));
router.post('/:id/rate', wrap(c.ratePickup));

export default router;
