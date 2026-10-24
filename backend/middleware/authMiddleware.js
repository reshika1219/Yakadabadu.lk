import jwt from 'jsonwebtoken';
import Driver from '../models/Driver.js';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      error: 'Not authorized, no token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentDriver = await Driver.findById(decoded.id).select('-password');
    const currentUser = currentDriver ? null : await User.findById(decoded.id).select('-password');

    if (!currentDriver && !currentUser) {
      return res.status(401).json({
        status: 'fail',
        error: 'The account belonging to this token no longer exists'
      });
    }

    req.user = currentDriver || currentUser;
    req.role = currentDriver ? 'driver' : 'user';
    next();
  } catch (error) {
    let errorMessage = 'Not authorized, token failed';
    if (error.name === 'TokenExpiredError') {
      errorMessage = 'Token expired, please login again';
    } else if (error.name === 'JsonWebTokenError') {
      errorMessage = 'Invalid token, please login again';
    }

    return res.status(401).json({
      status: 'fail',
      error: errorMessage
    });
  }
};

const driverOnly = (req, res, next) => {
  if (req.role !== 'driver') {
    return res.status(403).json({ status: 'fail', error: 'Driver access only' });
  }
  next();
};

export { protect, driverOnly };