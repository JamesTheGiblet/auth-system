const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/email');
const AppError = require('../utils/AppError');
const crypto = require('crypto');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('A user with this email already exists.', 409)); // 409 Conflict
    }

    // 2. Create new user (password will be hashed by the pre-save hook)
    const user = new User({
      name,
      email,
      password
    });

    // 3. Generate verification token
    const verificationToken = user.createEmailVerificationToken();
    await user.save();

    // 4. Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken);
      res.status(201).json({
        message: 'Registration successful! Please check your email to verify your account.'
      });
    } catch (emailError) {
      return next(new AppError('Email could not be sent. Please try again later.', 500));
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify user's email
// @route   GET /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res, next) => {
  try {
    // 1. Get token from query string and hash it for comparison
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.query.token)
      .digest('hex');

    // 2. Find user by token and check if token is still valid (not expired)
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    // 3. If token is invalid or expired, send error
    if (!user) {
      return next(new AppError('Token is invalid or has expired.', 400));
    }

    // 4. If token is valid, update user, clear token fields, and save
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};