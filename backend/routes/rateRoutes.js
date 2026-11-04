import express from 'express';
import { listRates, updateRate, estimate } from '../controllers/rateController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import { wrap } from '../utils/http.js';

const router = express.Router();
router.get('/', wrap(listRates));
router.post('/estimate', wrap(estimate));
router.put('/:material', protect, adminOnly, wrap(updateRate));
export default router;
