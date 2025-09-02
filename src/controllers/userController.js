const User = require('../models/User');
const AppError = require('../utils/AppError');

// @desc    Get current logged in user
// @route   GET /api/users/me
// @access  Private
exports.getMe = (req, res, next) => {
  // The user object is attached to the request by the authenticateToken middleware
  res.status(200).json({ user: req.user });
};

// @desc    Update user password
// @route   PUT /api/users/update-password
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    // 1. Get user from the collection, ensuring we select the password
    const user = await User.findById(req.user.id).select('+password');

    // 2. Check if POSTed current password is correct
    const { currentPassword, newPassword } = req.body;
    if (!(await user.comparePassword(currentPassword))) {
      return next(new AppError('Your current password is incorrect', 401));
    }

    // 3. If so, update password
    user.password = newPassword;
    await user.save(); // The pre-save hook will hash the new password

    res.status(200).json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (name, email)
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    // Check if the new email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return next(new AppError('This email is already in use.', 409));
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name, email },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: 'Profile updated successfully.', user: updatedUser });
  } catch (error) {
    next(error);
  }
};