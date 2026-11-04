import { protect } from './authMiddleware.js';

// Attach the user when a valid token is sent, but let anonymous requests through
export default (req, res, next) =>
  req.headers.authorization ? protect(req, res, next) : next();
