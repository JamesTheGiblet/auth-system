const User = require('../models/User');

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = (req, res, next) => {
  // The user object is attached to the request by the authenticateToken middleware
  res.status(200).json({ user: req.user });
};