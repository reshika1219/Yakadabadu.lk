import express from 'express';
import { summary, transactions, myFinance } from '../controllers/financeController.js';
import { protect, adminOnly, customerOnly } from '../middleware/authMiddleware.js';
import { wrap } from '../utils/http.js';

const router = express.Router();
router.use(protect);
router.get('/me', customerOnly, wrap(myFinance));
router.get('/summary', adminOnly, wrap(summary));
router.get('/transactions', adminOnly, wrap(transactions));
export default router;
