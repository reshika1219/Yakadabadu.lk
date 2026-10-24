import Pickup from '../models/Pickup.js';
import { getOptimizedRoute } from '../utils/googleMaps.js';
import Driver from '../models/Driver.js';
import User from '../models/User.js';


// Optimize route using Google Maps API
export const optimizeRoute = async (req, res) => {
  try {
    const { origin, destination } = req.body;
    const optimizedRoute = await getOptimizedRoute(origin, destination);
    res.status(200).json({ optimizedRoute });
  } catch (err) {
    res.status(500).json({ error: 'Failed to optimize route: ' + err.message });
  }
};

// Schedule a pickup (customers schedule for themselves; drivers may pass a user id)
export const schedulePickup = async (req, res) => {
  try {
    const {
      address, pickupType, scheduledTime,
      itemType, scale, customerName, contactNumber, returnOption,
    } = req.body;
    const user = req.role === 'user' ? req.user._id : req.body.user;
    const pickup = new Pickup({
      user, address, pickupType: pickupType || itemType, scheduledTime,
      itemType, scale, customerName, contactNumber, returnOption,
    });
    await pickup.save();
    res.status(201).json(pickup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Assign a pickup to a driver
export const assignPickup = async (req, res) => {
  try {
    const { pickupId, driverId } = req.body;

    const pickup = await Pickup.findById(pickupId);
    if (!pickup) return res.status(404).json({ error: 'Pickup not found' });
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    const user = await User.findById(pickup.user);
    if (!user) return res.status(404).json({ error: 'User not found' });

    pickup.driver = driverId;
    pickup.status = 'assigned';
    await pickup.save();

    res.status(200).json(pickup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update pickup status
export const updatePickupStatus = async (req, res) => {
  try {
    const { pickupId, status } = req.body;
    const pickup = await Pickup.findById(pickupId);
    if (!pickup) return res.status(404).json({ error: "Pickup not found" });

    pickup.status = status;
    await pickup.save();
    res.status(200).json(pickup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List all pickups
export const listPickups = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filter = req.originalUrl.includes('/me') ? {
      driver: req.user._id,
      scheduledTime: { $gte: today },
      status: 'assigned'
    } : {};

    const pickups = await Pickup.find(filter)
      .populate('driver', 'firstName lastName')
      .populate('user', 'name');

    res.status(200).json(pickups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Driver confirms a completed pickup
export const confirmPickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) return res.status(404).json({ error: 'Pickup not found' });
    if (pickup.driver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'This pickup is not assigned to you' });
    }
    const { weight, amount } = req.body;
    pickup.status = 'completed';
    pickup.weight = weight;
    pickup.amount = amount;
    await pickup.save();
    res.status(200).json(pickup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Driver cancels a pickup with a reason
export const cancelPickup = async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) return res.status(404).json({ error: 'Pickup not found' });
    if (pickup.driver?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'This pickup is not assigned to you' });
    }
    pickup.status = 'cancelled';
    pickup.cancelReason = req.body.reason;
    await pickup.save();
    res.status(200).json(pickup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
