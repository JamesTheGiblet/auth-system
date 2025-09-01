// src/middleware/auth.js
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyToken(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  // The 'roles' parameter should be an array of allowed roles, e.g., ['admin']
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check if the user's roles array has at least one of the required roles.
    const hasRequiredRole = req.user.roles.some(role => roles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// const requirePermission = (permission) => {
//   return (req, res, next) => {
//     if (!req.user) {
//       return res.status(401).json({ message: 'Authentication required' });
//     }

//     // This will fail as the User model does not have a 'permissions' field.
//     // This feature can be implemented later by adding a permissions array to the User schema.
//     if (!req.user.permissions.includes(permission)) {
//       return res.status(403).json({ message: 'Insufficient permissions' });
//     }

//     next();
//   };
// };

module.exports = {
  authenticateToken,
  requireRole,
  // requirePermission
};