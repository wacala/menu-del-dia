const jwt = require('jsonwebtoken');
const config = require('../config');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: req.t ? req.t('No token provided') : 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    req.user = jwt.verify(token, config.jwt.secret);
    return next();
  } catch (error) {
    return res.status(401).json({ message: req.t ? req.t('Invalid token') : 'Invalid token' });
  }
};

const authorize = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: req.t ? req.t('Not authenticated') : 'Not authenticated' });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: req.t ? req.t('Insufficient permissions') : 'Insufficient permissions' });
  }

  return next();
};

module.exports = { authenticate, authorize };
