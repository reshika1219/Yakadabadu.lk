import express from 'express';
import * as c from '../controllers/driverController.js';
import { protect, staffOnly, adminOnly } from '../middleware/authMiddleware.js';
import { wrap } from '../utils/http.js';

const router = express.Router();

router.post('/login', wrap(c.loginDriver));

router.use(protect, staffOnly);
router.get('/me', wrap(c.getCurrentDriver));
router.put('/me', wrap(c.updateMe));
router.put('/me/password', wrap(c.changePassword));
router.post('/update-location', wrap(c.updateDriverLocation));
router.post('/upload-profile-picture', wrap(c.uploadProfilePicture));

router.get('/', adminOnly, wrap(c.getDrivers));
router.post('/', adminOnly, wrap(c.createStaff));
router.post('/register', adminOnly, wrap(c.createStaff));
router.get('/:id', adminOnly, wrap(c.getDriverById));
router.put('/:id', adminOnly, wrap(c.updateDriver));
router.delete('/:id', adminOnly, wrap(c.deleteDriver));

export default router;
