const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      next();
      return;
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      req.user = null;
      next();
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      req.user = null;
      next();
      return;
    }
    logger.error('Optional auth middleware error:', err);
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;
