import jwt from 'jsonwebtoken';
import Driver from '../models/Driver.js';
import User from '../models/User.js';

export const signToken = (id, days = 7) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: `${days}d` });

// Resolves the bearer token to a user and sets req.role to 'user' | 'driver' | 'admin'
const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer') ? header.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ status: 'fail', error: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const staff = await Driver.findById(decoded.id).select('-password');
    const customer = staff ? null : await User.findById(decoded.id).select('-password');

    if (!staff && !customer) {
      return res.status(401).json({ status: 'fail', error: 'The account belonging to this token no longer exists' });
    }
    if (customer?.suspended) {
      return res.status(403).json({ status: 'fail', error: 'This account has been suspended' });
    }

    req.user = staff || customer;
    req.role = staff ? staff.role : 'user';
    next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError' ? 'Session expired, please log in again'
        : error.name === 'JsonWebTokenError' ? 'Invalid token, please log in again'
          : 'Not authorized, token failed';
    return res.status(401).json({ status: 'fail', error: message });
  }
};

const allow = (roles, message) => (req, res, next) =>
  roles.includes(req.role) ? next() : res.status(403).json({ status: 'fail', error: message });

const staffOnly = allow(['driver', 'admin'], 'Staff access only');
const driverOnly = staffOnly; // kept for older imports
const adminOnly = allow(['admin'], 'Admin access only');
const customerOnly = allow(['user'], 'Customer access only');

export { protect, driverOnly, staffOnly, adminOnly, customerOnly };
