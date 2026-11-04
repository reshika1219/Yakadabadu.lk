import express from 'express';
import * as c from '../controllers/userController.js';
import { protect, customerOnly, adminOnly } from '../middleware/authMiddleware.js';
import { wrap } from '../utils/http.js';

const router = express.Router();
router.post('/register', wrap(c.registerUser));
router.post('/login', wrap(c.authUser));

router.get('/me', protect, customerOnly, wrap(c.getMe));
router.put('/me', protect, customerOnly, wrap(c.updateMe));
router.put('/me/password', protect, customerOnly, wrap(c.changePassword));

router.get('/', protect, adminOnly, wrap(c.listUsers));
router.put('/:id/suspend', protect, adminOnly, wrap(c.setSuspended));
export default router;
