import express from 'express';
import {
  registerDriver,
  loginDriver,
  getDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  updateDriverLocation,
  uploadProfilePicture,
  getCurrentDriver // Add this import
} from '../controllers/driverController.js';
import { protect, driverOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerDriver);
router.post('/login', loginDriver);

router.get('/me', protect, driverOnly, getCurrentDriver); // New route to get current driver's details
router.get('/', protect, driverOnly, getDrivers);
router.get('/:id', protect, driverOnly, getDriverById);

router.put('/:id', protect, driverOnly, updateDriver);
router.delete('/:id', protect, driverOnly, deleteDriver);

// Add the update-location route
router.post('/update-location', protect, driverOnly, updateDriverLocation);

// Add the upload-profile-picture route
router.post('/upload-profile-picture', protect, driverOnly, uploadProfilePicture);

export default router;
