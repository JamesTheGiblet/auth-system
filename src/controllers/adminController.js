const User = require('../models/User');
const AppError = require('../utils/AppError');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const total = await User.countDocuments();
    const users = await User.find({}).skip(startIndex).limit(limit);

    // Pagination result metadata
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      total,
      pagination,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const userIdToDelete = req.params.id;

    // Prevent an admin from deleting their own account
    if (req.user.id === userIdToDelete) {
      return next(new AppError('You cannot delete your own account.', 400));
    }

    const user = await User.findByIdAndDelete(userIdToDelete);

    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user's roles
// @route   PUT /api/admin/users/:id/roles
// @access  Private/Admin
exports.updateUserRoles = async (req, res, next) => {
  try {
    const { roles } = req.body;
    const userIdToUpdate = req.params.id;

    // Prevent an admin from changing their own roles
    if (req.user.id === userIdToUpdate) {
      return next(new AppError('You cannot change your own roles.', 400));
    }

    const user = await User.findById(userIdToUpdate);

    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }

    user.roles = roles;
    await user.save({ validateBeforeSave: true }); // Run schema validators on save

    res.status(200).json({ message: 'User roles updated successfully.', user });
  } catch (error) {
    next(error);
  }
};